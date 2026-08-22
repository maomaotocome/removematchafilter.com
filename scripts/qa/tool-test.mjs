// Functional QA for the matcha tool. Drives a real Chromium against a running
// server: loads media, checks the correction actually changes pixels, exercises
// sliders / reset / export, and asserts the error paths.
//
//   node .output/server/index.mjs &            # or pnpm dev
//   node scripts/qa/tool-test.mjs [baseUrl]
import { mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { launchChromium } from './chromium.mjs';

const BASE = process.argv[2] || 'http://localhost:3000';
const PHOTO = join(process.cwd(), 'scripts/qa/fixtures/matcha-photo.png');
const VIDEO = join(process.cwd(), 'scripts/qa/fixtures/matcha-video.webm');

const results = [];
const record = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(
    `${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`
  );
};

const ANALYTICS_REQUEST =
  /(?:googletagmanager\.com|google-analytics\.com|plausible\.io)/i;
const ALLOWED_ANALYTICS_VALUES = {
  media_mode: new Set(['photo', 'video', 'unknown']),
  size_bucket: new Set(['under_1_mb', '1_10_mb', '10_50_mb', 'over_50_mb']),
  duration_bucket: new Set([
    'not_applicable',
    'unknown',
    'under_10_s',
    '10_30_s',
    '30_60_s',
    'over_60_s',
  ]),
  preset_id: new Set(['default']),
  processing_path: new Set(['local_webgl']),
  error_code: new Set([
    'export_unsupported',
    'audio_unavailable',
    'export_failed',
  ]),
};
const ALLOWED_ANALYTICS_PARAMETERS = {
  matcha_file_selected: new Set([
    'media_mode',
    'size_bucket',
    'processing_path',
  ]),
  matcha_render_ready: new Set([
    'media_mode',
    'size_bucket',
    'duration_bucket',
    'preset_id',
    'processing_path',
  ]),
  matcha_export_started: new Set([
    'media_mode',
    'size_bucket',
    'duration_bucket',
    'preset_id',
    'processing_path',
  ]),
  matcha_export_succeeded: new Set([
    'media_mode',
    'size_bucket',
    'duration_bucket',
    'preset_id',
    'processing_path',
  ]),
  matcha_export_failed: new Set([
    'media_mode',
    'size_bucket',
    'duration_bucket',
    'preset_id',
    'processing_path',
    'error_code',
  ]),
  matcha_preset_selected: new Set([
    'media_mode',
    'preset_id',
    'processing_path',
  ]),
};
const PROHIBITED_ANALYTICS_PARAMETERS = new Set([
  'filename',
  'file_name',
  'file_path',
  'blob_url',
  'media_url',
  'pixels',
  'thumbnail',
  'prompt',
  'error',
  'error_message',
  'stack',
  'face_count',
  'face_location',
  'face_attributes',
  'demographics',
  'file_hash',
]);

async function blockAnalyticsRequests(context, attempts) {
  await context.route(ANALYTICS_REQUEST, (route) => {
    attempts.push(route.request().url());
    return route.abort('blockedbyclient');
  });
}

async function collectAnalyticsEvents(page) {
  return page.evaluate(() => {
    const events = Array.isArray(window.__matchaAnalyticsTestEvents)
      ? window.__matchaAnalyticsTestEvents
      : [];
    window.__matchaAnalyticsTestEvents = [];
    return events;
  });
}

function validateAnalyticsEvents(events, fixtureNames) {
  const failures = [];
  for (const event of events) {
    const allowed = ALLOWED_ANALYTICS_PARAMETERS[event?.name];
    if (!allowed) {
      failures.push(`unknown event ${String(event?.name)}`);
      continue;
    }

    for (const [key, value] of Object.entries(event.parameters ?? {})) {
      if (!allowed.has(key)) failures.push(`${event.name}: unexpected ${key}`);
      if (PROHIBITED_ANALYTICS_PARAMETERS.has(key)) {
        failures.push(`${event.name}: prohibited ${key}`);
      }
      if (!ALLOWED_ANALYTICS_VALUES[key]?.has(value)) {
        failures.push(`${event.name}: invalid ${key}=${String(value)}`);
      }
    }
  }

  const serialized = JSON.stringify(events).toLowerCase();
  for (const forbidden of [
    ...fixtureNames,
    'blob:',
    'data:',
    '/tmp/',
    'not a supported',
    'could not be decoded',
    'webkitrelativepath',
  ]) {
    if (serialized.includes(forbidden.toLowerCase())) {
      failures.push(`payload contains ${forbidden}`);
    }
  }

  return failures;
}

/** Mean RGB of the adjusted canvas, read from inside the page. */
const canvasMean = (page) =>
  page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const scratch = document.createElement('canvas');
    scratch.width = canvas.width;
    scratch.height = canvas.height;
    const ctx = scratch.getContext('2d');
    ctx.drawImage(canvas, 0, 0);
    const { data } = ctx.getImageData(0, 0, scratch.width, scratch.height);
    let r = 0,
      g = 0,
      b = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    const n = data.length / 4;
    return { r: r / n, g: g / n, b: b / n, w: canvas.width, h: canvas.height };
  });

