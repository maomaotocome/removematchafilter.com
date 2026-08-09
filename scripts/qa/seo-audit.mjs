// Server-rendered SEO audit: pnpm qa:seo [baseUrl]
//
// Run against a production build. The assertions cover the five public SEO
// routes in English and Chinese. Word and phrase counts remain diagnostics;
// content quality is not reduced to a density or length target.
import { readFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');
const ORIGIN = new URL(BASE).origin;
const messages = {
  en: JSON.parse(readFileSync('messages/en.json', 'utf8')),
  zh: JSON.parse(readFileSync('messages/zh.json', 'utf8')),
};

const TARGETS = [
  {
    path: '/',
    h1Key: 'home.h1',
    phrase: 'remove matcha filter',
    schemas: ['WebApplication', 'FAQPage'],
  },
  {
    path: '/from-photo',
    h1Key: 'photo.h1',
    phrase: 'remove matcha filter from a photo',
    schemas: ['WebApplication', 'BreadcrumbList', 'FAQPage'],
  },
  {
    path: '/from-video',
    h1Key: 'video.h1',
    phrase: 'remove matcha filter from a video',
    schemas: ['WebApplication', 'BreadcrumbList', 'FAQPage'],
  },
  {
    path: '/matcha-filter-trend',
    h1Key: 'trend.h1',
    phrase: 'matcha filter trend',
    schemas: ['Article', 'BreadcrumbList', 'FAQPage'],
  },
  {
    path: '/how-to-remove-matcha-filter',
    h1Key: 'guide.h1',
    phrase: 'how to remove matcha filter',
    schemas: ['Article', 'HowTo', 'BreadcrumbList', 'FAQPage'],
  },
];

const strip = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

function bodyText(html) {
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
  return strip(
    body
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
  );
}

const countPhrase = (text, phrase) =>
  (
    text
      .toLowerCase()
      .match(
        new RegExp(
          phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'g'
        )
      ) || []
  ).length;

const headings = (html, tag) =>
  [
    ...html.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi')),
  ].map((match) => strip(match[1]));

function attrs(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)=(?:"([^"]*)"|'([^']*)')/g)].map(
      ([, name, doubleValue, singleValue]) => [
        name.toLowerCase(),
        doubleValue ?? singleValue ?? '',
      ]
    )
  );
}

const linkTags = (html) =>
  [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => attrs(m[0]));
const metaTags = (html) =>
  [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => attrs(m[0]));

function metaContent(html, attr, value) {
  return metaTags(html).find((tag) => tag[attr] === value)?.content ?? null;
}

function jsonLdTypes(html) {
  const types = [];
  const blocks = [
    ...html.matchAll(
      /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];
  for (const [, raw] of blocks) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      types.push('UNPARSEABLE');
      continue;
    }
    const walk = (node) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node['@graph'])) node['@graph'].forEach(walk);
      const type = node['@type'];
      if (type) types.push(...(Array.isArray(type) ? type : [type]));
    };
    walk(parsed);
  }
  return types;
}

function internalAnchors(html) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
    .map(([, rawAttrs, inner]) => ({
      href: attrs(`<a ${rawAttrs}>`).href ?? '',
      text: strip(inner),
    }))
    .filter((anchor) => /^\/(?!\/)/.test(anchor.href));
}

function localizedPath(path, locale) {
  if (locale === 'en') return path;
  return path === '/' ? '/zh' : `/zh${path}`;
}

function normalizePath(path) {
  const withoutLocale = path.replace(/^\/zh(?=\/|$)/, '') || '/';
  return withoutLocale.length > 1
    ? withoutLocale.replace(/\/+$/, '')
    : withoutLocale;
}

let failures = 0;
const titles = { en: new Map(), zh: new Map() };
const descriptions = { en: new Map(), zh: new Map() };
const canonicalOrigins = new Set();
const fail = (message) => {
  failures += 1;
  console.log(`  FAIL  ${message}`);
};

