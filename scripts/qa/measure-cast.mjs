// Measure per-channel means of an image to detect a colour cast.
// Used to verify demo source photos are neutral before a matcha grade is applied.
import { readFileSync } from 'node:fs';

import { launchChromium } from './chromium.mjs';

const files = process.argv.slice(2);
const browser = await launchChromium();
try {
  const page = await browser.newPage();
  for (const f of files) {
    const b64 = readFileSync(f).toString('base64');
    const r = await page.evaluate(async (d) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + d;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const px = ctx.getImageData(0, 0, c.width, c.height).data;
      let R = 0,
        G = 0,
        B = 0,
        n = 0;
      for (let i = 0; i < px.length; i += 4) {
        R += px[i];
        G += px[i + 1];
        B += px[i + 2];
        n++;
      }
      return { w: img.width, h: img.height, r: R / n, g: G / n, b: B / n };
    }, b64);
    const excess = r.g - (r.r + r.b) / 2;
    console.log(
      `${f.split('/').pop()}  ${r.w}x${r.h}  R=${r.r.toFixed(1)} G=${r.g.toFixed(1)} B=${r.b.toFixed(1)}  green-excess=${excess.toFixed(2)}`
    );
  }
} finally {
  await browser.close();
}