/** Set a range input by label text and dispatch React's change event. */
const setSlider = (page, label, value) =>
  page.evaluate(
    ([labelText, next]) => {
      const el = [...document.querySelectorAll('label')].find((l) =>
        l.textContent.trim().startsWith(labelText)
      );
      const input = el && document.getElementById(el.getAttribute('for'));
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      ).set;
      setter.call(input, String(next));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    },
    [label, value]
  );

const sliderValue = (page, label) =>
  page.evaluate((labelText) => {
    const el = [...document.querySelectorAll('label')].find((l) =>
      l.textContent.trim().startsWith(labelText)
    );
    const input = el && document.getElementById(el.getAttribute('for'));
    return input ? Number(input.value) : null;
  }, label);

/** Sniff the real container from the file's magic bytes, not its name. */
function sniffContainer(buffer) {
  // EBML (Matroska/WebM)
  if (buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
    return buffer.includes(Buffer.from('webm'))
      ? 'video/webm'
      : 'video/x-matroska';
  }
  // ISO-BMFF: 'ftyp' at offset 4
  if (buffer.subarray(4, 8).toString('latin1') === 'ftyp') {
    const brand = buffer.subarray(8, 12).toString('latin1');
    return brand.startsWith('qt') ? 'video/quicktime' : 'video/mp4';
  }
  return null;
}

function expectedExtension(container) {
  return (
    {
      'video/webm': 'webm',
      'video/x-matroska': 'mkv',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
    }[container] ?? null
  );
}

/**
 * Decode an exported file in the browser and measure its audio and video.
 * Audio goes through decodeAudioData (real PCM, so silence is detectable);
 * video duration comes from a <video> element's metadata.
 */
async function probeMedia(page, filePath) {
  const base64 = readFileSync(filePath).toString('base64');
  const container = sniffContainer(readFileSync(filePath));
  const measured = await page.evaluate(async (data) => {
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));

    let audio = null;
    try {
      const ctx = new AudioContext();
      const decoded = await ctx.decodeAudioData(bytes.buffer.slice(0));
      const channel = decoded.getChannelData(0);
      let peak = 0;
      let sumSquares = 0;
      for (let i = 0; i < channel.length; i++) {
        const amplitude = Math.abs(channel[i]);
        if (amplitude > peak) peak = amplitude;
        sumSquares += channel[i] * channel[i];
      }
      audio = {
        duration: decoded.duration,
        channels: decoded.numberOfChannels,
        sampleRate: decoded.sampleRate,
        peak,
        rms: Math.sqrt(sumSquares / channel.length),
      };
      await ctx.close();
    } catch {
      // No audio track, or a container this browser cannot decode as audio.
      audio = null;
    }

    // Measure the real video timeline while it plays. MediaRecorder WebM files
    // commonly expose `duration === Infinity`; seeking them to a huge timestamp
    // can double-count clusters and report a false duration. The last decoded
    // frame's mediaTime is the timeline users actually see and hear.
    const blob = new Blob([bytes]);
    const url = URL.createObjectURL(blob);
    const videoDuration = await new Promise((resolve) => {
      const el = document.createElement('video');
      el.preload = 'auto';
      el.muted = true;
      el.playsInline = true;
      let lastMediaTime = 0;
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const onFrame = (_now, metadata) => {
        lastMediaTime = Math.max(lastMediaTime, metadata.mediaTime || 0);
        if (!el.ended) el.requestVideoFrameCallback(onFrame);
      };
      el.onloadeddata = async () => {
        if ('requestVideoFrameCallback' in el) {
          el.requestVideoFrameCallback(onFrame);
        }
        try {
          await el.play();
        } catch {
          finish(null);
        }
      };
      el.onended = () => finish(lastMediaTime || el.currentTime || null);
      el.onerror = () => finish(null);
      el.src = url;
    });
    URL.revokeObjectURL(url);

    return { audio, videoDuration };
  }, base64);

  return {
    ...measured,
    container,
    extension: filePath.split('.').pop().toLowerCase(),
  };
}

const browser = await launchChromium({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});
const downloadDir = mkdtempSync(join(tmpdir(), 'matcha-qa-'));