for (const locale of ['en', 'zh']) {
  for (const target of TARGETS) {
    const requestPath = localizedPath(target.path, locale);
    const response = await fetch(`${BASE}${requestPath}`);
    const html = await response.text();
    const text = bodyText(html);
    const h1s = headings(html, 'h1');
    const anchors = internalAnchors(html);
    const ldTypes = jsonLdTypes(html);
    const links = linkTags(html);
    const canonical = links.find((link) => link.rel === 'canonical')?.href;
    const alternates = Object.fromEntries(
      links
        .filter((link) => link.rel === 'alternate' && link.hreflang)
        .map((link) => [link.hreflang, link.href])
    );
    const expectedH1 = messages[locale][target.h1Key];
    const htmlLang = html.match(/<html[^>]+lang="([^"]+)"/i)?.[1];

    console.log(`\n=== ${requestPath} (${locale}) ===`);
    if (response.status !== 200) fail(`HTTP ${response.status}`);
    if (htmlLang !== locale) fail(`<html lang> is ${htmlLang ?? 'missing'}`);
    if (h1s.length !== 1) fail(`expected exactly 1 H1, found ${h1s.length}`);
    if (h1s[0] !== expectedH1) {
      fail(`H1 mismatch: expected "${expectedH1}", received "${h1s[0] ?? ''}"`);
    }

    if (!canonical) {
      fail('no canonical link');
    } else {
      const canonicalUrl = new URL(canonical, ORIGIN);
      canonicalOrigins.add(canonicalUrl.origin);
      const canonicalPath = normalizePath(canonicalUrl.pathname);
      if (canonicalPath !== target.path) {
        fail(`canonical points to wrong route: ${canonical}`);
      }
      const canonicalIsChinese = new URL(canonical, ORIGIN).pathname.startsWith(
        '/zh'
      );
      if ((locale === 'zh') !== canonicalIsChinese) {
        fail(`canonical locale mismatch: ${canonical}`);
      }
    }

    for (const hreflang of ['en', 'zh', 'x-default']) {
      if (!alternates[hreflang]) fail(`missing hreflang ${hreflang}`);
    }
    if (
      alternates.en &&
      normalizePath(new URL(alternates.en).pathname) !== target.path
    ) {
      fail(`English alternate points to wrong route: ${alternates.en}`);
    }
    if (alternates.zh) {
      const zhUrl = new URL(alternates.zh);
      if (
        !zhUrl.pathname.startsWith('/zh') ||
        normalizePath(zhUrl.pathname) !== target.path
      ) {
        fail(`Chinese alternate points to wrong route: ${alternates.zh}`);
      }
    }

    const title = strip(
      html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''
    );
    const description = metaContent(html, 'name', 'description');
    if (!title) fail('no <title>');
    if (!description) fail('no meta description');
    if (title) titles[locale].set(target.path, title);
    if (description) descriptions[locale].set(target.path, description);

    const ogMissing = [
      'og:title',
      'og:description',
      'og:url',
      'og:image',
    ].filter((property) => !metaContent(html, 'property', property));
    if (ogMissing.length) fail(`missing OG tags: ${ogMissing.join(', ')}`);
    if (ldTypes.includes('UNPARSEABLE')) fail('JSON-LD does not parse');
    for (const schema of target.schemas) {
      if (!ldTypes.includes(schema)) fail(`missing ${schema} JSON-LD`);
    }

    const linkedPaths = new Set(
      anchors.map((anchor) =>
        normalizePath(new URL(anchor.href, ORIGIN).pathname)
      )
    );
    const missingClusterLinks = TARGETS.map((item) => item.path).filter(
      (path) => path !== target.path && !linkedPaths.has(path)
    );
    if (missingClusterLinks.length) {
      fail(`missing cluster links: ${missingClusterLinks.join(', ')}`);
    }

    console.log(`  title               : ${title}`);
    console.log(`  canonical           : ${canonical}`);
    console.log(`  hreflang            : en, zh, x-default`);
    console.log(`  JSON-LD             : ${ldTypes.join(', ')}`);
    console.log(`  internal links      : ${anchors.length}`);
    console.log(
      `  body tokens         : ${text.split(/\s+/).filter(Boolean).length} (diagnostic)`
    );
    if (locale === 'en') {
      console.log(
        `  target phrase       : ${countPhrase(text, target.phrase)}x (diagnostic)`
      );
    }
  }
}

for (const locale of ['en', 'zh']) {
  const titleValues = [...titles[locale].values()];
  const descriptionValues = [...descriptions[locale].values()];
  if (new Set(titleValues).size !== titleValues.length)
    fail(`${locale}: duplicate titles`);
  if (new Set(descriptionValues).size !== descriptionValues.length) {
    fail(`${locale}: duplicate descriptions`);
  }
}

if (canonicalOrigins.size > 1) {
  fail(`inconsistent canonical origins: ${[...canonicalOrigins].join(', ')}`);
}
const canonicalOrigin = [...canonicalOrigins][0] ?? ORIGIN;

const sitemapResponse = await fetch(`${BASE}/sitemap.xml`);
const sitemap = await sitemapResponse.text();
if (sitemapResponse.status !== 200)
  fail(`sitemap HTTP ${sitemapResponse.status}`);
for (const target of TARGETS) {
  const expectedPath =
    target.path === '/'
      ? `${canonicalOrigin}/`
      : `${canonicalOrigin}${target.path}`;
  if (!sitemap.includes(expectedPath)) fail(`sitemap missing ${target.path}`);
}
if (!sitemap.includes('hreflang="en"') || !sitemap.includes('hreflang="zh"')) {
  fail('sitemap missing language alternates');
}

const robotsResponse = await fetch(`${BASE}/robots.txt`);
const robots = await robotsResponse.text();
if (robotsResponse.status !== 200) fail(`robots HTTP ${robotsResponse.status}`);
for (const rule of [
  'Disallow: /admin',
  'Disallow: /settings',
  'Disallow: /api/',
]) {
  if (!robots.includes(rule)) fail(`robots missing ${rule}`);
}
if (robots.includes('Disallow: /*?*'))
  fail('robots still blocks every query string');
if (!robots.includes('Sitemap:')) fail('robots missing sitemap directive');

console.log(
  failures
    ? `\n${failures} SEO check(s) failed.`
    : '\nAll bilingual SEO checks passed. Counts above are diagnostics, not ranking guarantees.'
);
process.exit(failures ? 1 : 0);
