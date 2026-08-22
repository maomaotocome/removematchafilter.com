#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SCHEMA_PATH = path.join(SCRIPT_DIR, 'manifest.schema.json');

const FORBIDDEN_FIELD_NAMES = new Set([
  'account_handle',
  'account_name',
  'address',
  'biometric_embedding',
  'diagnosis',
  'email',
  'ethnicity',
  'face_embedding',
  'first_name',
  'free_text_description',
  'full_name',
  'gps_coordinates',
  'gps_latitude',
  'gps_longitude',
  'handle',
  'health',
  'last_name',
  'latitude',
  'location',
  'longitude',
  'person_name',
  'personal_description',
  'personal_url',
  'phone',
  'profile_url',
  'race',
  'serial_number',
  'source_url',
  'subject_name',
  'username',
]);

function normalizeFieldName(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function jsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function typeMatches(value, expected) {
  switch (expected) {
    case 'null':
      return value === null;
    case 'array':
      return Array.isArray(value);
    case 'object':
      return isPlainObject(value);
    case 'integer':
      return Number.isInteger(value);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'string':
    case 'boolean':
      return typeof value === expected;
    default:
      return false;
  }
}

function resolveSchemaRef(rootSchema, reference) {
  if (!reference.startsWith('#/')) {
    throw new Error(
      `Only local JSON Schema references are supported: ${reference}`
    );
  }
  return reference
    .slice(2)
    .split('/')
    .map((token) => token.replaceAll('~1', '/').replaceAll('~0', '~'))
    .reduce((current, token) => current?.[token], rootSchema);
}

function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

/**
 * Focused Draft 2020-12 validator for the keywords used by the committed
 * manifest schema. Keeping it dependency-free makes the governance check
 * runnable before the application dependencies or benchmark harness exist.
 */
export function validateAgainstSchema(
  value,
  schema,
  rootSchema = schema,
  location = '$',
  errors = []
) {
  if (schema.$ref) {
    const resolved = resolveSchemaRef(rootSchema, schema.$ref);
    if (!resolved) {
      errors.push(`${location}: unresolved schema reference ${schema.$ref}`);
      return errors;
    }
    validateAgainstSchema(value, resolved, rootSchema, location, errors);
  }

  if (schema.allOf) {
    for (const branch of schema.allOf) {
      validateAgainstSchema(value, branch, rootSchema, location, errors);
    }
  }

  if (schema.anyOf) {
    const matched = schema.anyOf.some((branch) => {
      const branchErrors = [];
      validateAgainstSchema(value, branch, rootSchema, location, branchErrors);
      return branchErrors.length === 0;
    });
    if (!matched) errors.push(`${location}: does not match any allowed schema`);
  }

  if (schema.not) {
    const branchErrors = [];
    validateAgainstSchema(
      value,
      schema.not,
      rootSchema,
      location,
      branchErrors
    );
    if (branchErrors.length === 0) {
      errors.push(`${location}: matches a prohibited schema`);
    }
  }

  if (schema.if) {
    const conditionErrors = [];
    validateAgainstSchema(
      value,
      schema.if,
      rootSchema,
      location,
      conditionErrors
    );
    if (conditionErrors.length === 0 && schema.then) {
      validateAgainstSchema(value, schema.then, rootSchema, location, errors);
    } else if (conditionErrors.length > 0 && schema.else) {
      validateAgainstSchema(value, schema.else, rootSchema, location, errors);
    }
  }

  if ('const' in schema && !jsonEqual(value, schema.const)) {
    errors.push(`${location}: must equal ${JSON.stringify(schema.const)}`);
  }

  if (schema.enum && !schema.enum.some((item) => jsonEqual(value, item))) {
    errors.push(`${location}: value is not in the allowed enum`);
  }

  if (schema.type) {
    const allowedTypes = Array.isArray(schema.type)
      ? schema.type
      : [schema.type];
    if (!allowedTypes.some((expected) => typeMatches(value, expected))) {
      errors.push(`${location}: expected ${allowedTypes.join(' or ')}`);
      return errors;
    }
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${location}: shorter than ${schema.minLength} characters`);
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(`${location}: longer than ${schema.maxLength} characters`);
    }
    if (schema.pattern && !new RegExp(schema.pattern, 'u').test(value)) {
      errors.push(`${location}: does not match the required pattern`);
    }
    if (schema.format === 'date' && !isCalendarDate(value)) {
      errors.push(`${location}: expected a real YYYY-MM-DD date`);
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${location}: must be at least ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${location}: must be at most ${schema.maximum}`);
    }
    if (
      schema.exclusiveMinimum !== undefined &&
      value <= schema.exclusiveMinimum
    ) {
      errors.push(
        `${location}: must be greater than ${schema.exclusiveMinimum}`
      );
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(
        `${location}: must contain at least ${schema.minItems} item(s)`
      );
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(
        `${location}: must contain at most ${schema.maxItems} item(s)`
      );
    }
    if (schema.uniqueItems) {
      const serialized = value.map((item) => JSON.stringify(item));
      if (new Set(serialized).size !== serialized.length) {
        errors.push(`${location}: items must be unique`);
      }
    }
    if (schema.items) {
      value.forEach((item, index) =>
        validateAgainstSchema(
          item,
          schema.items,
          rootSchema,
          `${location}[${index}]`,
          errors
        )
      );
    }
  }

  if (isPlainObject(value)) {
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(value, required)) {
        errors.push(`${location}.${required}: required property is missing`);
      }
    }

    for (const [key, childSchema] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, key)) {
        validateAgainstSchema(
          value[key],
          childSchema,
          rootSchema,
          `${location}.${key}`,
          errors
        );
      }
    }

    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties ?? {}));
      for (const key of Object.keys(value)) {
        if (!allowed.has(key)) {
          errors.push(`${location}.${key}: unknown properties are prohibited`);
        }
      }
    }
  }

  return errors;
}