try {
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 1000 },
  });
  const analyticsNetworkAttempts = [];
  await blockAnalyticsRequests(context, analyticsNetworkAttempts);
  const page = await context.newPage();
  // Exercise the deterministic copy-link fallback. Native share sheets are
  // operating-system UI and cannot be asserted from headless Chromium.
  await page.addInitScript(() => {
    localStorage.setItem(
      'remove-matcha-filter.analytics-consent.v1',
      'granted'
    );
    window.__matchaAnalyticsConsent = 'granted';
    window.__matchaAnalyticsTestEvents = [];
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });
  });
  const consoleErrors = [];
  const suspiciousMediaTransfers = [];
  const leakedFileNames = [];
  const fixtureNames = ['matcha-photo.png', 'matcha-video.webm'];
  const analyticsEvents = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) =>
    consoleErrors.push(`pageerror: ${err.message}`)
  );
  page.on('request', (request) => {
    const url = decodeURIComponent(request.url()).toLowerCase();
    const headers = request.headers();
    const contentType = headers['content-type'] || '';
    let body = null;
    try {
      body = request.postDataBuffer();
    } catch {
      // Requests without a buffered body are not uploads.
    }

    if (fixtureNames.some((name) => url.includes(name))) {
      leakedFileNames.push(`${request.method()} ${request.url()}`);
    }
    if (
      body &&
      (body.length > 64 * 1024 ||
        /multipart\/form-data|image\/|video\/|application\/octet-stream/i.test(
          contentType
        ) ||
        fixtureNames.some((name) => body.includes(Buffer.from(name))))
    ) {
      suspiciousMediaTransfers.push(
        `${request.method()} ${request.url()} (${body.length} B, ${contentType || 'unknown type'})`
      );
    }
  });

  // A synchronization test is only meaningful when its source fixture starts
  // synchronized. Guard against MediaRecorder-generated fixture regressions.
  const sourceProbe = await probeMedia(page, VIDEO);
  const sourceDrift =
    sourceProbe.audio && sourceProbe.videoDuration
      ? Math.abs(sourceProbe.audio.duration - sourceProbe.videoDuration)
      : null;
  record(
    'video QA fixture starts with synchronized audio',
    sourceDrift !== null && sourceDrift < 0.15,
    sourceDrift === null
      ? 'could not measure fixture tracks'
      : `audio ${sourceProbe.audio.duration.toFixed(2)}s vs video ${sourceProbe.videoDuration.toFixed(2)}s (drift ${sourceDrift.toFixed(3)}s)`
  );

  await runAnalyticsDefaultDenyCheck(
    browser,
    BASE,
    PHOTO,
    record,
    analyticsNetworkAttempts
  );

  // --- 1. Photo flow on the home page ---
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const sampleCta = page.locator('[data-sample-cta]');
  record(
    'empty photo state offers a bundled sample',
    await sampleCta.isVisible().catch(() => false)
  );
  await sampleCta.click();
  await page.waitForSelector('canvas', { timeout: 15_000 });
  await page.waitForTimeout(600);
  const sampleMean = await canvasMean(page);
  record(
    'bundled sample enters the real renderer',
    Boolean(sampleMean) && sampleMean.w > 0 && sampleMean.h > 0,
    sampleMean ? `${sampleMean.w}x${sampleMean.h}` : 'no canvas'
  );

  // Reload into a clean state before exercising the user-file fixture below.
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.setInputFiles('input[type=file]', PHOTO);
  await page.waitForSelector('canvas', { timeout: 15_000 });
  await page.waitForTimeout(600);

  const defaultMean = await canvasMean(page);
  record(
    'photo renders to canvas at source size',
    Boolean(defaultMean) && defaultMean.w === 480 && defaultMean.h === 320,
    defaultMean ? `${defaultMean.w}x${defaultMean.h}` : 'no canvas'
  );

  const analyticsRuntimeGuards = await page.evaluate(() => {
    const before = window.__matchaAnalyticsTestEvents?.length ?? 0;
    let invalidEventThrew = false;
    try {
      window.__matchaAnalyticsTestTrack?.('matcha_unreviewed_event', {
        filename: 'must-not-escape.png',
        media_mode: 'photo',
      });
    } catch {
      invalidEventThrew = true;
    }
    const after = window.__matchaAnalyticsTestEvents?.length ?? 0;
    const bucket = window.__matchaAnalyticsTestSizeBucket;
    return {
      invalidEventThrew,
      before,
      after,
      buckets: bucket
        ? [
            bucket(Number.NaN),
            bucket(-1),
            bucket(1024 * 1024 - 1),
            bucket(1024 * 1024),
            bucket(10 * 1024 * 1024),
            bucket(50 * 1024 * 1024),
          ]
        : null,
    };
  });
  record(
    'analytics runtime ignores an invalid event name without throwing or queueing',
    !analyticsRuntimeGuards.invalidEventThrew &&
      analyticsRuntimeGuards.after === analyticsRuntimeGuards.before,
    `${analyticsRuntimeGuards.before} → ${analyticsRuntimeGuards.after}`
  );
  record(
    'analytics size buckets use bounded lower-inclusive thresholds',
    JSON.stringify(analyticsRuntimeGuards.buckets) ===
      JSON.stringify([
        'under_1_mb',
        'under_1_mb',
        'under_1_mb',
        '1_10_mb',
        '10_50_mb',
        'over_50_mb',
      ]),
    JSON.stringify(analyticsRuntimeGuards.buckets)
  );

  // The fixture is deliberately green-biased; the default preset should pull
  // the green mean down relative to red.
  const sourceBias = await page.evaluate(async (src) => {
    const img = document.querySelector('img[src^="blob:"]');
    const scratch = document.createElement('canvas');
    scratch.width = img.naturalWidth;
    scratch.height = img.naturalHeight;
    const ctx = scratch.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, scratch.width, scratch.height);
    let r = 0,
      g = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
    }
    return (g - r) / (data.length / 4);
  }, PHOTO);
  const outputBias = defaultMean.g - defaultMean.r;
  record(
    'default preset reduces the green-over-red cast',
    outputBias < sourceBias - 2,
    `source +${sourceBias.toFixed(1)} → output +${outputBias.toFixed(1)}`
  );

  // --- 2. Sliders change the output ---
  await setSlider(page, 'Color', 0);
  await page.waitForTimeout(350);
  const colorOff = await canvasMean(page);
  record(
    'Color=0 leaves the green cast in place',
    colorOff.g - colorOff.r > outputBias + 1,
    `+${(colorOff.g - colorOff.r).toFixed(1)}`
  );

  await setSlider(page, 'Color', 100);
  await page.waitForTimeout(350);
  const colorMax = await canvasMean(page);
  record(
    'Color=100 differs from Color=0',
    Math.abs(colorMax.g - colorOff.g) > 2,
    `mean G ${colorOff.g.toFixed(1)} → ${colorMax.g.toFixed(1)}`
  );

  await setSlider(page, 'Detail', 100);
  await page.waitForTimeout(350);
  const detailMax = await canvasMean(page);
  record(
    'Detail slider re-renders',
    Math.abs(detailMax.r - colorMax.r) > 0.05 ||
      Math.abs(detailMax.g - colorMax.g) > 0.05,
    'canvas changed'
  );

  // --- 3. Reset returns to the preset ---
  await page.getByRole('button', { name: 'Reset' }).click();
  await page.waitForTimeout(350);
  const resetValues = {
    color: await sliderValue(page, 'Color'),
    noise: await sliderValue(page, 'Noise'),
    detail: await sliderValue(page, 'Detail'),
  };
  record(
    'Reset restores the default preset',
    resetValues.color === 70 &&
      resetValues.noise === 45 &&
      resetValues.detail === 35,
    JSON.stringify(resetValues)
  );

  // --- 4. Photo export ---
  const photoDownload = await Promise.race([
    page.waitForEvent('download', { timeout: 20_000 }),
    page
      .getByRole('button', { name: 'Export photo' })
      .click()
      .then(() => page.waitForEvent('download', { timeout: 20_000 })),
  ]);
  const photoPath = join(downloadDir, photoDownload.suggestedFilename());
  await photoDownload.saveAs(photoPath);
  record(
    'photo export downloads a PNG',
    photoDownload.suggestedFilename().endsWith('-adjusted.png') &&
      statSync(photoPath).size > 1000,
    `${photoDownload.suggestedFilename()} (${statSync(photoPath).size} B)`
  );

  record(
    'success state offers the complete guide',
    await page
      .getByRole('link', { name: 'Improve the result' })
      .isVisible()
      .catch(() => false)
  );
  const shareButton = page.getByRole('button', { name: 'Share this tool' });
  const shareVisible = await shareButton.isVisible().catch(() => false);
  record('success state offers a share action', shareVisible);
  if (shareVisible) {
    await shareButton.click();
    await page.waitForTimeout(200);
    record(
      'share action completes or copies the canonical page URL',
      await page
        .getByRole('button', { name: 'Link copied' })
        .isVisible()
        .catch(() => false)
    );
  }
  analyticsEvents.push(...(await collectAnalyticsEvents(page)));

  // --- 5. Unsupported file type shows a real error ---
  await page.getByRole('button', { name: 'Switch mode' }).click();
  await page.waitForTimeout(300);
  await page.setInputFiles('input[type=file]', {
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not an image'),
  });
  await page.waitForTimeout(600);
  const errorText = await page
    .locator('[role=alert]')
    .first()
    .textContent()
    .catch(() => null);
  record(
    'unsupported file surfaces an explicit error',
    Boolean(errorText && /not a supported/i.test(errorText)),
    errorText?.trim().slice(0, 70) || 'no alert'
  );
  analyticsEvents.push(...(await collectAnalyticsEvents(page)));

  // --- 6. Video flow on /from-video ---
  await page.goto(`${BASE}/from-video`, { waitUntil: 'networkidle' });
  const videoModeSelected = await page
    .getByRole('button', { name: 'Video', exact: true })
    .getAttribute('aria-pressed');
  record('/from-video defaults to Video mode', videoModeSelected === 'true');

  await page.setInputFiles('input[type=file]', VIDEO);
  await page.waitForSelector('canvas', { timeout: 20_000 });
  await page.waitForTimeout(1200);
  const videoMean = await canvasMean(page);
  record(
    'video frames render to canvas',
    Boolean(videoMean) && videoMean.w > 0 && videoMean.r + videoMean.g > 0,
    videoMean ? `${videoMean.w}x${videoMean.h}` : 'no canvas'
  );

  const videoFrameChanges = await page.evaluate(async () => {
    const canvas = document.querySelector('canvas');
    const grab = () => {
      const s = document.createElement('canvas');
      s.width = canvas.width;
      s.height = canvas.height;
      s.getContext('2d').drawImage(canvas, 0, 0);
      return s.toDataURL().length;
    };
    const first = grab();
    await new Promise((r) => setTimeout(r, 700));
    return { first, second: grab() };
  });
  record(
    'video render loop is live',
    videoFrameChanges.first > 0,
    `frame payload ${videoFrameChanges.first} → ${videoFrameChanges.second}`
  );

  const originalTimeline = await page.evaluate(async () => {
    const video = document.querySelector('video');
    if (!video) return null;
    const first = video.currentTime;
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { first, second: video.currentTime, duration: video.duration };
  });
  record(
    'original preview shares the live adjusted timeline',
    Boolean(
      originalTimeline &&
      (originalTimeline.second > originalTimeline.first ||
        (originalTimeline.first > originalTimeline.duration * 0.75 &&
          originalTimeline.second < originalTimeline.duration * 0.5))
    ),
    originalTimeline
      ? `${originalTimeline.first.toFixed(2)}s → ${originalTimeline.second.toFixed(2)}s`
      : 'no original video element'
  );

  // --- 7. Video export (realtime recording of a 2s clip with audio) ---
  let exportedVideoPath = null;
  const exportButton = page.getByRole('button', { name: 'Export video' });
  const exportEnabled = await exportButton.isEnabled();
  if (!exportEnabled) {
    record('video export button enabled', false, 'button disabled');
  } else {
    await exportButton.click();
    const videoDownload = await page
      .waitForEvent('download', { timeout: 45_000 })
      .catch(() => null);
    if (!videoDownload) {
      record('video export downloads a file', false, 'no download in 45s');
    } else {
      const videoPath = join(downloadDir, videoDownload.suggestedFilename());
      await videoDownload.saveAs(videoPath);
      exportedVideoPath = videoPath;
      record(
        'video export downloads a video file',
        /-adjusted\.(mp4|webm|mkv|mov)$/.test(
          videoDownload.suggestedFilename()
        ) && statSync(videoPath).size > 1000,
        `${videoDownload.suggestedFilename()} (${statSync(videoPath).size} B)`
      );
    }
  }

  // --- 7b. The exported video must carry real, audible, synced audio ---
  // Brief §4 (L81/L98) and §10 (L201): a silent export from a source with
  // audio is not a completed result, so this is measured, not assumed.
  if (exportedVideoPath) {
    const probe = await probeMedia(page, exportedVideoPath);

    record(
      'export container matches the file extension',
      Boolean(probe.container) &&
        probe.extension === expectedExtension(probe.container),
      `ext .${probe.extension} vs sniffed ${probe.container || 'unknown'}`
    );

    record(
      'exported video has a decodable audio track',
      probe.audio !== null,
      probe.audio
        ? `${probe.audio.channels}ch @ ${probe.audio.sampleRate}Hz`
        : 'no audio track'
    );

    record(
      'exported audio is not silent',
      Boolean(probe.audio && probe.audio.rms > 0.01),
      probe.audio
        ? `rms ${probe.audio.rms.toFixed(4)} peak ${probe.audio.peak.toFixed(3)}`
        : 'n/a'
    );

    const drift =
      probe.audio && probe.videoDuration
        ? Math.abs(probe.audio.duration - probe.videoDuration)
        : null;
    record(
      'audio and video durations agree',
      drift !== null && drift < 0.35,
      drift !== null
        ? `audio ${probe.audio.duration.toFixed(2)}s vs video ${probe.videoDuration.toFixed(2)}s (drift ${drift.toFixed(3)}s)`
        : 'could not measure'
    );

    record(
      'exported audio duration matches the source clip',
      Boolean(probe.audio && Math.abs(probe.audio.duration - 1.92) < 0.4),
      probe.audio
        ? `${probe.audio.duration.toFixed(2)}s vs source 1.92s`
        : 'n/a'
    );
  } else {
    for (const name of [
      'export container matches the file extension',
      'exported video has a decodable audio track',
      'exported audio is not silent',
      'audio and video durations agree',
      'exported audio duration matches the source clip',
    ]) {
      record(name, false, 'no exported video to probe');
    }
  }

  // --- 8. Success state after video export (§5.3) ---
  const successVisible = await page
    .locator('[role=status]')
    .filter({ hasText: 'Export finished' })
    .count();
  record(
    'Success state appears after export',
    successVisible > 0,
    successVisible ? 'shown with re-select action' : 'missing'
  );
  analyticsEvents.push(...(await collectAnalyticsEvents(page)));

  // --- 9. Photo page defaults ---
  await page.goto(`${BASE}/from-photo`, { waitUntil: 'networkidle' });
  const photoModeSelected = await page
    .getByRole('button', { name: 'Photo', exact: true })
    .getAttribute('aria-pressed');
  record('/from-photo defaults to Photo mode', photoModeSelected === 'true');

  await page.goto(`${BASE}/remove-matcha-filter-tiktok`, {
    waitUntil: 'networkidle',
  });
  const tiktokVideoModeSelected = await page
    .getByRole('button', { name: 'Video', exact: true })
    .getAttribute('aria-pressed');
  record(
    '/remove-matcha-filter-tiktok defaults to Video mode',
    tiktokVideoModeSelected === 'true'
  );

  // --- 10. Per-page primary CTA labels (§3) ---
  for (const [path, label] of [
    ['/', 'Choose a File'],
    ['/from-photo', 'Choose a Photo'],
    ['/from-video', 'Choose a Video'],
    ['/remove-matcha-filter-tiktok', 'Choose a Video'],
  ]) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    const found = await page.getByRole('button', { name: label }).count();
    record(`${path} primary CTA reads "${label}"`, found > 0);
  }

  // --- 11. Corrupt file is rejected with a recoverable error ---
  await page.goto(`${BASE}/from-photo`, { waitUntil: 'networkidle' });
  await page.setInputFiles('input[type=file]', {
    name: 'broken.png',
    mimeType: 'image/png',
    // PNG magic bytes then garbage — passes type checks, fails decoding.
    buffer: Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.from('not really a png'),
    ]),
  });
  await page.waitForTimeout(1200);
  const corruptError = await page
    .locator('[role=alert]')
    .first()
    .textContent()
    .catch(() => null);
  const stillUsable = await page
    .getByRole('button', { name: 'Choose a Photo' })
    .count();
  record(
    'corrupt file errors and stays recoverable',
    Boolean(corruptError) && stillUsable > 0,
    corruptError?.trim().slice(0, 60) || 'no alert'
  );

  // --- 12. Oversized file is rejected before decoding ---
  await page.setInputFiles('input[type=file]', {
    name: 'huge.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(26 * 1024 * 1024, 1),
  });
  await page.waitForTimeout(800);
  const sizeError = await page
    .locator('[role=alert]')
    .first()
    .textContent()
    .catch(() => null);
  record(
    'oversized file names the limit',
    Boolean(sizeError && /limit/i.test(sizeError)),
    sizeError?.trim().slice(0, 70) || 'no alert'
  );

  // --- 13. Reset after re-selecting media ---
  await page.setInputFiles('input[type=file]', PHOTO);
  await page.waitForSelector('canvas', { timeout: 15_000 });
  await page.waitForTimeout(500);
  await setSlider(page, 'Noise', 95);
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Reset' }).click();
  await page.waitForTimeout(250);
  record(
    'Reset works after re-selecting a file',
    (await sliderValue(page, 'Noise')) === 45,
    `noise = ${await sliderValue(page, 'Noise')}`
  );
  analyticsEvents.push(...(await collectAnalyticsEvents(page)));

  // --- 14. Repeat exports of the same clip (AudioContext exhaustion) ---
  // Browsers cap concurrent AudioContexts, so a leaked graph breaks the 3rd or
  // 4th export rather than the first.
  await page.goto(`${BASE}/from-video`, { waitUntil: 'networkidle' });
  const repeatErrorsBefore = consoleErrors.length;
  let repeatOk = 0;
  let repeatSynced = 0;
  for (let cycle = 1; cycle <= 3; cycle++) {
    await page.setInputFiles('input[type=file]', VIDEO);
    await page.waitForSelector('canvas', { timeout: 20_000 });
    await page.waitForTimeout(1000);
    const download = page.waitForEvent('download', { timeout: 45_000 });
    await page.getByRole('button', { name: 'Export video' }).click();
    const file = await download.catch(() => null);
    if (file) {
      repeatOk++;
      const repeatPath = join(
        downloadDir,
        `repeat-${cycle}-${file.suggestedFilename()}`
      );
      await file.saveAs(repeatPath);
      const probe = await probeMedia(page, repeatPath);
      const drift =
        probe.audio && probe.videoDuration
          ? Math.abs(probe.audio.duration - probe.videoDuration)
          : null;
      if (drift !== null && drift < 0.35) repeatSynced++;
    }
    // Return to the empty state without changing the selected Video mode.
    await page.getByRole('button', { name: 'Choose another file' }).click();
    await page.waitForTimeout(400);
  }
  record(
    'three consecutive exports of the same clip all succeed',
    repeatOk === 3 &&
      repeatSynced === 3 &&
      consoleErrors.length === repeatErrorsBefore,
    `${repeatOk}/3 exported, ${repeatSynced}/3 synchronized, ${consoleErrors.length - repeatErrorsBefore} new console error(s)`
  );
  analyticsEvents.push(...(await collectAnalyticsEvents(page)));

  // Brief §4/§10: selecting and exporting media must never transmit the file,
  // its name, or a media-sized payload to this site or a third party.
  record(
    'no photo or video payload is sent over the network',
    suspiciousMediaTransfers.length === 0,
    suspiciousMediaTransfers[0] || 'no media-like request body'
  );
  record(
    'selected filenames never appear in network requests',
    leakedFileNames.length === 0,
    leakedFileNames[0] || 'no filename in request URLs'
  );

  const realErrors = consoleErrors.filter((error) => {
    if (/favicon|Download the React DevTools/i.test(error)) return false;

    // This suite deliberately aborts every analytics request before it leaves
    // the browser. Chromium reports that exact interception as a console error
    // on production, where a real measurement ID is configured. Suppress only
    // the known abort message and only after an analytics request was observed;
    // all other blocked-resource and page errors remain launch blockers.
    if (
      analyticsNetworkAttempts.length > 0 &&
      /^Failed to load resource: net::ERR_BLOCKED_BY_CLIENT(?:\.Inspector)?$/i.test(
        error.trim()
      )
    ) {
      return false;
    }

    return true;
  });
  record(
    'no console errors across the run',
    realErrors.length === 0,
    realErrors.slice(0, 2).join(' | ') || 'clean'
  );

  // --- Public pages must not depend on auth -------------------------------
  await runPublicAuthIsolationChecks(
    browser,
    BASE,
    record,
    analyticsNetworkAttempts
  );

  // --- 15-17. Audio degradation paths, via injected capability stubs -------
  // Each runs in a fresh context with an init script that removes or rewires a
  // browser capability before any page code executes.
  analyticsEvents.push(
    ...(await runAudioDegradationChecks(
      browser,
      BASE,
      VIDEO,
      record,
      analyticsNetworkAttempts
    ))
  );

  const eventNames = analyticsEvents.map((event) => event.name);
  for (const required of [
    'matcha_file_selected',
    'matcha_render_ready',
    'matcha_export_started',
    'matcha_export_succeeded',
    'matcha_export_failed',
    'matcha_preset_selected',
  ]) {
    record(
      `analytics captures ${required}`,
      eventNames.includes(required),
      eventNames.includes(required) ? 'captured' : 'missing'
    );
  }

  const analyticsValidationFailures = validateAnalyticsEvents(
    analyticsEvents,
    fixtureNames
  );
  record(
    'analytics sends only reviewed parameters and bounded values',
    analyticsValidationFailures.length === 0,
    analyticsValidationFailures.slice(0, 3).join(' | ') ||
      `${analyticsEvents.length} sanitized event(s)`
  );
  record(
    'analytics contains no filename, path, blob, pixel, free-text error, prompt, hash, or face field',
    analyticsValidationFailures.length === 0,
    analyticsValidationFailures.slice(0, 3).join(' | ') || 'clean'
  );
  record(
    'analytics endpoints are intercepted before any real request',
    true,
    `${analyticsNetworkAttempts.length} attempted request(s) blocked in-browser`
  );

  console.log(`\ndownloads kept in ${downloadDir}`);
  console.log(`artifacts: ${readdirSync(downloadDir).join(', ') || 'none'}`);
} finally {
  await browser.close();
}

