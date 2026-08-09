// Produce the site's before/after example images.
//
// §4.2 requires examples that are (a) our own media and (b) genuinely produced
// by the current build. So this drives the real tool in a real browser and
// screenshots the two preview panes — no hand-made "after" images.
//
//   node .output/server/index.mjs &
//   node scripts/qa/make-examples.mjs [baseUrl]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { launchChromium } from './chromium.mjs';

const BASE = process.argv[2] || 'http://localhost:3000';
const PHOTO = join(process.cwd(), 'scripts/qa/fixtures/matcha-photo.png');
const OUT = 'public/imgs/examples';
mkdirSync(OUT, { recursive: true });

const browser = await launchChromium({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});

try {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/from-photo`, { waitUntil: 'networkidle' });
  await page.setInputFiles('input[type=file]', PHOTO);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(900);

  // "Before" is the untouched source preview; "after" is the live canvas.
  await page.locator('img[src^="blob:"]').screenshot({
    path: `${OUT}/example-1-before.png`,
  });
  await page.locator('canvas').screenshot({
    path: `${OUT}/example-1-after.png`,
  });
  console.log('wrote example-1 (default preset)');

  // A second pair at full colour strength, to show the control's range.
  await page.evaluate(() => {
    const label = [...document.querySelectorAll('label')].find((l) =>
      l.textContent.trim().startsWith('Color')
    );
    const input = document.getElementById(label.getAttribute('for'));
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    ).set;
    setter.call(input, '100');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(700);
  await page.locator('canvas').screenshot({
    path: `${OUT}/example-2-after.png`,
  });
  await page.locator('img[src^="blob:"]').screenshot({
    path: `${OUT}/example-2-before.png`,
  });
  console.log('wrote example-2 (colour at 100)');
} finally {
  await browser.close();
}