function findForbiddenFields(value, location = '$', errors = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      findForbiddenFields(item, `${location}[${index}]`, errors)
    );
    return errors;
  }
  if (!isPlainObject(value)) return errors;

  for (const [key, child] of Object.entries(value)) {
    const normalized = normalizeFieldName(key);
    if (FORBIDDEN_FIELD_NAMES.has(normalized)) {
      errors.push(
        `${location}.${key}: personal or sensitive fields are prohibited`
      );
    }
    findForbiddenFields(child, `${location}.${key}`, errors);
  }
  return errors;
}

function validatePrivatePath(value, field, repoRoot, errors) {
  if (typeof value !== 'string') return;
  if (value.includes('\\') || value.includes('\0')) {
    errors.push(`${field}: use a NUL-free POSIX relative path`);
    return;
  }
  if (
    path.posix.isAbsolute(value) ||
    /^[a-zA-Z]:/.test(value) ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)
  ) {
    errors.push(`${field}: absolute paths and URLs are prohibited`);
    return;
  }

  const segments = value.split('/');
  if (segments.some((segment) => segment === '..' || segment === '.')) {
    errors.push(`${field}: path traversal and dot segments are prohibited`);
    return;
  }
  if (segments.some((segment) => segment.length === 0)) {
    errors.push(`${field}: empty path segments are prohibited`);
    return;
  }
  if (!value.startsWith('private-data/matcha-benchmark/v1/')) {
    errors.push(
      `${field}: must remain under private-data/matcha-benchmark/v1/`
    );
    return;
  }

  const privateRoot = path.resolve(repoRoot, 'private-data');
  const resolved = path.resolve(repoRoot, value);
  if (
    resolved !== privateRoot &&
    !resolved.startsWith(`${privateRoot}${path.sep}`)
  ) {
    errors.push(`${field}: resolved path escapes private-data/`);
  }
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function semanticErrorsForEntry(entry, lineNumber, repoRoot, today) {
  const prefix = `line ${lineNumber}`;
  const errors = [];
  validatePrivatePath(
    entry.original_path,
    `${prefix}.original_path`,
    repoRoot,
    errors
  );
  validatePrivatePath(
    entry.filtered_path,
    `${prefix}.filtered_path`,
    repoRoot,
    errors
  );

  if (entry.original_path === entry.filtered_path) {
    errors.push(`${prefix}: original_path and filtered_path must differ`);
  }
  if (entry.original_sha256 === entry.filtered_sha256) {
    errors.push(`${prefix}: original and filtered SHA-256 values must differ`);
  }
  if (!entry.allowed_uses?.includes('benchmark_evaluation')) {
    errors.push(
      `${prefix}.allowed_uses: benchmark_evaluation permission is required`
    );
  }
  if (
    entry.split === 'calibration' &&
    !entry.allowed_uses?.includes('algorithm_calibration')
  ) {
    errors.push(
      `${prefix}.allowed_uses: calibration entries require algorithm_calibration permission`
    );
  }

  if (entry.rights_expires_on && entry.rights_expires_on < today) {
    errors.push(`${prefix}.rights_expires_on: rights have expired`);
  }
  if (entry.scheduled_deletion_on && entry.scheduled_deletion_on < today) {
    errors.push(
      `${prefix}.scheduled_deletion_on: scheduled deletion is overdue`
    );
  }
  if (
    entry.rights_expires_on &&
    entry.capture_date &&
    entry.rights_expires_on < entry.capture_date
  ) {
    errors.push(`${prefix}.rights_expires_on: cannot precede capture_date`);
  }
  if (
    entry.scheduled_deletion_on &&
    entry.capture_date &&
    entry.scheduled_deletion_on < entry.capture_date
  ) {
    errors.push(`${prefix}.scheduled_deletion_on: cannot precede capture_date`);
  }

  if (entry.has_adult_faces === false && entry.face_count_bucket !== 'none') {
    errors.push(
      `${prefix}: face_count_bucket must be none when has_adult_faces is false`
    );
  }
  if (entry.has_adult_faces === true && entry.face_count_bucket === 'none') {
    errors.push(`${prefix}: face_count_bucket must report adult faces`);
  }
  if (
    entry.scene_category === 'product_food_no_person' &&
    (entry.has_adult_faces !== false || entry.face_count_bucket !== 'none')
  ) {
    errors.push(
      `${prefix}: product_food_no_person entries cannot declare faces`
    );
  }

  if (entry.record_status === 'accepted') {
    if (entry.normalization_status !== 'complete') {
      errors.push(
        `${prefix}: accepted entries require completed normalization`
      );
    }
    if (!['not_required', 'aligned'].includes(entry.alignment_status)) {
      errors.push(`${prefix}: accepted entries require resolved alignment`);
    }
    if (entry.rejection_reason !== null) {
      errors.push(`${prefix}: accepted entries cannot have a rejection reason`);
    }
  }
  if (entry.record_status === 'rejected' && entry.rejection_reason === null) {
    errors.push(
      `${prefix}: rejected entries require a bounded rejection reason`
    );
  }
  if (entry.split === 'holdout' && entry.record_status !== 'accepted') {
    errors.push(`${prefix}: holdout entries must be accepted`);
  }
  if (entry.split === 'holdout' && entry.source_kind === 'synthetic') {
    errors.push(`${prefix}: synthetic fixtures are prohibited from holdout`);
  }

  if (entry.media_type === 'video') {
    const hasStoredAudio =
      entry.original_metadata?.has_audio || entry.filtered_metadata?.has_audio;
    if (
      hasStoredAudio &&
      entry.metadata_sanitization?.audio_status !== 'rights_cleared'
    ) {
      errors.push(`${prefix}: stored video audio requires rights_cleared`);
    }
    if (
      !hasStoredAudio &&
      !['absent', 'removed'].includes(entry.metadata_sanitization?.audio_status)
    ) {
      errors.push(
        `${prefix}: video without stored audio must declare absent or removed`
      );
    }
  }

  return errors;
}

