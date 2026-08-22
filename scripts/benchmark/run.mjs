#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import {
  access,
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  stat,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { launchChromium } from '../qa/chromium.mjs';
import { createCanvasImageDecoder, fitWithin } from './lib/browser-image.mjs';
import {
  clippingDiagnostics,
  compareImages,
  unsupportedObjectiveMetrics,
} from './lib/image-metrics.mjs';
import { validateManifestText } from './validate-manifest.mjs';

const execFileAsync = promisify(execFile);
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const SCHEMA_PATH = path.join(SCRIPT_DIR, 'manifest.schema.json');
const SPLITS = new Set(['calibration', 'validation', 'holdout']);

function usage() {
  return [
    'Usage:',
    '  node scripts/benchmark/run.mjs \\',
    '    --manifest private-data/matcha-benchmark/v1/manifest.jsonl \\',
    '    --split validation \\',
    '    --candidate current-webgl \\',
    '    --out benchmark-results/raw/current-validation',
    '',
    'Optional:',
    '  --aggregate-out benchmark-results/aggregates/current-validation',
    '  --base-url http://127.0.0.1:3000',
    '  --eval-max-edge 512',
    '  --timeout-ms 30000',
    '  --allow-synthetic-smoke',
    '',
    'The app must already be running at --base-url. Output inside the repository',
    'is accepted only under a gitignored path. Existing non-empty output is refused.',
    'A separate --aggregate-out is checked for deidentification and must be committable.',
  ].join('\n');
}

function parseArgs(argv) {
  while (argv[0] === '--') argv = argv.slice(1);
  if (argv.includes('--help') || argv.includes('-h')) return { help: true };
  const known = new Set([
    '--manifest',
    '--split',
    '--candidate',
    '--out',
    '--aggregate-out',
    '--base-url',
    '--eval-max-edge',
    '--timeout-ms',
    '--allow-synthetic-smoke',
  ]);
  const values = {};
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    if (!known.has(flag)) throw new Error(`Unknown argument: ${flag}`);
    if (flag === '--allow-synthetic-smoke') {
      values.allow_synthetic_smoke = true;
      continue;
    }
    const value = argv[++index];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`${flag} requires a value.`);
    }
    values[flag.slice(2).replaceAll('-', '_')] = value;
  }
  for (const required of ['manifest', 'split', 'candidate', 'out']) {
    if (!values[required]) throw new Error(`--${required} is required.`);
  }
  if (!SPLITS.has(values.split)) {
    throw new Error('--split must be calibration, validation, or holdout.');
  }
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(values.candidate)) {
    throw new Error('--candidate must be a bounded lowercase candidate ID.');
  }
  const evalMaxEdge = Number(values.eval_max_edge ?? 512);
  const timeoutMs = Number(values.timeout_ms ?? 30_000);
  if (
    !Number.isInteger(evalMaxEdge) ||
    evalMaxEdge < 64 ||
    evalMaxEdge > 4096
  ) {
    throw new Error('--eval-max-edge must be an integer from 64 through 4096.');
  }
  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1_000 ||
    timeoutMs > 300_000
  ) {
    throw new Error(
      '--timeout-ms must be an integer from 1000 through 300000.'
    );
  }
  return {
    manifest: values.manifest,
    split: values.split,
    candidate: values.candidate,
    out: values.out,
    aggregateOut: values.aggregate_out ?? null,
    baseUrl: validateLoopbackUrl(values.base_url ?? 'http://127.0.0.1:3000'),
    evalMaxEdge,
    timeoutMs,
    allowSyntheticSmoke: values.allow_synthetic_smoke === true,
  };
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return (
    relative !== '' &&
    !relative.startsWith(`..${path.sep}`) &&
    relative !== '..' &&
    !path.isAbsolute(relative)
  );
}

function validateLoopbackUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('--base-url must be a valid URL.');
  }
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error(
      '--base-url must be an unauthenticated loopback HTTP(S) URL so private media cannot be sent to a remote page.'
    );
  }
  return url.toString().replace(/\/$/, '');
}

