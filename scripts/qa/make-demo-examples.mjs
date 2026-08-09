// Produce the site's photographic before/after examples.
//
// Same contract as make-examples.mjs — drive the real tool in a real browser and
// screenshot the two preview panes, so the "after" is genuinely this build's
// output and not a hand-made image. The difference is the input: these fixtures
// are photographs graded by make-demo-fixtures.mjs rather than the synthetic
// gradient chart, so the comparison shows the correction on a real subject.
//
//   node .output/server/index.mjs &
//   node scripts/qa/make-demo-examples.mjs [baseUrl]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { launchChromium } from './chromium.mjs';

const BASE = process.argv[2] || 'http://localhost:3000';
const OUT = 'public/imgs/examples';
mkdirSync(OUT, { recursive: true });

/** Fixture → output slug. Both use the product's safe default preset. */
const JOBS = [
  { fixture: 'demo-portrait.png', slug: 'photo-portrait' },
  { fixture: 'demo-flatlay.png', slug: 'photo-flatlay' },
];

const browser = await launchChromium({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});

try {
  // deviceScaleFactor 3 (not 2) because the examples render up to ~494px CSS
  // wide on a desktop and ~356px on a phone: at 2x-3x DPR that needs ~1000-1070
  // real pixels, and a 2x capture of the preview pane only yielded 792px, which
  // is visibly soft on exactly the retina screens most visitors have.
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 1100 },
    deviceScaleFactor: 3,
  });
  const page = await ctx.newPage();

  for (const job of JOBS) {
    const fixture = join(process.cwd(), 'scripts/qa/fixtures', job.fixture);
    await page.goto(`${BASE}/from-photo`, { waitUntil: 'networkidle' });
    await page.setInputFiles('input[type=file]', fixture);
    await page.waitForSelector('canvas');
    // The renderer analyses the frame then draws; give it a beat to settle so
    // the screenshot captures the corrected result rather than a first pass.
    await page.waitForTimeout(1200);

    // Encode media pixels directly. Element screenshots bake the UI's rounded
    // corners, background, and device scaling into the evidence image.
    const encoded = await page.evaluate(() => {
      const original = document.querySelector('img[src^="blob:"]');
      const adjusted = document.querySelector('canvas');
      if (!original || !adjusted) throw new Error('preview media not found');

      const encode = (source, width, height, type, quality) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(source, 0, 0, width, height);
        return canvas.toDataURL(type, quality).split(',')[1];
      };

      const width = original.naturalWidth;
      const height = original.naturalHeight;
      const smallWidth = 480;
      const smallHeight = Math.round((height / width) * smallWidth);

      return {
        before: encode(original, width, height, 'image/jpeg', 0.88),
        after: encode(
          adjusted,
          adjusted.width,
          adjusted.height,
          'image/jpeg',
          0.88
        ),
        beforeWebp: encode(original, width, height, 'image/webp', 0.82),
        afterWebp: encode(
          adjusted,
          adjusted.width,
          adjusted.height,
          'image/webp',
          0.82
        ),
        beforeWebpSmall: encode(
          original,
          smallWidth,
          smallHeight,
          'image/webp',
          0.8
        ),
        afterWebpSmall: encode(
          adjusted,
          smallWidth,
          smallHeight,
          'image/webp',
          0.8
        ),
      };
    });
    writeFileSync(
      `${OUT}/${job.slug}-before.jpg`,
      Buffer.from(encoded.before, 'base64')
    );
    writeFileSync(
      `${OUT}/${job.slug}-after.jpg`,
      Buffer.from(encoded.after, 'base64')
    );
    writeFileSync(
      `${OUT}/${job.slug}-before.webp`,
      Buffer.from(encoded.beforeWebp, 'base64')
    );
    writeFileSync(
      `${OUT}/${job.slug}-after.webp`,
      Buffer.from(encoded.afterWebp, 'base64')
    );
    writeFileSync(
      `${OUT}/${job.slug}-before-480.webp`,
      Buffer.from(encoded.beforeWebpSmall, 'base64')
    );
    writeFileSync(
      `${OUT}/${job.slug}-after-480.webp`,
      Buffer.from(encoded.afterWebpSmall, 'base64')
    );
    console.log(`wrote ${job.slug} from ${job.fixture}`);
  }
} finally {
  await browser.close();
}