function emptyStats() {
  return {
    total: 0,
    benchmarkEligible: 0,
    accepted: 0,
    rejected: 0,
    photo: 0,
    video: 0,
    calibration: 0,
    validation: 0,
    holdout: 0,
  };
}

/** Validate JSONL text and return deterministic manifest and holdout hashes. */
export function validateManifestText(
  text,
  {
    schema,
    repoRoot = process.cwd(),
    today = new Date().toISOString().slice(0, 10),
  } = {}
) {
  if (!schema) throw new Error('schema is required');

  const errors = [];
  const records = [];
  const stats = emptyStats();
  const pairIds = new Map();
  const mediaPaths = new Map();
  const mediaHashes = new Map();
  const groupSplits = new Map();

  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const lineNumber = index + 1;
    const line = rawLine.trim();
    if (!line) continue;

    let entry;
    try {
      entry = JSON.parse(line);
    } catch (error) {
      errors.push(`line ${lineNumber}: invalid JSON (${error.message})`);
      continue;
    }

    const entryErrors = [];
    validateAgainstSchema(entry, schema, schema, '$', entryErrors);
    findForbiddenFields(entry, '$', entryErrors);
    errors.push(...entryErrors.map((error) => `line ${lineNumber}: ${error}`));

    // Run safe semantic checks even after schema errors so path traversal and
    // cross-field governance failures are never hidden by an earlier shape
    // error. Each check tolerates missing fields.
    errors.push(...semanticErrorsForEntry(entry, lineNumber, repoRoot, today));

    records.push({ entry, lineNumber });
    stats.total += 1;
    for (const key of [entry.record_status, entry.media_type, entry.split]) {
      if (Object.hasOwn(stats, key)) stats[key] += 1;
    }

    if (typeof entry.pair_id === 'string') {
      const previous = pairIds.get(entry.pair_id);
      if (previous) {
        errors.push(
          `line ${lineNumber}.pair_id: duplicate of line ${previous}`
        );
      } else {
        pairIds.set(entry.pair_id, lineNumber);
      }
    }

    for (const [role, mediaPath] of [
      ['original_path', entry.original_path],
      ['filtered_path', entry.filtered_path],
    ]) {
      if (typeof mediaPath !== 'string') continue;
      const previous = mediaPaths.get(mediaPath);
      if (previous) {
        errors.push(
          `line ${lineNumber}.${role}: duplicate media path used by ${previous}`
        );
      } else {
        mediaPaths.set(mediaPath, `line ${lineNumber}.${role}`);
      }
    }

    for (const [role, hash] of [
      ['original_sha256', entry.original_sha256],
      ['filtered_sha256', entry.filtered_sha256],
    ]) {
      if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)) continue;
      const previous = mediaHashes.get(hash);
      if (previous) {
        errors.push(
          `line ${lineNumber}.${role}: duplicate SHA-256 already used by ${previous}`
        );
      } else {
        mediaHashes.set(hash, `line ${lineNumber}.${role}`);
      }
    }

    if (
      typeof entry.capture_group_id === 'string' &&
      typeof entry.split === 'string'
    ) {
      const previous = groupSplits.get(entry.capture_group_id);
      if (previous && previous.split !== entry.split) {
        errors.push(
          `line ${lineNumber}.capture_group_id: ${entry.capture_group_id} leaks across ${previous.split} (line ${previous.lineNumber}) and ${entry.split}`
        );
      } else if (!previous) {
        groupSplits.set(entry.capture_group_id, {
          split: entry.split,
          lineNumber,
        });
      }
    }
  }

  if (records.length === 0) errors.push('manifest contains no JSONL records');

  // A manifest with any schema, semantic, duplicate, rights, or leakage error
  // has zero benchmark-eligible records. This prevents callers from treating a
  // partially valid file as evidence by reading only its declared statuses.
  const manifestValid = errors.length === 0;
  const benchmarkRecords = manifestValid
    ? records
        .map(({ entry }) => entry)
        .filter(
          (entry) =>
            entry?.record_status === 'accepted' &&
            entry?.source_kind !== 'synthetic'
        )
    : [];
  stats.benchmarkEligible = benchmarkRecords.length;

  const holdoutRecords = benchmarkRecords
    .filter((entry) => entry?.split === 'holdout')
    .sort((left, right) =>
      String(left.pair_id).localeCompare(String(right.pair_id))
    );
  const canonicalHoldout = holdoutRecords.length
    ? `${holdoutRecords.map(canonicalJson).join('\n')}\n`
    : '';

  return {
    valid: manifestValid,
    errors,
    stats,
    manifestSha256: sha256(text),
    holdoutSha256: manifestValid ? sha256(canonicalHoldout) : null,
    holdoutCount: holdoutRecords.length,
  };
}