async function refuseSymlinkComponents(target, boundary) {
  let current = target;
  while (current !== boundary && isInside(boundary, current)) {
    try {
      if ((await lstat(current)).isSymbolicLink()) {
        throw new Error(
          'Benchmark output paths cannot traverse symbolic links.'
        );
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    current = path.dirname(current);
  }
}

async function ensureSafeOutput(outputPath) {
  if (outputPath === REPO_ROOT)
    throw new Error('Refusing to use the repository root as output.');
  if (isInside(REPO_ROOT, outputPath)) {
    const rawRoot = path.join(REPO_ROOT, 'benchmark-results', 'raw');
    if (!isInside(rawRoot, outputPath)) {
      throw new Error(
        'Repository raw output must remain under benchmark-results/raw/.'
      );
    }
    await refuseSymlinkComponents(outputPath, REPO_ROOT);
    const relative = path.relative(REPO_ROOT, outputPath);
    try {
      await execFileAsync('git', ['check-ignore', '--quiet', '--', relative], {
        cwd: REPO_ROOT,
      });
    } catch {
      throw new Error(
        `Repository output must be gitignored before use: ${relative}`
      );
    }
  }
  try {
    const info = await lstat(outputPath);
    if (info.isSymbolicLink())
      throw new Error('Output cannot be a symbolic link.');
    if (!info.isDirectory())
      throw new Error('Output exists and is not a directory.');
    if ((await readdir(outputPath)).length > 0) {
      throw new Error(
        'Output directory is not empty; choose a new run directory.'
      );
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await mkdir(path.join(outputPath, 'private-items'), { recursive: true });
}

async function ensureAggregateOutput(aggregateOutputPath, rawOutputPath) {
  if (!isInside(REPO_ROOT, aggregateOutputPath)) {
    throw new Error(
      '--aggregate-out must be a committable directory inside the repository.'
    );
  }
  if (
    aggregateOutputPath === rawOutputPath ||
    isInside(rawOutputPath, aggregateOutputPath) ||
    isInside(aggregateOutputPath, rawOutputPath) ||
    isInside(path.join(REPO_ROOT, 'private-data'), aggregateOutputPath) ||
    isInside(
      path.join(REPO_ROOT, 'benchmark-results', 'raw'),
      aggregateOutputPath
    )
  ) {
    throw new Error(
      '--aggregate-out cannot be inside raw or private benchmark storage.'
    );
  }
  await refuseSymlinkComponents(aggregateOutputPath, REPO_ROOT);
  const relative = path.relative(REPO_ROOT, aggregateOutputPath);
  try {
    await execFileAsync('git', ['check-ignore', '--quiet', '--', relative], {
      cwd: REPO_ROOT,
    });
    throw new Error(
      '--aggregate-out is gitignored and therefore is not committable.'
    );
  } catch (error) {
    if (error.message.includes('not committable')) throw error;
  }
  try {
    const info = await lstat(aggregateOutputPath);
    if (info.isSymbolicLink())
      throw new Error('--aggregate-out cannot be a symbolic link.');
    if (!info.isDirectory())
      throw new Error('--aggregate-out exists and is not a directory.');
    if ((await readdir(aggregateOutputPath)).length > 0) {
      throw new Error(
        '--aggregate-out is not empty; choose a new report directory.'
      );
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await mkdir(aggregateOutputPath, { recursive: true });
}

function parseJsonl(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function sha256File(filePath) {
  const digest = createHash('sha256');
  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => digest.update(chunk));
    stream.on('error', reject);
    stream.on('end', resolve);
  });
  return digest.digest('hex');
}

async function resolvePrivateMedia(relativePath) {
  const privateRoot = path.join(REPO_ROOT, 'private-data');
  const candidate = path.resolve(REPO_ROOT, relativePath);
  if (!isInside(privateRoot, candidate)) {
    throw new Error('Manifest media path escaped the private-data boundary.');
  }
  const [actualPrivateRoot, actualPath] = await Promise.all([
    realpath(privateRoot),
    realpath(candidate),
  ]);
  if (!isInside(actualPrivateRoot, actualPath)) {
    throw new Error(
      'Manifest media symlink escaped the private-data boundary.'
    );
  }
  const info = await stat(actualPath);
  if (!info.isFile())
    throw new Error('Manifest media path is not a regular file.');
  return actualPath;
}

async function gitMetadata() {
  const [{ stdout: commit }, { stdout: dirty }] = await Promise.all([
    execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT }),
    execFileAsync('git', ['status', '--porcelain'], { cwd: REPO_ROOT }),
  ]);
  return { commit: commit.trim(), dirty: dirty.trim().length > 0 };
}

async function codeHashes(candidateId) {
  const files = [
    `scripts/benchmark/candidates/${candidateId}.mjs`,
    'src/lib/matcha/analyze.ts',
    'src/lib/matcha/presets.ts',
    'src/lib/matcha/renderer.ts',
    'src/lib/matcha/shaders.ts',
  ];
  return Object.fromEntries(
    await Promise.all(
      files.map(async (relative) => [
        relative,
        await sha256File(path.join(REPO_ROOT, relative)),
      ])
    )
  );
}

function safeItemFileName(pairId) {
  return pairId.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function transformCoverage(decoded) {
  return {
    sourceWidth: decoded.source.width,
    sourceHeight: decoded.source.height,
    outputWidth: decoded.width,
    outputHeight: decoded.height,
    crop: decoded.crop,
    sourceCoverage:
      (decoded.crop.sw * decoded.crop.sh) /
      (decoded.source.width * decoded.source.height),
  };
}

function checkDecodedMetadata(entry, role, inspected) {
  const expected = entry[`${role}_metadata`];
  if (
    inspected.width !== expected.width ||
    inspected.height !== expected.height
  ) {
    throw new Error(
      `${role} decoded dimensions do not match reviewed manifest metadata.`
    );
  }
}

function requireComparablePair(entry) {
  const original = entry.original_metadata;
  const filtered = entry.filtered_metadata;
  const sameDimensions =
    original.width === filtered.width && original.height === filtered.height;
  if (!['not_required', 'aligned'].includes(entry.alignment_status)) {
    throw new Error(
      'Objective comparison refused: alignment status is unresolved.'
    );
  }
  if (sameDimensions) return 'identity-scale';
  const originalAspect = original.width / original.height;
  const filteredAspect = filtered.width / filtered.height;
  const relativeAspectDifference =
    Math.abs(originalAspect - filteredAspect) /
    Math.min(originalAspect, filteredAspect);
  if (entry.alignment_status !== 'aligned' || relativeAspectDifference > 0.02) {
    throw new Error(
      'Objective comparison refused: differing geometry lacks a compatible reviewed alignment.'
    );
  }
  return 'reviewed-aligned-center-crop-and-scale';
}

function deltaMetrics(baseline, candidate) {
  return {
    ciede2000Mean: candidate.ciede2000.mean - baseline.ciede2000.mean,
    ciede2000P95: candidate.ciede2000.p95 - baseline.ciede2000.p95,
    lumaSsim: candidate.lumaSsim.score - baseline.lumaSsim.score,
    gradientSimilarity:
      candidate.gradientStructure.similarity -
      baseline.gradientStructure.similarity,
    lumaAbsoluteErrorMean:
      candidate.lumaAbsoluteError.mean - baseline.lumaAbsoluteError.mean,
    saturationAbsoluteErrorMean:
      candidate.saturationAbsoluteError.mean -
      baseline.saturationAbsoluteError.mean,
  };
}

function getNumber(value, dottedPath) {
  const result = dottedPath
    .split('.')
    .reduce((current, key) => current?.[key], value);
  return typeof result === 'number' && Number.isFinite(result) ? result : null;
}

function summarize(values) {
  const finite = values
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  if (finite.length === 0)
    return {
      count: 0,
      mean: null,
      median: null,
      p95: null,
      min: null,
      max: null,
    };
  const percentile = (fraction) =>
    finite[
      Math.min(
        finite.length - 1,
        Math.max(0, Math.ceil(fraction * finite.length) - 1)
      )
    ];
  return {
    count: finite.length,
    mean: finite.reduce((total, value) => total + value, 0) / finite.length,
    median: percentile(0.5),
    p95: percentile(0.95),
    min: finite[0],
    max: finite.at(-1),
  };
}

const AGGREGATE_METRICS = Object.freeze({
  'candidate.ciede2000.mean': 'Candidate CIEDE2000 mean (lower is better)',
  'candidate.ciede2000.p95': 'Candidate CIEDE2000 p95 (lower is better)',
  'baseline.ciede2000.mean': 'Filtered baseline CIEDE2000 mean',
  'candidate.lumaSsim.score': 'Candidate luma SSIM (higher is better)',
  'baseline.lumaSsim.score': 'Filtered baseline luma SSIM',
  'candidate.gradientStructure.similarity':
    'Candidate Sobel structure similarity',
  'clipping.introduced.totalFraction': 'Candidate-introduced clipping fraction',
  'delta.ciede2000Mean': 'CIEDE2000 mean delta vs filtered baseline',
  'delta.lumaSsim': 'Luma SSIM delta vs filtered baseline',
  'performance.endToEndMs': 'Browser end-to-end processing duration (ms)',
  'performance.sourceCanvas.pixels': 'Peak application canvas pixels',
});

function aggregateMetrics(items) {
  return Object.fromEntries(
    Object.entries(AGGREGATE_METRICS).map(([metricPath, description]) => [
      metricPath,
      {
        description,
        ...summarize(items.map((item) => getNumber(item.metrics, metricPath))),
      },
    ])
  );
}

function buildAggregate({
  run,
  selected,
  successes,
  failures,
  candidateParameters,
}) {
  const categories = [
    ...new Set(selected.map((entry) => entry.scene_category)),
  ].sort();
  const faceRoiRequired = selected.some((entry) => entry.has_adult_faces);
  const videoRequired = selected.some((entry) => entry.media_type === 'video');
  const coverage = {
    fullImagePhoto: {
      supported: true,
      required: selected.some((entry) => entry.media_type === 'photo'),
      complete:
        successes.length ===
        selected.filter((entry) => entry.media_type === 'photo').length,
    },
    faceRoiCiede2000: {
      supported: false,
      required: faceRoiRequired,
      complete: !faceRoiRequired,
      reason: unsupportedObjectiveMetrics.find(
        ({ id }) => id === 'face-roi-ciede2000'
      ).reason,
    },
    visibleHaloScore: {
      supported: false,
      required: false,
      complete: false,
      availableDiagnostic: 'Sobel gradient structure similarity',
      reason: unsupportedObjectiveMetrics.find(
        ({ id }) => id === 'visible-halo-score'
      ).reason,
    },
    videoOpticalFlow: {
      supported: false,
      required: videoRequired,
      complete: !videoRequired,
      reason: unsupportedObjectiveMetrics.find(
        ({ id }) => id === 'video-optical-flow-flicker'
      ).reason,
    },
  };
  const coverageFailed = Object.values(coverage).some(
    ({ required, complete }) => required && !complete
  );
  return {
    schemaVersion: '1.0',
    privacy: {
      classification:
        run.purpose === 'synthetic-smoke'
          ? 'deidentified synthetic smoke aggregate; not benchmark evidence'
          : 'deidentified aggregate',
      containsPrivatePaths: false,
      containsPairIds: false,
      containsThumbnails: false,
      perItemResultsDirectory: 'private-items (gitignored/private)',
    },
    run,
    status: failures.length > 0 || coverageFailed ? 'failed' : 'success',
    counts: {
      selected: selected.length,
      succeeded: successes.length,
      failed: failures.length,
      photo: selected.filter((entry) => entry.media_type === 'photo').length,
      video: selected.filter((entry) => entry.media_type === 'video').length,
      adultFaceItems: selected.filter((entry) => entry.has_adult_faces).length,
    },
    candidateParameters,
    metricCoverage: coverage,
    unsupportedObjectiveMetrics,
    metrics: aggregateMetrics(successes),
    categories: Object.fromEntries(
      categories.map((category) => {
        const entries = successes.filter((item) => item.category === category);
        return [
          category,
          { count: entries.length, metrics: aggregateMetrics(entries) },
        ];
      })
    ),
    failureClasses: Object.fromEntries(
      [...new Set(failures.map((failure) => failure.failureClass))]
        .sort()
        .map((failureClass) => [
          failureClass,
          failures.filter((failure) => failure.failureClass === failureClass)
            .length,
        ])
    ),
  };
}

function assertAggregateIsDeidentified(aggregate, markdown, selected) {
  const serialized = `${JSON.stringify(aggregate)}\n${markdown}`;
  if (
    serialized.includes('private-data/') ||
    serialized.includes('benchmark-results/raw/')
  ) {
    throw new Error(
      'Aggregate privacy invariant failed: a private or raw path reached the public report.'
    );
  }
  const strings = new Set();
  const collectStrings = (value) => {
    if (typeof value === 'string') {
      strings.add(value);
    } else if (Array.isArray(value)) {
      value.forEach(collectStrings);
    } else if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        strings.add(key);
        collectStrings(child);
      }
    }
  };
  collectStrings(aggregate);
  const privateIdentifiers = new Set();
  for (const entry of selected) {
    for (const field of [
      'pair_id',
      'capture_group_id',
      'original_path',
      'filtered_path',
      'rights_id',
    ]) {
      if (typeof entry[field] === 'string')
        privateIdentifiers.add(entry[field]);
    }
  }
  const match = [...privateIdentifiers].find((value) => strings.has(value));
  if (match) {
    throw new Error(
      'Aggregate privacy invariant failed: a private identifier reached the public report.'
    );
  }
}

function markdownReport(aggregate) {
  const metricRows = Object.entries(aggregate.metrics)
    .map(
      ([name, value]) =>
        `| ${name} | ${value.count} | ${value.mean ?? 'n/a'} | ${value.median ?? 'n/a'} | ${value.p95 ?? 'n/a'} |`
    )
    .join('\n');
  const coverageRows = Object.entries(aggregate.metricCoverage)
    .map(
      ([name, value]) =>
        `| ${name} | ${value.required ? 'yes' : 'no'} | ${value.supported ? 'yes' : 'no'} | ${value.complete ? 'yes' : 'no'} |`
    )
    .join('\n');
  const title =
    aggregate.run.purpose === 'synthetic-smoke'
      ? 'Matcha restoration synthetic smoke aggregate'
      : 'Matcha restoration benchmark aggregate';
  const evidenceWarning =
    aggregate.run.purpose === 'synthetic-smoke'
      ? '\n> Smoke-only output. This is not dataset quality evidence and cannot be used as a holdout result.\n'
      : '';
  return `# ${title}

Status: **${aggregate.status}**
${evidenceWarning}

This report is deidentified: it contains no private filenames, pair IDs, or thumbnails.

## Run

- Candidate: ${aggregate.run.candidateId}
- Split: ${aggregate.run.parameters.split}
- Tool commit: ${aggregate.run.tool.commit}${aggregate.run.tool.dirty ? ' (dirty worktree)' : ''}
- Manifest SHA-256: ${aggregate.run.manifestSha256}
- Browser: ${aggregate.run.browser.name} ${aggregate.run.browser.version}
- OS: ${aggregate.run.os.platform} ${aggregate.run.os.release} ${aggregate.run.os.arch}
- Timestamp: ${aggregate.run.timestamp}
- Items: ${aggregate.counts.succeeded} succeeded / ${aggregate.counts.selected} selected

## Aggregate metrics

| Metric | n | Mean | Median | p95 |
| --- | ---: | ---: | ---: | ---: |
${metricRows}

## Metric coverage

| Coverage area | Required by selected data | Supported | Complete |
| --- | --- | --- | --- |
${coverageRows}

Face ROI scores are not produced without reviewed ROI annotations. The Sobel structure diagnostic is not labelled as a visible-halo score. Video motion/optical-flow scores are not implemented, and selected video items fail instead of receiving proxy metrics.
`;
}

function failureClass(error) {
  const text = String(error?.message ?? error).toLowerCase();
  if (text.includes('unsupported') || text.includes('video'))
    return 'unsupported-metric-coverage';
  if (text.includes('decode') || text.includes('dimensions'))
    return 'decode-or-metadata';
  if (text.includes('alignment') || text.includes('geometric'))
    return 'alignment';
  if (text.includes('sha-256') || text.includes('hash')) return 'integrity';
  if (
    text.includes('webgl') ||
    text.includes('canvas') ||
    text.includes('shipping tool')
  )
    return 'candidate-execution';
  return 'item-processing';
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    console.error(usage());
    process.exitCode = 2;
    return;
  }
  if (args.help) {
    console.log(usage());
    return;
  }

  const manifestPath = path.resolve(REPO_ROOT, args.manifest);
  const outputPath = path.resolve(REPO_ROOT, args.out);
  const aggregateOutputPath = args.aggregateOut
    ? path.resolve(REPO_ROOT, args.aggregateOut)
    : null;
  let browser;
  let decoder;
  let candidate;
  try {
    await ensureSafeOutput(outputPath);
    if (aggregateOutputPath) {
      await ensureAggregateOutput(aggregateOutputPath, outputPath);
    }
    await access(manifestPath);
    const [manifestText, schemaText, tool, hashes] = await Promise.all([
      readFile(manifestPath, 'utf8'),
      readFile(SCHEMA_PATH, 'utf8'),
      gitMetadata(),
      codeHashes(args.candidate),
    ]);
    const schema = JSON.parse(schemaText);
    const validation = validateManifestText(manifestText, {
      schema,
      repoRoot: REPO_ROOT,
    });
    if (!validation.valid) {
      throw new Error(
        `Manifest validation failed: ${validation.errors.join(' | ')}`
      );
    }
    const selected = parseJsonl(manifestText)
      .filter(
        (entry) =>
          entry.split === args.split && entry.record_status === 'accepted'
      )
      .sort((left, right) => left.pair_id.localeCompare(right.pair_id));
    if (selected.length === 0) {
      throw new Error(
        `No accepted entries were found for split ${args.split}.`
      );
    }
    const selectedSynthetic = selected.filter(
      (entry) => entry.source_kind === 'synthetic'
    );
    if (!args.allowSyntheticSmoke && selectedSynthetic.length > 0) {
      throw new Error(
        'Synthetic records are excluded from benchmark runs; use --allow-synthetic-smoke for an explicitly non-benchmark smoke run.'
      );
    }
    if (args.allowSyntheticSmoke) {
      if (args.split === 'holdout') {
        throw new Error(
          'Synthetic smoke mode is prohibited for the holdout split.'
        );
      }
      if (selectedSynthetic.length !== selected.length) {
        throw new Error(
          'Synthetic smoke mode requires a split containing only synthetic records; mixed evidence is refused.'
        );
      }
    }

    const candidateModuleUrl = pathToFileURL(
      path.join(SCRIPT_DIR, 'candidates', `${args.candidate}.mjs`)
    );
    const candidateModule = await import(candidateModuleUrl.href);
    if (
      candidateModule.id !== args.candidate ||
      typeof candidateModule.createCandidate !== 'function'
    ) {
      throw new Error(
        'Candidate module ID or createCandidate export is invalid.'
      );
    }

    const prepared = [];
    for (const entry of selected) {
      const [originalPath, filteredPath] = await Promise.all([
        resolvePrivateMedia(entry.original_path),
        resolvePrivateMedia(entry.filtered_path),
      ]);
      const [originalHash, filteredHash] = await Promise.all([
        sha256File(originalPath),
        sha256File(filteredPath),
      ]);
      if (originalHash !== entry.original_sha256) {
        throw new Error(
          `SHA-256 mismatch for original media in pair ${entry.pair_id}.`
        );
      }
      if (filteredHash !== entry.filtered_sha256) {
        throw new Error(
          `SHA-256 mismatch for filtered media in pair ${entry.pair_id}.`
        );
      }
      prepared.push({ entry, originalPath, filteredPath });
    }

    browser = await launchChromium({
      headless: true,
      args: [
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
      ],
    });
    decoder = await createCanvasImageDecoder(browser);
    candidate = await candidateModule.createCandidate({
      browser,
      baseUrl: args.baseUrl,
      timeoutMs: args.timeoutMs,
    });
    const browserVersion = browser.version();
    const runParameters = {
      split: args.split,
      evaluationMaxEdge: args.evalMaxEdge,
      timeoutMs: args.timeoutMs,
      seed: 0,
      itemOrder: 'pair_id lexical ascending',
      decoder: 'Chromium HTMLImageElement + sRGB 2D Canvas',
      alignmentPolicy:
        'reviewed status plus equal aspect; deterministic center crop/scale',
    };
    const run = {
      runId: createHash('sha256')
        .update(
          JSON.stringify({
            manifestSha256: validation.manifestSha256,
            candidateId: args.candidate,
            candidateSourceSha256:
              hashes[`scripts/benchmark/candidates/${args.candidate}.mjs`],
            browserVersion,
            parameters: runParameters,
          })
        )
        .digest('hex')
        .slice(0, 16),
      timestamp: new Date().toISOString(),
      purpose: args.allowSyntheticSmoke ? 'synthetic-smoke' : 'benchmark',
      candidateId: args.candidate,
      manifestSha256: validation.manifestSha256,
      tool: { ...tool, sourceSha256: hashes },
      browser: { name: 'Chromium', version: browserVersion },
      os: { platform: os.platform(), release: os.release(), arch: os.arch() },
      parameters: runParameters,
    };

    const successes = [];
    const failures = [];
    let candidateParameters = null;
    for (const [index, item] of prepared.entries()) {
      const { entry, originalPath, filteredPath } = item;
      const privateResultPath = path.join(
        outputPath,
        'private-items',
        `${String(index + 1).padStart(4, '0')}-${safeItemFileName(entry.pair_id)}.json`
      );
      try {
        if (entry.media_type !== 'photo') {
          throw new Error(
            'Video objective metrics are unsupported: timeline alignment and motion-compensated optical-flow flicker are not implemented.'
          );
        }
        const alignmentMethod = requireComparablePair(entry);
        const originalInfo = await decoder.inspect(originalPath);
        const filteredInfo = await decoder.inspect(filteredPath);
        checkDecodedMetadata(entry, 'original', originalInfo);
        checkDecodedMetadata(entry, 'filtered', filteredInfo);
        const evaluationSize = fitWithin(
          filteredInfo.width,
          filteredInfo.height,
          args.evalMaxEdge
        );
        const original = await decoder.decode(originalPath, evaluationSize);
        const filtered = await decoder.decode(filteredPath, evaluationSize);
        const candidateResult = await candidate.runPhoto({
          filteredPath,
          evaluationSize,
        });
        if (candidateParameters === null) {
          candidateParameters = candidateResult.parameters;
        } else if (
          JSON.stringify(candidateParameters) !==
          JSON.stringify(candidateResult.parameters)
        ) {
          throw new Error(
            'Candidate parameters changed between deterministic items.'
          );
        }
        const baseline = compareImages(original, filtered);
        const current = compareImages(original, candidateResult.image);
        const clipping = clippingDiagnostics(candidateResult.image, filtered);
        const metrics = {
          baseline,
          candidate: current,
          clipping,
          delta: deltaMetrics(baseline, current),
          performance: candidateResult.performance,
        };
        const perItem = {
          schemaVersion: '1.0',
          privacy: 'private per-item result',
          run,
          status: 'success',
          item: {
            pairId: entry.pair_id,
            split: entry.split,
            category: entry.scene_category,
            mediaType: entry.media_type,
            hasAdultFaces: entry.has_adult_faces,
          },
          parameters: candidateResult.parameters,
          normalization: {
            evaluationSize,
            alignmentMethod,
            manifestAlignmentStatus: entry.alignment_status,
            originalTransform: transformCoverage(original),
            filteredTransform: transformCoverage(filtered),
            colorPipeline: original.colorPipeline,
          },
          metricCoverage: {
            fullImagePhoto: 'complete',
            faceRoiCiede2000: entry.has_adult_faces
              ? 'unsupported-no-reviewed-roi-annotations'
              : 'not-applicable',
            visibleHaloScore: 'unsupported-sobel-structure-diagnostic-only',
            videoOpticalFlow: 'not-applicable',
          },
          metrics,
        };
        await writeJson(privateResultPath, perItem);
        successes.push({ category: entry.scene_category, metrics });
        console.log(`ok ${index + 1}/${prepared.length}: ${entry.pair_id}`);
      } catch (error) {
        const classified = failureClass(error);
        const failure = {
          schemaVersion: '1.0',
          privacy: 'private per-item result',
          run,
          status: 'failed',
          item: {
            pairId: entry.pair_id,
            split: entry.split,
            category: entry.scene_category,
            mediaType: entry.media_type,
          },
          failureClass: classified,
          error: String(error?.message ?? error),
        };
        await writeJson(privateResultPath, failure);
        failures.push({ failureClass: classified });
        console.error(
          `failed ${index + 1}/${prepared.length}: ${entry.pair_id} (${classified})`
        );
      }
    }

    const aggregate = buildAggregate({
      run,
      selected,
      successes,
      failures,
      candidateParameters,
    });
    const markdown = markdownReport(aggregate);
    assertAggregateIsDeidentified(aggregate, markdown, selected);
    await Promise.all([
      writeJson(path.join(outputPath, 'aggregate.json'), aggregate),
      writeFile(path.join(outputPath, 'aggregate.md'), markdown, 'utf8'),
      ...(aggregateOutputPath
        ? [
            writeJson(
              path.join(aggregateOutputPath, 'aggregate.json'),
              aggregate
            ),
            writeFile(
              path.join(aggregateOutputPath, 'aggregate.md'),
              markdown,
              'utf8'
            ),
          ]
        : []),
    ]);
    console.log(`aggregate: ${path.join(outputPath, 'aggregate.json')}`);
    if (aggregateOutputPath) {
      console.log(
        `committable aggregate: ${path.join(aggregateOutputPath, 'aggregate.json')}`
      );
    }
    if (aggregate.status !== 'success') process.exitCode = 1;
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 2;
  } finally {
    await Promise.allSettled([
      candidate?.close(),
      decoder?.close(),
      browser?.close(),
    ]);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
