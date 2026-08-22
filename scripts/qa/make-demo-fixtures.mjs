// Turn neutral source photos into matcha-graded demo fixtures.
//
// The site's examples must be (a) media we own and (b) genuinely produced by the
// current build. The synthetic gradient chart from make-fixtures.mjs satisfies
// both but shows the correction on a test pattern rather than on a photo, so it
// reads as a lab artefact instead of a result.
//
// This script closes that gap honestly: it takes a *neutral* source image, applies
// a real matcha-style colour grade here (the "before"), and writes it to
// scripts/qa/fixtures/. make-examples.mjs then feeds that through the actual tool
// in a real browser to produce the "after". Nothing is hand-painted — the grade is
// applied programmatically and the correction is done by the shipped shader.
//
//   node scripts/qa/make-demo-fixtures.mjs <neutral-source> [...]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

import { launchChromium } from './chromium.mjs';

const OUT = 'scripts/qa/fixtures';
mkdirSync(OUT, { recursive: true });

const sources = process.argv.slice(2);
if (sources.length === 0) {
  console.error(
    'usage: node scripts/qa/make-demo-fixtures.mjs <source-image>...'
  );
  process.exit(1);
}

/**
 * A matcha-style grade, applied in the browser on a canvas.
 *
 * Mirrors the grade in make-fixtures.mjs (contrast flattened, green lifted, red
 * and blue pulled, deterministic grain) and adds a partial desaturation, which
 * is what makes the real filter look washed rather than merely tinted. Raising
 * the green channel mean relative to red/blue is exactly the cast the tool's
 * grey-world analysis measures out of the frame.
 */
/**
 * Grade strength is deliberately calibrated to what the tool can actually
 * undo. analyzeFrame() clamps its grey-world gains to ±35%, so a cast much
 * past ~20 points of green excess cannot be corrected in a single pass and the
 * "after" would still read green — an honest result, but a useless
 * advertisement. A ~15-18 point cast is both typical of a real filter and
 * inside the correctable range, so the comparison shows the tool at its best
 * without overstating it.
 */
const browser = await launchChromium();
try {
  const page = await browser.newPage();
  for (const source of sources) {
    const b64 = readFileSync(source).toString('base64');
    const ext = extname(source).toLowerCase();
    const mime =
      ext === '.webp'
        ? 'image/webp'
        : ext === '.png'
          ? 'image/png'
          : 'image/jpeg';
    const result = await page.evaluate(
      async ({ data, mimeType }) => {
        const img = new Image();
        img.src = `data:${mimeType};base64,${data}`;
        await img.decode();

        // Cap the long edge so the fixture stays a reasonable payload while
        // remaining well above the site's rendered display width.
        // 1280 px keeps the full-size gallery candidate sharp on 2x desktop and
        // 3x mobile screens while the separate 480 px WebP protects low-DPR and
        // data-conscious visitors from downloading the larger file.
        const maxEdge = 1280;
        const targetAspect = 3 / 2;
        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;
        if (sw / sh > targetAspect) {
          sw = sh * targetAspect;
          sx = (img.width - sw) / 2;
        } else if (sw / sh < targetAspect) {
          sh = sw / targetAspect;
          sy = (img.height - sh) / 2;
        }
        const w = Math.min(maxEdge, Math.round(sw));
        const h = Math.round(w / targetAspect);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);

        const frame = ctx.getImageData(0, 0, w, h);
        const clamp = (value) =>
          value < 0 ? 0 : value > 255 ? 255 : Math.round(value);
        const flatten = (value) => 18 + value * 0.8;
        for (let i = 0; i < frame.data.length; i += 4) {
          const pixel = i / 4;
          const x = pixel % w;
          const y = (pixel / w) | 0;
          let seed = Math.imul(x + 1, 374761393) + Math.imul(y + 1, 668265263);
          seed = Math.imul(seed ^ (seed >>> 13), 1274126177);
          const grain = ((seed ^ (seed >>> 16)) & 15) - 7;
          let r = flatten(frame.data[i]);
          let g = flatten(frame.data[i + 1]);
          let b = flatten(frame.data[i + 2]);
          const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const desat = 0.14;
          r += (luma - r) * desat;
          g += (luma - g) * desat;
          b += (luma - b) * desat;
          frame.data[i] = clamp(r * 0.95 + grain);
          frame.data[i + 1] = clamp(g * 1.05 + 6 + grain);
          frame.data[i + 2] = clamp(b * 0.97 + grain);
        }
        ctx.putImageData(frame, 0, 0);

        // Report the resulting cast so the run is self-verifying.
        let R = 0,
          G = 0,
          B = 0,
          n = 0;
        for (let i = 0; i < frame.data.length; i += 4) {
          R += frame.data[i];
          G += frame.data[i + 1];
          B += frame.data[i + 2];
          n++;
        }
        return {
          png: canvas.toDataURL('image/png').split(',')[1],
          w,
          h,
          excess: G / n - (R / n + B / n) / 2,
        };
      },
      { data: b64, mimeType: mime }
    );

    const name = basename(source)
      .replace(/^src-/, '')
      .replace(/-\d+\.[^.]+$/, '')
      .replace(/\.[^.]+$/, '');
    const out = join(OUT, `demo-${name}.png`);
    const buf = Buffer.from(result.png, 'base64');
    writeFileSync(out, buf);
    console.log(
      `wrote ${out} (${result.w}x${result.h}, ${(buf.length / 1024).toFixed(0)}KB, green-excess=${result.excess.toFixed(2)})`
    );
  }
} finally {
  await browser.close();
}