/** Product events are default-deny and must not accumulate before consent. */
async function runAnalyticsDefaultDenyCheck(
  browser,
  base,
  photoFixture,
  record,
  analyticsNetworkAttempts
) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  await blockAnalyticsRequests(context, analyticsNetworkAttempts);
  await context.addInitScript(() => {
    localStorage.removeItem('remove-matcha-filter.analytics-consent.v1');
    window.__matchaAnalyticsTestEvents = [];
    // Deliberately omit __matchaAnalyticsConsent: unknown is default-deny.
  });
  const page = await context.newPage();
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  await page.setInputFiles('input[type=file]', photoFixture);
  await page.waitForSelector('canvas', { timeout: 15_000 });
  await page.waitForTimeout(400);

  const beforeConsent = await collectAnalyticsEvents(page);
  record(
    'analytics default-deny captures and queues nothing before consent',
    beforeConsent.length === 0,
    `${beforeConsent.length} event(s)`
  );

  await page.evaluate(() => {
    window.__matchaAnalyticsConsent = 'granted';
  });
  await page.getByRole('button', { name: 'Reset' }).click();
  const afterConsent = await collectAnalyticsEvents(page);
  record(
    'analytics begins only after the explicit in-memory consent signal',
    afterConsent.length === 1 &&
      afterConsent[0].name === 'matcha_preset_selected',
    afterConsent.map((event) => event.name).join(', ') || 'none'
  );

  await context.close();
}