function usage() {
  return [
    'Usage:',
    '  node scripts/benchmark/validate-manifest.mjs --manifest <manifest.jsonl>',
    '  node scripts/benchmark/validate-manifest.mjs <manifest.jsonl>',
    '',
    'Paths inside the manifest are repository-relative and must remain under',
    'private-data/matcha-benchmark/v1/. This command does not create media or',
    'write validation output.',
  ].join('\n');
}

function parseCliArgs(argv) {
  if (argv.includes('--help') || argv.includes('-h')) return { help: true };
  const manifestFlag = argv.indexOf('--manifest');
  if (manifestFlag !== -1) {
    if (!argv[manifestFlag + 1]) throw new Error('--manifest requires a path');
    return { manifestPath: argv[manifestFlag + 1] };
  }
  const positional = argv.find((argument) => !argument.startsWith('-'));
  if (!positional) throw new Error('manifest path is required');
  return { manifestPath: positional };
}

async function main() {
  let args;
  try {
    args = parseCliArgs(process.argv.slice(2));
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

  try {
    const [manifestText, schemaText] = await Promise.all([
      readFile(path.resolve(process.cwd(), args.manifestPath), 'utf8'),
      readFile(DEFAULT_SCHEMA_PATH, 'utf8'),
    ]);
    const schema = JSON.parse(schemaText);
    const result = validateManifestText(manifestText, {
      schema,
      repoRoot: process.cwd(),
    });

    if (!result.valid) {
      for (const error of result.errors) console.error(`ERROR: ${error}`);
    }
    console.log(
      `manifest: ${result.valid ? 'valid' : 'invalid'} (${result.stats.total} records, ${result.stats.accepted} accepted, ${result.stats.rejected} rejected)`
    );
    console.log(
      `benchmark_eligible: ${result.stats.benchmarkEligible} accepted non-synthetic records only`
    );
    console.log(
      `media: ${result.stats.photo} photo, ${result.stats.video} video`
    );
    console.log(
      `splits: ${result.stats.calibration} calibration, ${result.stats.validation} validation, ${result.stats.holdout} holdout`
    );
    console.log(`manifest_sha256: ${result.manifestSha256}`);
    console.log(
      result.holdoutSha256
        ? `holdout_sha256: ${result.holdoutSha256} (${result.holdoutCount} records; canonical JSON sorted by pair_id)`
        : 'holdout_sha256: unavailable (manifest invalid)'
    );
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 2;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
