// Generate the social preview image (1200x630) from real before/after output.
// Uses the example PNGs produced by `pnpm qa:examples`, so the card shows the
// actual result of the current build rather than a mockup.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { launchChromium } from './chromium.mjs';

const BEFORE = 'public/imgs/examples/example-1-before.png';
const AFTER = 'public/imgs/examples/example-1-after.png';
const OUT = 'public/imgs/og-cover.png';

for (const file of [BEFORE, AFTER]) {
  if (!existsSync(file)) {
    console.error(`missing ${file} — run \`pnpm qa:examples\` first`);
    process.exit(1);
  }
}

const toDataUrl = (file) =>
  `data:image/png;base64,${readFileSync(file).toString('base64')}`;

const browser = await launchChromium();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  });
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{width:1200px;height:630px;background:#faf9f6;
        font-family:-apple-system,'Segoe UI',Roboto,sans-serif;
        display:flex;flex-direction:column;padding:56px 64px}
      h1{font-size:58px;line-height:1.08;letter-spacing:-1.5px;color:#1c1b18;
        font-weight:700;max-width:1000px}
      p{font-size:25px;color:#5c5a54;margin-top:18px;max-width:900px}
      .pair{display:flex;gap:20px;margin-top:auto}
      .cell{flex:1;position:relative;border-radius:14px;overflow:hidden;
        border:1px solid #e2e0d9}
      .cell img{display:block;width:100%;height:232px;object-fit:cover}
      .tag{position:absolute;top:10px;left:10px;background:rgba(255,255,255,.92);
        color:#1c1b18;font-size:14px;font-weight:600;padding:5px 12px;
        border-radius:999px}
      .foot{display:flex;align-items:center;gap:14px;margin-top:22px}
      .badge{background:#1c1b18;color:#fff;font-size:17px;font-weight:600;
        padding:9px 18px;border-radius:999px}
      .note{font-size:19px;color:#6b6960}
    </style></head><body>
      <h1>Remove Matcha Filter from Photos and Videos</h1>
      <p>Reduce the green cast, grain and flattened contrast — in your browser.</p>
      <div class="pair">
        <div class="cell"><img src="${toDataUrl(BEFORE)}"><span class="tag">Before</span></div>
        <div class="cell"><img src="${toDataUrl(AFTER)}"><span class="tag">After</span></div>
      </div>
      <div class="foot">
        <span class="badge">Free · No upload</span>
        <span class="note">removematchafilter.com</span>
      </div>
    </body></html>`,
    { waitUntil: 'load' }
  );
  await page.waitForTimeout(400);
  const buffer = await page.screenshot({ type: 'png' });
  writeFileSync(OUT, buffer);
  console.log(`wrote ${OUT} (${buffer.length} bytes, 1200x630)`);
} finally {
  await browser.close();
}
