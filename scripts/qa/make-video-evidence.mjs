// Generate public, rights-clear video-path evidence through the running app.
// The source is the repository's deterministic synthetic QA clip (including a
// test tone); the output is downloaded from the real current browser renderer.
//
//   pnpm build && pnpm start
//   node scripts/qa/make-video-evidence.mjs http://127.0.0.1:3000
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { launchChromium } from './chromium.mjs';

const BASE = (process.argv[2] || 'http://127.0.0.1:3000').replace(/\/+$/, '');
const sourceImage = join(
  process.cwd(),
  'scripts/qa/fixtures/demo-example-creator.png'
);
const outputDirectory = join(process.cwd(), 'public/videos/evidence');
const publicSource = join(outputDirectory, 'synthetic-matcha-before.webm');
const publicOutput = join(outputDirectory, 'synthetic-matcha-after.webm');
const beforePoster = join(
  outputDirectory,
  'synthetic-matcha-before-poster.png'
);
const afterPoster = join(outputDirectory, 'synthetic-matcha-after-poster.png');

mkdirSync(outputDirectory, { recursive: true });

const browser = await launchChromium();
try {
  const page = await browser.newPage({ acceptDownloads: true });
  await page.addInitScript(() => {
    localStorage.setItem('remove-matcha-filter.analytics-consent.v1', 'denied');

    // Keep the evidence format portable and deterministic even on Chromium
    // versions that advertise MP4 before WebM. The shipped exporter supports
    // this WebM+Opus branch and still negotiates the final MIME type itself.
    const nativeSupport = MediaRecorder.isTypeSupported.bind(MediaRecorder);
    MediaRecorder.isTypeSupported = (type) =>
      type.toLowerCase().startsWith('video/mp4') ? false : nativeSupport(type);
  });

  // Build a visually meaningful, rights-clear source clip from the owned AI
  // test image already graded by make-demo-fixtures.mjs. Subtle motion makes
  // this a real frame-by-frame video case instead of a static photo wrapper.
  const sourceBase64 = readFileSync(sourceImage).toString('base64');
  const generatedSource = await page.evaluate(async (imageBase64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${imageBase64}`;
    await image.decode();

    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 320;
    const context = canvas.getContext('2d');
    const stream = canvas.captureStream(24);

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const audioDestination = audioContext.createMediaStreamDestination();
    oscillator.frequency.value = 440;
    gain.gain.value = 0.18;
    oscillator.connect(gain);
    gain.connect(audioDestination);
    oscillator.start();
    for (const track of audioDestination.stream.getAudioTracks()) {
      stream.addTrack(track);
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
      ? 'video/webm;codecs=vp8,opus'
      : 'video/webm';
    const recorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 96_000,
    });
    const chunks = [];
    recorder.ondataavailable = (event) =>
      event.data.size && chunks.push(event.data);
    const finished = new Promise((resolve) => {
      recorder.onstop = resolve;
    });
    recorder.start();

    const start = performance.now();
    await new Promise((resolve) => {
      const draw = () => {
        const elapsed = (performance.now() - start) / 1000;
        if (elapsed >= 2.2) return resolve();
        const scale = 1.035;
        const width = canvas.width * scale;
        const height = canvas.height * scale;
        const travel = (Math.sin(elapsed * Math.PI - Math.PI / 2) + 1) / 2;
        context.drawImage(
          image,
          -(width - canvas.width) * travel,
          -(height - canvas.height) / 2,
          width,
          height
        );
        requestAnimationFrame(draw);
      };
      draw();
    });

    recorder.stop();
    await finished;
    oscillator.stop();
    await audioContext.close();

    const bytes = new Uint8Array(
      await new Blob(chunks, { type: mimeType }).arrayBuffer()
    );
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }, sourceBase64);
  writeFileSync(publicSource, Buffer.from(generatedSource, 'base64'));

  await page.goto(`${BASE}/from-video`, { waitUntil: 'networkidle' });
  await page.setInputFiles('input[type=file]', publicSource);
  await page.waitForSelector('canvas', { timeout: 20_000 });
  await page.waitForTimeout(1_000);

  // Use intentionally conservative settings for compressed moving imagery.
  // This is also the guidance shown on the video page; stronger correction
  // can clip highlights or exaggerate frame-to-frame compression artifacts.
  const sliders = page.locator('input[type=range]');
  await sliders.nth(0).fill('30');
  await sliders.nth(1).fill('25');
  await sliders.nth(2).fill('20');
  await page.waitForTimeout(300);

  const posters = await page.evaluate(async () => {
    const video = document.querySelector('video');
    const adjusted = document.querySelector('canvas');
    if (!video || !adjusted) {
      throw new Error('video comparison previews not found');
    }
    video.pause();
    const seeked = new Promise((resolve) =>
      video.addEventListener('seeked', resolve, { once: true })
    );
    video.currentTime = Math.min(0.75, video.duration / 2);
    await seeked;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const capture = (source, width, height) => {
      const target = document.createElement('canvas');
      target.width = width;
      target.height = height;
      target.getContext('2d').drawImage(source, 0, 0, width, height);
      return target.toDataURL('image/png').split(',')[1];
    };
    return {
      before: capture(video, video.videoWidth, video.videoHeight),
      after: capture(adjusted, adjusted.width, adjusted.height),
    };
  });
  writeFileSync(beforePoster, Buffer.from(posters.before, 'base64'));
  writeFileSync(afterPoster, Buffer.from(posters.after, 'base64'));

  const exportButton = page.getByRole('button', { name: 'Export video' });
  if (!(await exportButton.isEnabled())) {
    throw new Error('video export is disabled in the evidence browser');
  }

  const downloadPromise = page.waitForEvent('download', { timeout: 45_000 });
  await exportButton.click();
  const download = await downloadPromise;
  if (!download.suggestedFilename().endsWith('.webm')) {
    throw new Error(
      `expected a WebM evidence export, received ${download.suggestedFilename()}`
    );
  }
  await download.saveAs(publicOutput);

  for (const path of [publicSource, publicOutput, beforePoster, afterPoster]) {
    if (statSync(path).size < 1_000) {
      throw new Error(`evidence asset is unexpectedly small: ${path}`);
    }
  }

  // EBML/WebM signature. This prevents a mislabeled download from becoming a
  // public claim even if a browser changes its filename behaviour.
  const signature = readFileSync(publicOutput).subarray(0, 4).toString('hex');
  if (signature !== '1a45dfa3') {
    throw new Error(`export is not a WebM container (signature ${signature})`);
  }

  const exportedBase64 = readFileSync(publicOutput).toString('base64');
  const mediaCheck = await page.evaluate(async (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index);
    }
    const url = URL.createObjectURL(new Blob([bytes], { type: 'video/webm' }));
    const video = document.createElement('video');
    video.src = url;
    video.playsInline = true;
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = reject;
      video.load();
    });

    const context = new AudioContext();
    const sourceNode = context.createMediaElementSource(video);
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    sourceNode.connect(analyser);
    sourceNode.connect(context.destination);
    await context.resume();
    await video.play();

    const samples = new Float32Array(analyser.fftSize);
    let peakRms = 0;
    const started = performance.now();
    while (performance.now() - started < 700) {
      analyser.getFloatTimeDomainData(samples);
      let energy = 0;
      for (const value of samples) energy += value * value;
      peakRms = Math.max(peakRms, Math.sqrt(energy / samples.length));
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    video.pause();
    await context.close();
    URL.revokeObjectURL(url);
    return { duration: video.duration, peakRms };
  }, exportedBase64);
  if (
    !Number.isFinite(mediaCheck.duration) ||
    mediaCheck.duration < 1.5 ||
    mediaCheck.duration > 4 ||
    mediaCheck.peakRms < 0.005
  ) {
    throw new Error(
      `evidence media check failed: duration=${mediaCheck.duration}, rms=${mediaCheck.peakRms}`
    );
  }

  console.log(
    `wrote current-build video evidence (${statSync(publicOutput).size} bytes, ${mediaCheck.duration.toFixed(2)}s, audio rms ${mediaCheck.peakRms.toFixed(3)})`
  );
} finally {
  await browser.close();
}
