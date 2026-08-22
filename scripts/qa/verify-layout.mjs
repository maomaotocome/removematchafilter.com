// Verify the rendered homepage: computed typography, section rhythm, image
// wiring, and overflow at several viewports.
//
// The page is hydrated from a TanStack Start SSR payload, so the initial HTML
// response contains no markup to grep — the DOM only exists in a browser. This
// script inspects the real thing.
//
//   node .output/server/index.mjs &
//   node scripts/qa/verify-layout.mjs [baseUrl] [path]
import { launchChromium } from './chromium.mjs';

const BASE = process.argv[2] || 'http://localhost:3000';
const PATH = process.argv[3] || '/';

// Real device pixel ratios, not 1 — asset resolution can only be judged in
// device pixels, and these are the DPRs actual visitors arrive with.
const VIEWPORTS = [
  { label: 'phone  ', width: 390, height: 844, dpr: 3 },
  { label: 'tablet ', width: 768, height: 1024, dpr: 2 },
  { label: 'laptop ', width: 1512, height: 982, dpr: 2 },
  { label: 'desktop', width: 1920, height: 1080, dpr: 1 },
];

const browser = await launchChromium({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});

let failures = 0;

try {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(`${BASE}${PATH}`, { waitUntil: 'networkidle' });

    // The example images are loading="lazy", so without scrolling they never
    // start and every naturalWidth reads 0 — which would let a genuinely broken
    // src pass the check below.
    //
    // Bring each lazy image into view and dwell there, the way a reader would.
    // A fast scroll sweep that returns to the top does *not* reliably start a
    // loading="lazy" fetch, which made perfectly good images look broken.
    await page.evaluate(async () => {
      for (const img of document.querySelectorAll('img[loading="lazy"]')) {
        img.scrollIntoView({ block: 'center' });
        await new Promise((r) => setTimeout(r, 250));
      }
      // Then a full sweep, so layout is measured with everything present.
      const step = window.innerHeight;
      const steps = Math.min(30, Math.ceil(document.body.scrollHeight / step));
      for (let i = 0; i <= steps; i++) {
        window.scrollTo(0, i * step);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
    // Decode with a hard timeout so a single stalled image can't hang the run.
    await page
      .evaluate(() =>
        Promise.race([
          Promise.all(
            [...document.querySelectorAll('img')].map((i) =>
              i.decode().catch(() => {})
            )
          ),
          new Promise((r) => setTimeout(r, 8000)),
        ])
      )
      .catch(() => {});
    // The first viewport pays a cold cache, and at 3x DPR that now includes the
    // full comparison gallery. Poll until every image has decoded rather than
    // waiting a fixed beat — a short wait reports good lazy images as broken.
    await page.waitForLoadState('networkidle').catch(() => {});
    await page
      .waitForFunction(
        () =>
          [...document.querySelectorAll('img')].every(
            (i) => i.naturalWidth > 0
          ),
        undefined,
        { timeout: 15000 }
      )
      .catch(() => {});

    // Exercise every scenario even though the compact gallery only keeps one
    // comparison mounted at a time. This catches broken non-default fixtures
    // and verifies that all six selectors really swap the evidence panel.
    const scenarioResults = [];
    const exampleOptions = page.locator('[data-example-option]');
    for (let index = 0; index < (await exampleOptions.count()); index++) {
      const option = exampleOptions.nth(index);
      await option.click();
      await page
        .waitForFunction(
          (activeIndex) =>
            document
              .querySelectorAll('[data-example-option]')
              [activeIndex]?.getAttribute('aria-pressed') === 'true',
          index,
          { timeout: 3000 }
        )
        .catch(() => {});
      await page.locator('[data-example-compare]').scrollIntoViewIfNeeded();
      await page
        .waitForFunction(
          () => {
            const images = [
              ...document.querySelectorAll('[data-example-compare] img'),
            ];
            return (
              images.length === 2 &&
              images.every((image) => image.complete && image.naturalWidth > 0)
            );
          },
          undefined,
          { timeout: 8000 }
        )
        .catch(() => {});
      scenarioResults.push(
        await page.evaluate(() => ({
          title:
            document
              .querySelector('[data-example-option][aria-pressed="true"]')
              ?.textContent?.trim() ?? '',
          imagesReady: [
            ...document.querySelectorAll('[data-example-compare] img'),
          ].every((image) => image.complete && image.naturalWidth > 0),
        }))
      );
    }
    const report = await page.evaluate(async () => {
      const h1 = document.querySelector('h1');
      const h2 = document.querySelector('h2');
      const cs = (el) => (el ? getComputedStyle(el) : null);
      const h1s = cs(h1);
      const h2s = cs(h2);

      // Horizontal overflow is the classic responsive break.
      const overflow = document.documentElement.scrollWidth - window.innerWidth;

      // Any element wider than the viewport is a culprit worth naming.
      const wide = [...document.querySelectorAll('body *')]
        .filter(
          (el) => el.getBoundingClientRect().width > window.innerWidth + 1
        )
        .slice(0, 5)
        .map(
          (el) =>
            `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`
        );

      // After the scroll pass anything still at naturalWidth 0 is genuinely
      // broken — an unloaded lazy image is no longer an excuse.
      //
      // `naturalWidth` is density-corrected when srcset width descriptors are
      // active, so it is not the physical pixel width of the selected file.
      // Decode currentSrc as an ImageBitmap to inspect the real asset instead;
      // otherwise a correct 1280 px retina source can be reported as 427 px.
      const imgs = await Promise.all(
        [...document.querySelectorAll('img')].map(async (i) => {
          const css = i.getBoundingClientRect().width;
          let physicalWidth = i.naturalWidth;
          try {
            const response = await fetch(i.currentSrc, {
              cache: 'force-cache',
            });
            const bitmap = await createImageBitmap(await response.blob());
            physicalWidth = bitmap.width;
            bitmap.close();
          } catch {
            // Keep the browser-reported fallback for formats ImageBitmap cannot
            // decode; broken images remain caught by naturalWidth === 0.
          }
          return {
            src: i.getAttribute('src'),
            natural: physicalWidth,
            rendered: Math.round(css),
            needed: Math.round(css * window.devicePixelRatio),
            broken: i.naturalWidth === 0,
          };
        })
      );

      const grain = [...document.querySelectorAll('.paper-grain')].length;
      const rules = [...document.querySelectorAll('.rule-fade')].length;
      const balanced = [...document.querySelectorAll('.text-balance')].length;
      const fileInput = document.querySelector('#tool input[type="file"]');
      const primaryCta = fileInput?.closest('label');
      const visualCta = primaryCta?.querySelector('[data-file-cta]');
      const ctaRect = visualCta?.getBoundingClientRect();
      const brand =
        document.querySelector('header a')?.textContent?.trim() ?? '';
      const tool = document.querySelector('#tool');
      const gallery = document.querySelector('[data-example-gallery]');

      return {
        h1: h1 && {
          text: h1.textContent.slice(0, 48),
          size: h1s.fontSize,
          lh: h1s.lineHeight,
          tracking: h1s.letterSpacing,
          family: h1s.fontFamily.split(',')[0],
        },
        h2: h2 && { size: h2s.fontSize, family: h2s.fontFamily.split(',')[0] },
        overflow,
        wide,
        imgs,
        grain,
        rules,
        balanced,
        dpr: window.devicePixelRatio,
        brand,
        primaryCta: ctaRect
          ? {
              label: visualCta?.textContent?.trim() ?? '',
              top: Math.round(ctaRect.top + window.scrollY),
              bottom: Math.round(ctaRect.bottom + window.scrollY),
              height: Math.round(ctaRect.height),
            }
          : null,
        exampleCount: document.querySelectorAll('[data-example-compare]')
          .length,
        exampleOptionCount: document.querySelectorAll('[data-example-option]')
          .length,
        galleryImmediatelyAfterTool: tool?.nextElementSibling === gallery,
        sampleCta: Boolean(document.querySelector('[data-sample-cta]')),
      };
    });

    console.log(`\n[${vp.label}] ${vp.width}x${vp.height} @${vp.dpr}x`);
    if (report.h1) {
      console.log(
        `  h1  ${report.h1.size} / lh ${report.h1.lh} / tracking ${report.h1.tracking} / ${report.h1.family}`
      );
    } else {
      console.log('  h1  MISSING');
      failures++;
    }
    if (report.h2) console.log(`  h2  ${report.h2.size} / ${report.h2.family}`);
    console.log(
      `  paper-grain=${report.grain}  rule-fade=${report.rules}  text-balance=${report.balanced}`
    );

    if (report.brand !== 'Remove Matcha Filter') {
      console.log(`  ✗ brand: ${report.brand || 'MISSING'}`);
      failures++;
    } else {
      console.log('  ✓ brand: Remove Matcha Filter');
    }

    if (!report.primaryCta) {
      console.log('  ✗ primary file chooser missing');
      failures++;
    } else if (
      report.primaryCta.top < 0 ||
      report.primaryCta.bottom > vp.height
    ) {
      console.log(
        `  ✗ primary CTA below fold: ${report.primaryCta.label} y=${report.primaryCta.top}-${report.primaryCta.bottom}`
      );
      failures++;
    } else {
      console.log(
        `  ✓ primary CTA in first screen: ${report.primaryCta.label} y=${report.primaryCta.top}-${report.primaryCta.bottom}`
      );
    }

    if (
      report.exampleCount !== 1 ||
      report.exampleOptionCount !== 6 ||
      scenarioResults.some((scenario) => !scenario.imagesReady) ||
      new Set(scenarioResults.map((scenario) => scenario.title)).size !== 6
    ) {
      console.log(
        `  ✗ compact gallery: ${report.exampleCount} visible comparison, ${report.exampleOptionCount} options, ${scenarioResults.filter((scenario) => scenario.imagesReady).length}/6 scenarios loaded`
      );
      failures++;
    } else {
      console.log('  ✓ compact gallery: 1 comparison, 6 working scenarios');
    }

    if (!report.galleryImmediatelyAfterTool) {
      console.log('  ✗ Before/After gallery is not immediately after the tool');
      failures++;
    } else {
      console.log('  ✓ Before/After gallery immediately follows the tool');
    }

    if (!report.sampleCta) {
      console.log(
        '  ✗ bundled sample action missing from the empty tool state'
      );
      failures++;
    } else {
      console.log('  ✓ bundled sample action is available');
    }

    if (report.overflow > 0) {
      console.log(
        `  ✗ horizontal overflow: ${report.overflow}px  ${report.wide.join(', ')}`
      );
      failures++;
    } else {
      console.log('  ✓ no horizontal overflow');
    }

    const broken = report.imgs.filter((i) => i.broken);
    if (broken.length) {
      console.log(`  ✗ broken images: ${broken.map((b) => b.src).join(', ')}`);
      failures++;
    } else {
      console.log(`  ✓ ${report.imgs.length} images loaded`);
      for (const i of report.imgs) {
        if (i.src?.includes('/imgs/')) {
          let note = '';
          if (i.needed > 0 && i.natural < i.needed * 0.9) {
            note = `  ⚠ soft on this DPR (needs ~${i.needed}px)`;
          } else if (i.needed > 0 && i.natural > i.needed * 2) {
            note = `  ⚠ ${(i.natural / i.needed).toFixed(1)}x more pixels than needed`;
          }
          console.log(
            `      ${i.src}  natural ${i.natural}px, rendered ${i.rendered}px @${report.dpr}x → needs ${i.needed}px${note}`
          );
        }
      }
    }

    if (errors.length) {
      console.log(`  ✗ console errors: ${errors.slice(0, 3).join(' | ')}`);
      failures++;
    } else {
      console.log('  ✓ no console errors');
    }

    await ctx.close();
  }
} finally {
  await browser.close();
}

console.log(
  failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`
);
process.exit(failures === 0 ? 0 : 1);
