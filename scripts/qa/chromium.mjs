// Resolve a launchable Chromium for QA scripts.
//
// The locally cached browser revisions don't always match what the installed
// playwright build expects, so prefer an explicit CHROME_EXE, then any
// Chrome-for-Testing / Chromium app in the Playwright cache, then whatever
// playwright resolves on its own.
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const CACHE = join(homedir(), 'Library/Caches/ms-playwright');

const APP_PATHS = [
  'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  'chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium',
  'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
  'chrome-linux/chrome',
];

export function findChromium() {
  if (process.env.CHROME_EXE && existsSync(process.env.CHROME_EXE)) {
    return process.env.CHROME_EXE;
  }
  if (!existsSync(CACHE)) return undefined;

  const dirs = readdirSync(CACHE)
    .filter((d) => d.startsWith('chromium-') && !d.includes('headless_shell'))
    // Highest revision first.
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));

  for (const dir of dirs) {
    for (const rel of APP_PATHS) {
      const candidate = join(CACHE, dir, rel);
      if (existsSync(candidate)) return candidate;
    }
  }
  return undefined;
}

export async function launchChromium(options = {}) {
  const executablePath = findChromium();
  return chromium.launch({
    ...options,
    ...(executablePath ? { executablePath } : {}),
  });
}
