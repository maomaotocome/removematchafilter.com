// Responsive and theme smoke test for the seven bilingual SEO routes.
//
//   pnpm qa:seo-layout [baseUrl]
import { launchChromium } from './chromium.mjs';

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');
const ROUTES = [
  '/',
  '/from-photo',
  '/from-video',
  '/matcha-filter-trend',
  '/how-to-remove-matcha-filter',
  '/remove-matcha-filter-tiktok',
  '/remove-matcha-filter-capcut',
];
const VIEWPORTS = [
  { label: 'phone', width: 390, height: 844 },
  { label: 'tablet', width: 768, height: 1024 },
  { label: 'desktop', width: 1440, height: 1000 },
];
const THEMES = ['light', 'dark'];

function localizedPath(path, locale) {
  if (locale === 'en') return path;
  return path === '/' ? '/zh' : `/zh${path}`;
}

const browser = await launchChromium({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});

let failures = 0;

try {
  for (const locale of ['en', 'zh']) {
    for (const route of ROUTES) {
      for (const viewport of VIEWPORTS) {
        for (const theme of THEMES) {
          const context = await browser.newContext({
            viewport: {
              width: viewport.width,
              height: viewport.height,
            },
            colorScheme: theme,
          });
          const page = await context.newPage();
          const consoleErrors = [];
          page.on('console', (message) => {
            if (message.type() === 'error') consoleErrors.push(message.text());
          });

          const path = localizedPath(route, locale);
          const response = await page.goto(`${BASE}${path}`, {
            waitUntil: 'domcontentloaded',
          });
          await page.waitForSelector('h1');
          await page.waitForTimeout(75);

          const result = await page.evaluate(() => {
            const visible = (element) => {
              const style = getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              return (
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                rect.width > 0 &&
                rect.height > 0
              );
            };
            const shell =
              document.querySelector('.bg-background') ?? document.body;
            const foreground = getComputedStyle(shell).color;
            const background = getComputedStyle(shell).backgroundColor;
            const duplicateIds = Object.entries(
              [...document.querySelectorAll('[id]')].reduce(
                (counts, element) => {
                  counts[element.id] = (counts[element.id] ?? 0) + 1;
                  return counts;
                },
                {}
              )
            )
              .filter(([, count]) => count > 1)
              .map(([id]) => id);
            const wide = [...document.querySelectorAll('body *')]
              .filter((element) => {
                if (!visible(element)) return false;
                const rect = element.getBoundingClientRect();
                return rect.left < -1 || rect.right > window.innerWidth + 1;
              })
              .slice(0, 4)
              .map((element) => element.tagName.toLowerCase());

            return {
              lang: document.documentElement.lang,
              dark: document.documentElement.classList.contains('dark'),
              h1s: [...document.querySelectorAll('h1')].filter(visible).length,
              landmarks: {
                header: document.querySelectorAll('header').length,
                main: document.querySelectorAll('main').length,
                footer: document.querySelectorAll('footer').length,
              },
              overflow:
                document.documentElement.scrollWidth - window.innerWidth,
              wide,
              foreground,
              background,
              duplicateIds,
              unnamedLinks: [...document.querySelectorAll('a')].filter(
                (link) =>
                  visible(link) &&
                  !link.textContent?.trim() &&
                  !link.getAttribute('aria-label')
              ).length,
            };
          });

          const problems = [];
          if (response?.status() !== 200)
            problems.push(`HTTP ${response?.status() ?? 'missing'}`);
          if (result.lang !== locale) problems.push(`lang=${result.lang}`);
          if (result.dark !== (theme === 'dark'))
            problems.push(`theme class is ${result.dark ? 'dark' : 'light'}`);
          if (result.h1s !== 1) problems.push(`${result.h1s} visible H1s`);
          if (
            result.landmarks.header < 1 ||
            result.landmarks.main !== 1 ||
            result.landmarks.footer !== 1
          ) {
            problems.push(`landmarks=${JSON.stringify(result.landmarks)}`);
          }
          if (result.overflow > 1)
            problems.push(
              `overflow=${result.overflow}px (${result.wide.join(', ')})`
            );
          if (result.foreground === result.background) {
            problems.push(`base colors are identical (${result.foreground})`);
          }
          if (result.duplicateIds.length)
            problems.push(`duplicate IDs=${result.duplicateIds.join(', ')}`);
          if (result.unnamedLinks)
            problems.push(`${result.unnamedLinks} unnamed link(s)`);
          if (consoleErrors.length)
            problems.push(`console=${consoleErrors[0].slice(0, 100)}`);

          console.log(
            `${problems.length ? 'FAIL' : 'PASS'} ${locale} ${path} ${viewport.label} ${theme}${
              problems.length ? ` — ${problems.join('; ')}` : ''
            }`
          );
          failures += problems.length;
          await context.close();
        }
      }
    }
  }
} finally {
  await browser.close();
}

console.log(
  failures
    ? `\n${failures} responsive/theme check(s) failed.`
    : '\nAll 84 bilingual responsive/theme checks passed.'
);
process.exit(failures ? 1 : 0);
