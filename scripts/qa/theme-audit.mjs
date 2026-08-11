// Theme and responsive smoke audit across every public P0 route.
// Checks the resolved system theme, body/hero contrast, overflow, and console.
//
//   node scripts/qa/theme-audit.mjs [baseUrl]
import { launchChromium } from './chromium.mjs';

const BASE = process.argv[2] || 'http://localhost:3000';
const ROUTES = [
  '/',
  '/from-photo',
  '/from-video',
  '/matcha-filter-trend',
  '/how-to-remove-matcha-filter',
  '/zh',
  '/zh/from-photo',
  '/zh/from-video',
  '/zh/matcha-filter-trend',
  '/zh/how-to-remove-matcha-filter',
  '/privacy-policy',
  '/terms-of-service',
  '/contact',
];
const CASES = [
  { theme: 'light', width: 390, height: 844 },
  { theme: 'dark', width: 390, height: 844 },
  { theme: 'light', width: 1512, height: 982 },
  { theme: 'dark', width: 1512, height: 982 },
];

const browser = await launchChromium();
let failures = 0;

async function gotoWithRetry(page, url) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const transient =
        /ERR_NETWORK_CHANGED|ERR_CONNECTION_RESET|ERR_TIMED_OUT/.test(message);
      if (!transient || attempt === 3) throw error;
      await page.waitForTimeout(attempt * 500);
    }
  }

  throw lastError;
}

try {
  for (const testCase of CASES) {
    const context = await browser.newContext({
      viewport: { width: testCase.width, height: testCase.height },
      colorScheme: testCase.theme,
    });

    for (const path of ROUTES) {
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => consoleErrors.push(error.message));
      await gotoWithRetry(page, `${BASE}${path}`);

      const report = await page.evaluate((expectedTheme) => {
        const toRgb = (cssColor) => {
          const canvas = document.createElement('canvas');
          canvas.width = 1;
          canvas.height = 1;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = cssColor;
          context.fillRect(0, 0, 1, 1);
          return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
        };
        const luminance = (rgb) => {
          const channels = rgb.map((channel) => {
            const value = channel / 255;
            return value <= 0.04045
              ? value / 12.92
              : ((value + 0.055) / 1.055) ** 2.4;
          });
          return (
            0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
          );
        };
        const contrast = (foreground, background) => {
          const first = luminance(toRgb(foreground));
          const second = luminance(toRgb(background));
          return (
            (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
          );
        };

        const body = getComputedStyle(document.body);
        const bodyContrast = contrast(body.color, body.backgroundColor);
        const hero = document.querySelector('#tool');
        const muted = hero?.querySelector('.text-muted-foreground');
        const mutedContrast = muted
          ? contrast(getComputedStyle(muted).color, body.backgroundColor)
          : null;

        return {
          expectedTheme,
          resolvedTheme: document.documentElement.classList.contains('dark')
            ? 'dark'
            : 'light',
          bodyContrast,
          mutedContrast,
          overflow:
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        };
      }, testCase.theme);

      const problems = [];
      if (report.resolvedTheme !== report.expectedTheme) {
        problems.push(`resolved ${report.resolvedTheme}`);
      }
      if (report.bodyContrast < 7) {
        problems.push(`body contrast ${report.bodyContrast.toFixed(2)}`);
      }
      if (report.mutedContrast !== null && report.mutedContrast < 4.5) {
        problems.push(`hero muted contrast ${report.mutedContrast.toFixed(2)}`);
      }
      if (report.overflow > 0) problems.push(`overflow ${report.overflow}px`);
      if (consoleErrors.length) {
        problems.push(`console: ${consoleErrors[0].slice(0, 80)}`);
      }

      if (problems.length) {
        failures++;
        console.log(
          `FAIL ${testCase.theme} ${testCase.width}px ${path} — ${problems.join('; ')}`
        );
      } else {
        console.log(
          `PASS ${testCase.theme} ${testCase.width}px ${path} — body ${report.bodyContrast.toFixed(2)}${
            report.mutedContrast === null
              ? ''
              : `, muted ${report.mutedContrast.toFixed(2)}`
          }`
        );
      }

      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(
  failures ? `\n${failures} theme check(s) failed` : '\nAll theme checks passed'
);
process.exit(failures ? 1 : 0);
