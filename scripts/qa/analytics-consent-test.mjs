// Browser QA for the default-deny, reversible analytics boundary.
// Run against a local instance whose config contains a non-production GA test
// ID; every Google endpoint is intercepted before a real request is made.
import { launchChromium } from './chromium.mjs';

const BASE = (process.argv[2] || 'http://localhost:3001').replace(/\/+$/, '');
const STORAGE_KEY = 'remove-matcha-filter.analytics-consent.v1';
const analyticsPattern = /(?:googletagmanager\.com|google-analytics\.com)/i;
const results = [];

function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(
    `${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`
  );
}

async function newContext(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const attempts = [];
  await context.route(analyticsPattern, async (route) => {
    attempts.push(route.request().url());
    await route.abort('blockedbyclient');
  });
  await context.addInitScript(
    (key) => localStorage.removeItem(key),
    STORAGE_KEY
  );
  return { context, attempts };
}

const browser = await launchChromium();
try {
  const english = await newContext(browser);
  const page = await english.context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

  const region = page.getByRole('region', { name: 'Analytics choices' });
  record('unknown choice shows the analytics panel', await region.isVisible());
  record(
    'analytics loader is absent before a choice',
    (await page.locator('#ga-loader').count()) === 0
  );
  record(
    'no analytics request occurs before a choice',
    english.attempts.length === 0,
    `${english.attempts.length} request(s)`
  );
  record(
    'privacy link stays in the active locale',
    (await region.getByRole('link').getAttribute('href')) === '/privacy-policy'
  );

  await region.getByRole('button', { name: 'Decline' }).click();
  record(
    'decline persists the choice',
    (await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)) ===
      'denied'
  );
  record(
    'decline still loads no analytics',
    english.attempts.length === 0 &&
      (await page.locator('#ga-loader').count()) === 0
  );

  await page
    .getByRole('button', { name: /Analytics settings: declined/ })
    .click();
  await page.getByRole('button', { name: 'Allow analytics' }).click();
  await page.waitForTimeout(2_500);
  record(
    'allow persists the choice and opens the reviewed GA path',
    (await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)) ===
      'granted' &&
      english.attempts.some((url) =>
        /googletagmanager\.com\/gtag\/js/.test(url)
      ),
    `${english.attempts.length} intercepted request(s)`
  );
  record(
    'product events receive the same granted signal',
    (await page.evaluate(() => window.__matchaAnalyticsConsent)) === 'granted'
  );

  await page
    .getByRole('button', { name: /Analytics settings: allowed/ })
    .click();
  await page.getByRole('button', { name: 'Decline' }).click();
  record(
    'withdraw removes the loader and denies future events',
    (await page.locator('#ga-loader').count()) === 0 &&
      (await page.evaluate(() => window.__matchaAnalyticsConsent)) === 'denied'
  );
  await english.context.close();

  const chinese = await newContext(browser);
  const zhPage = await chinese.context.newPage();
  await zhPage.goto(`${BASE}/zh`, { waitUntil: 'networkidle' });
  const zhRegion = zhPage.getByRole('region', { name: '分析数据选择' });
  record('Chinese consent copy is rendered', await zhRegion.isVisible());
  record(
    'Chinese privacy link preserves /zh',
    (await zhRegion.getByRole('link').getAttribute('href')) ===
      '/zh/privacy-policy'
  );
  await chinese.context.close();
} finally {
  await browser.close();
}

const failures = results.filter((result) => !result.pass);
console.log(
  failures.length
    ? `\n${failures.length} analytics consent check(s) failed.`
    : '\nAll analytics consent checks passed.'
);
process.exit(failures.length ? 1 : 0);
