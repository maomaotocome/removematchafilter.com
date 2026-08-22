// Build responsive derivatives from the already-approved public example
// outputs without re-running or altering the underlying renderer evidence.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { launchChromium } from './chromium.mjs';

const directory = join(process.cwd(), 'public/imgs/examples');
const scenes = ['portrait', 'creator', 'friends', 'city', 'product', 'food'];
const states = ['before', 'after'];
const width = 1152;

const browser = await launchChromium();
try {
  const page = await browser.newPage();
  for (const scene of scenes) {
    for (const state of states) {
      const stem = `photo-${scene}-${state}`;
      const input = readFileSync(join(directory, `${stem}.webp`)).toString(
        'base64'
      );
      const encoded = await page.evaluate(
        async ({ base64, targetWidth }) => {
          const image = new Image();
          image.src = `data:image/webp;base64,${base64}`;
          await image.decode();
          const targetHeight = Math.round(
            (image.naturalHeight / image.naturalWidth) * targetWidth
          );
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          canvas
            .getContext('2d')
            .drawImage(image, 0, 0, targetWidth, targetHeight);
          return canvas.toDataURL('image/webp', 0.82).split(',')[1];
        },
        { base64: input, targetWidth: width }
      );
      writeFileSync(
        join(directory, `${stem}-${width}.webp`),
        Buffer.from(encoded, 'base64')
      );
      console.log(`wrote ${stem}-${width}.webp`);
    }
  }
} finally {
  await browser.close();
}