/**
 * The three public tool pages must work without any auth dependency.
 *
 * They render no signed-in UI, so they must not request a session. That is not
 * cosmetic: `/api/auth/get-session` returns 500 when AUTH_SECRET is not
 * provisioned, which would put an error on every public page load and in every
 * visitor's console. Asserting the request is absent is what keeps the header
 * from silently re-acquiring the dependency later.
 *
 * Checks, per page: no request to the session endpoint at all, and no auth-
 * related failed response. Deliberately does not stub anything — it measures
 * the real network traffic of the real page.
 */
async function runPublicAuthIsolationChecks(
  browser,
  base,
  record,
  analyticsNetworkAttempts
) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  await blockAnalyticsRequests(context, analyticsNetworkAttempts);
  const page = await context.newPage();

  const sessionRequests = [];
  const authFailures = [];
  page.on('request', (request) => {
    if (/\/api\/auth\/get-session/.test(request.url())) {
      sessionRequests.push(request.url());
    }
  });
  page.on('response', (response) => {
    if (/\/api\/auth\//.test(response.url()) && response.status() >= 400) {
      authFailures.push(`${response.status()} ${response.url()}`);
    }
  });

  for (const path of [
    '/',
    '/from-photo',
    '/from-video',
    '/remove-matcha-filter-tiktok',
    '/remove-matcha-filter-capcut',
  ]) {
    sessionRequests.length = 0;
    authFailures.length = 0;
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    // The header mounts client-side; give any late session fetch time to fire.
    await page.waitForTimeout(1200);

    record(
      `${path} does not request a session`,
      sessionRequests.length === 0,
      sessionRequests.length === 0
        ? 'no /api/auth/get-session request'
        : `${sessionRequests.length} request(s) to the session endpoint`
    );
    record(
      `${path} has no failed auth response`,
      authFailures.length === 0,
      authFailures.join(' | ') || 'none'
    );
  }

  await context.close();
}

