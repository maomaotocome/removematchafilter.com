#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { launchChromium } from './chromium.mjs';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'public/favicon.svg');

function createIco(frames) {
  const headerSize = 6;
  const directorySize = frames.length * 16;
  const header = Buffer.alloc(headerSize + directorySize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);

  let offset = header.length;
  frames.forEach(({ size, png }, index) => {
    const entry = headerSize + index * 16;
    header.writeUInt8(size === 256 ? 0 : size, entry);
    header.writeUInt8(size === 256 ? 0 : size, entry + 1);
    header.writeUInt8(0, entry + 2);
    header.writeUInt8(0, entry + 3);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });

  return Buffer.concat([header, ...frames.map(({ png }) => png)]);
}

const svg = await readFile(SOURCE, 'utf8');
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const browser = await launchChromium();

try {
  const context = await browser.newContext({
    viewport: { width: 512, height: 512 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.setContent(
    `<!doctype html><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}img{display:block;width:100%;height:100%}</style><img alt="" src="${dataUrl}">`
  );
  await page.locator('img').evaluate((image) => image.decode());

  const cache = new Map();
  const render = async (size) => {
    if (cache.has(size)) return cache.get(size);
    await page.setViewportSize({ width: size, height: size });
    const png = await page.screenshot({ type: 'png' });
    cache.set(size, png);
    return png;
  };

  const outputs = [
    [96, 'public/favicon-96x96.png'],
    [180, 'public/apple-touch-icon.png'],
    [192, 'public/web-app-manifest-192x192.png'],
    [512, 'public/web-app-manifest-512x512.png'],
    [512, 'public/logo-512.png'],
  ];

  for (const [size, relativePath] of outputs) {
    await writeFile(path.join(ROOT, relativePath), await render(size));
    console.log(`wrote ${relativePath} (${size}x${size})`);
  }

  const icoFrames = await Promise.all(
    [16, 32, 48, 256].map(async (size) => ({
      size,
      png: await render(size),
    }))
  );
  await writeFile(path.join(ROOT, 'public/favicon.ico'), createIco(icoFrames));
  console.log('wrote public/favicon.ico (16, 32, 48, 256)');
} finally {
  await browser.close();
}
