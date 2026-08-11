// Generate local QA fixtures: a matcha-tinted PNG and a short MP4 built from it.
// Uses the ffmpeg bundled with playwright's browser cache, so no extra install.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const OUT = 'scripts/qa/fixtures';
mkdirSync(OUT, { recursive: true });

const WIDTH = 480;
const HEIGHT = 320;

/** Minimal PNG encoder (RGB, no filtering) so there's no image dependency. */
function encodePng(width, height, rgb) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let p = 0;
  for (let y = 0; y < height; y++) {
    raw[p++] = 0; // filter: none
    rgb.copy(raw, p, y * width * 3, (y + 1) * width * 3);
    p += width * 3;
  }

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++)
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

/**
 * A gradient + colour patches, then pushed through a synthetic "matcha" grade:
 * green lifted, red pulled, contrast flattened, grain added. Gives the tool a
 * realistic target with a known green bias.
 */
function buildFrame() {
  const rgb = Buffer.alloc(WIDTH * HEIGHT * 3);
  const patches = [
    [220, 90, 70],
    [80, 120, 220],
    [235, 220, 190],
    [40, 40, 45],
  ];

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      let r, g, b;
      if (y < HEIGHT / 2) {
        const t = x / (WIDTH - 1);
        r = g = b = Math.round(20 + t * 225);
      } else {
        const patch = patches[Math.floor((x / WIDTH) * patches.length)];
        [r, g, b] = patch;
      }

      // Synthetic matcha grade + deterministic grain.
      const grain = ((x * 7919 + y * 104729) % 23) - 11;
      const flatten = (v) => 26 + v * 0.72;
      r = flatten(r) * 0.9 + grain;
      g = flatten(g) * 1.1 + 14 + grain;
      b = flatten(b) * 0.94 + grain;

      const i = (y * WIDTH + x) * 3;
      rgb[i] = clamp(r);
      rgb[i + 1] = clamp(g);
      rgb[i + 2] = clamp(b);
    }
  }
  return rgb;
}

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

const png = encodePng(WIDTH, HEIGHT, buildFrame());
writeFileSync(`${OUT}/matcha-photo.png`, png);
console.log(`wrote ${OUT}/matcha-photo.png (${png.length} bytes)`);

// --- Video fixture: recorded by Chromium itself ---
// The ffmpeg bundled with Playwright has no PNG decoder, so instead we animate
// the same matcha-graded frame on a canvas and record it with MediaRecorder.
// That also proves the browser's recording path works before the app uses it.
const { launchChromium } = await import('./chromium.mjs');
const browser = await launchChromium();
try {
  const page = await browser.newPage();
  const base64 = await page.evaluate(
    async ([width, height]) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(24);

      // Deterministic audio: a 440 Hz sine at a fixed gain, mixed into the
      // recording so the fixture genuinely contains a non-silent track. The QA
      // test measures this back out of the export.
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 440;
      const gain = audioContext.createGain();
      gain.gain.value = 0.5;
      const audioDestination = audioContext.createMediaStreamDestination();
      oscillator.connect(gain);
      gain.connect(audioDestination);
      oscillator.start();
      for (const track of audioDestination.stream.getAudioTracks()) {
        stream.addTrack(track);
      }

      const mimeType = MediaRecorder.isTypeSupported(
        'video/webm;codecs=vp8,opus'
      )
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128_000,
      });
      const chunks = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

      const finished = new Promise((resolve) => (recorder.onstop = resolve));
      recorder.start();

      // Two seconds of a drifting matcha-tinted gradient.
      const start = performance.now();
      await new Promise((resolve) => {
        const draw = () => {
          const t = (performance.now() - start) / 1000;
          if (t >= 2) return resolve();
          const gradient = ctx.createLinearGradient(0, 0, width, 0);
          gradient.addColorStop(0, 'rgb(44,58,40)');
          gradient.addColorStop(0.5, `rgb(${140 + t * 20},170,120)`);
          gradient.addColorStop(1, 'rgb(206,214,180)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = 'rgb(190,120,110)';
          ctx.fillRect(40, height / 2, 90, 90);
          ctx.fillStyle = 'rgb(110,140,190)';
          ctx.fillRect(170, height / 2, 90, 90);
          requestAnimationFrame(draw);
        };
        draw();
      });

      recorder.stop();
      await finished;
      oscillator.stop();
      await audioContext.close();

      const blob = new Blob(chunks, { type: 'video/webm' });
      const buffer = await blob.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i++)
        binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    },
    [WIDTH, HEIGHT]
  );

  const webm = Buffer.from(base64, 'base64');
  writeFileSync(`${OUT}/matcha-video.webm`, webm);
  console.log(`wrote ${OUT}/matcha-video.webm (${webm.length} bytes)`);
} finally {
  await browser.close();
}