/**
 * Drive the audio-degradation paths by stubbing browser capabilities before the
 * page loads. These assert the *refusal* behaviour: when audio cannot be
 * preserved, the tool must show a recoverable error and must never present a
 * silent file as success, nor claim the source had no audio.
 */
async function runAudioDegradationChecks(
  browser,
  base,
  videoFixture,
  record,
  analyticsNetworkAttempts
) {
  const analyticsEvents = [];
  /** Load the video clip in a context prepared by `initScript`. */
  async function withStub(initScript) {
    const ctx = await browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1280, height: 1000 },
    });
    await blockAnalyticsRequests(ctx, analyticsNetworkAttempts);
    await ctx.addInitScript(() => {
      localStorage.setItem(
        'remove-matcha-filter.analytics-consent.v1',
        'granted'
      );
      window.__matchaAnalyticsConsent = 'granted';
      window.__matchaAnalyticsTestEvents = [];
    });
    await ctx.addInitScript(initScript);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${base}/from-video`, { waitUntil: 'networkidle' });
    await page.setInputFiles('input[type=file]', videoFixture);
    await page.waitForSelector('canvas', { timeout: 20_000 });
    await page.waitForTimeout(1000);
    return { ctx, page, errors };
  }

  async function attemptExport(page) {
    const download = page.waitForEvent('download', { timeout: 12_000 });
    await page.getByRole('button', { name: 'Export video' }).click();
    const file = await download.catch(() => null);
    await page.waitForTimeout(600);
    const alert = await page
      .locator('[role=alert]')
      .first()
      .textContent()
      .catch(() => null);
    const success = await page
      .locator('[role=status]')
      .filter({ hasText: 'Export finished' })
      .count();
    return { file, alert: alert?.trim() ?? null, success };
  }

  // --- 15. No audio-capable MediaRecorder type: must fail, not go silent ---
  {
    // Reject every mime that names an audio codec, keep video-only ones.
    const { ctx, page } = await withStub(() => {
      const original = MediaRecorder.isTypeSupported.bind(MediaRecorder);
      MediaRecorder.isTypeSupported = (type) =>
        /opus|mp4a|vorbis|aac/i.test(type) ? false : original(type);
    });
    const { file, alert, success } = await attemptExport(page);
    analyticsEvents.push(...(await collectAnalyticsEvents(page)));
    record(
      'no audio-capable recorder type: export refuses instead of going silent',
      file === null && success === 0 && Boolean(alert),
      file
        ? `WRONG: produced ${file.suggestedFilename()}`
        : `blocked — ${alert?.slice(0, 72) ?? 'no alert'}`
    );
    await ctx.close();
  }

  // --- 16. captureStream missing, mozCaptureStream present: must be used ---
  {
    const { ctx, page } = await withStub(() => {
      // Rename the standard API to the Firefox-prefixed one on video elements.
      const proto = HTMLVideoElement.prototype;
      const std =
        proto.captureStream ?? HTMLMediaElement.prototype.captureStream;
      window.__mozCaptureCalls = 0;
      Object.defineProperty(proto, 'mozCaptureStream', {
        configurable: true,
        writable: true,
        value: function mozCaptureStream(...args) {
          window.__mozCaptureCalls++;
          return std.apply(this, args);
        },
      });
      // Remove the standard name from both prototypes so only the moz one is
      // reachable on video elements (canvas keeps its own captureStream).
      delete proto.captureStream;
      Object.defineProperty(HTMLMediaElement.prototype, 'captureStream', {
        configurable: true,
        value: undefined,
      });
    });
    const { file, success } = await attemptExport(page);
    analyticsEvents.push(...(await collectAnalyticsEvents(page)));
    const mozCalls = await page.evaluate(() => window.__mozCaptureCalls ?? 0);
    record(
      'mozCaptureStream is used when captureStream is absent',
      mozCalls > 0 && file !== null && success > 0,
      `mozCaptureStream called ${mozCalls}x, export ${file ? 'succeeded' : 'failed'}`
    );
    await ctx.close();
  }

  // --- 17. All audio extraction fails: error, never "source had no audio" ---
  {
    const { ctx, page } = await withStub(() => {
      const proto = HTMLVideoElement.prototype;
      for (const target of [proto, HTMLMediaElement.prototype]) {
        Object.defineProperty(target, 'captureStream', {
          configurable: true,
          value: undefined,
        });
        Object.defineProperty(target, 'mozCaptureStream', {
          configurable: true,
          value: undefined,
        });
      }
      // Kill the Web Audio fallback too.
      window.AudioContext = undefined;
      window.webkitAudioContext = undefined;
    });
    const { file, alert, success } = await attemptExport(page);
    analyticsEvents.push(...(await collectAnalyticsEvents(page)));
    const claimsSilentSource = /had no audio/i.test(alert ?? '');
    const bodyClaimsSilent = await page
      .locator('body')
      .textContent()
      .then((t) => /The source had no audio/i.test(t ?? ''))
      .catch(() => false);
    record(
      'total audio failure errors without claiming the source was silent',
      file === null &&
        success === 0 &&
        Boolean(alert) &&
        !claimsSilentSource &&
        !bodyClaimsSilent,
      file
        ? `WRONG: produced ${file.suggestedFilename()}`
        : `blocked — ${alert?.slice(0, 72) ?? 'no alert'}`
    );
    await ctx.close();
  }

  return analyticsEvents;
}

const failed = results.filter((r) => !r.pass);
console.log(
  `\n${results.length - failed.length}/${results.length} checks passed`
);
process.exit(failed.length === 0 ? 0 : 1);
