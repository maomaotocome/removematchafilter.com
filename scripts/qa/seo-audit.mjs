// Server-rendered SEO audit: pnpm qa:seo [baseUrl]
//
// Run against a production build. The assertions cover the seven public SEO
// routes in English and Chinese. Word and phrase counts remain diagnostics;
// content quality is not reduced to a density or length target.
import { readFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');
const ORIGIN = new URL(BASE).origin;
const OFFICIAL_REPOSITORY_URL =
  'https://github.com/maomaotocome/removematchafilter.com';
const PUBLIC_AUTHOR = 'Matcha Filter Remover Team';
const MAINTAINER = 'Jared';
const messages = {
  en: JSON.parse(readFileSync('messages/en.json', 'utf8')),
  zh: JSON.parse(readFileSync('messages/zh.json', 'utf8')),
};

const TARGETS = [
  {
    path: '/',
    h1Key: 'home.h1',
    phrases: ['matcha filter', 'matcha filter remover', 'remove matcha filter'],
    schemas: ['WebPage', 'WebApplication', 'FAQPage'],
  },
  {
    path: '/from-photo',
    h1Key: 'photo.h1',
    phrases: ['remove matcha filter from a photo', 'matcha filter remover'],
    schemas: ['WebApplication', 'BreadcrumbList', 'FAQPage'],
  },
  {
    path: '/from-video',
    h1Key: 'video.h1',
    phrases: ['remove matcha filter from a video', 'matcha filter remover'],
    schemas: ['WebApplication', 'BreadcrumbList', 'FAQPage'],
  },
  {
    path: '/matcha-filter-trend',
    h1Key: 'trend.h1',
    phrases: ['matcha filter trend'],
    schemas: ['Article', 'BreadcrumbList', 'FAQPage'],
  },
  {
    path: '/how-to-remove-matcha-filter',
    h1Key: 'guide.h1',
    phrases: ['how to remove matcha filter'],
    schemas: ['Article', 'HowTo', 'BreadcrumbList', 'FAQPage'],
  },
  {
    path: '/remove-matcha-filter-tiktok',
    h1Key: 'tiktok.h1',
    phrases: ['remove the matcha filter from a tiktok video', 'tiktok video'],
    schemas: ['WebApplication', 'BreadcrumbList', 'FAQPage'],
  },
  {
    path: '/remove-matcha-filter-capcut',
    h1Key: 'capcut.h1',
    phrases: ['remove the matcha filter in capcut', 'capcut project'],
    schemas: ['Article', 'BreadcrumbList', 'FAQPage'],
  },
];

// Keep established English ranking signals independent from the translations
// loaded above. This catches accidental title/H1 changes that would otherwise
// look self-consistent to the audit.
const RANKING_SIGNAL_LOCKS = {
  '/': {
    title: 'Remove Matcha Filter Online – Free Photo & Video Tool',
    h1: 'Free Matcha Filter Remover for Photos and Videos',
  },
  '/from-photo': {
    title: 'Remove Matcha Filter from Photo Online – Free Tool',
    h1: 'Remove Matcha Filter from a Photo',
  },
  '/from-video': {
    title: 'Remove Matcha Filter from Video Online – Free Tool',
    h1: 'Free Matcha Filter Remover for Video',
  },
  '/how-to-remove-matcha-filter': {
    title: 'How to Remove Matcha Filter from Photos & Videos (Free Guide)',
    h1: 'How to Remove Matcha Filter from a Photo or Video',
  },
};

const SITEMAP_PATHS = [
  ...TARGETS.map(({ path }) => path),
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms-of-service',
];

const INDEX_CONTROL_TARGETS = [
  { path: '/pricing', directives: ['noindex', 'follow'] },
  { path: '/blog', directives: ['noindex', 'follow'] },
  {
    path: '/blog/what-is-shipany',
    directives: ['noindex', 'follow'],
  },
  { path: '/sign-in', directives: ['noindex', 'nofollow'] },
  { path: '/forgot-password', directives: ['noindex', 'nofollow'] },
  { path: '/admin', directives: ['noindex', 'nofollow'] },
  { path: '/admin/users', directives: ['noindex', 'nofollow'] },
  { path: '/settings', directives: ['noindex', 'nofollow'] },
  { path: '/settings/profile', directives: ['noindex', 'nofollow'] },
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

function jsonLdNodes(html) {
  const nodes = [];
  const blocks = [
    ...html.matchAll(
      /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];
  for (const [, raw] of blocks) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.['@graph'])) nodes.push(...parsed['@graph']);
      else if (parsed && typeof parsed === 'object') nodes.push(parsed);
    } catch {
      // jsonLdTypes reports the parse failure with the existing assertion.
    }
  }
  return nodes;
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

function sitemapEntries(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)].map(([, block]) => {
    const loc = strip(block.match(/<loc>([\s\S]*?)<\/loc>/i)?.[1] ?? '');
    const alternates = Object.fromEntries(
      [...block.matchAll(/<xhtml:link\b[^>]*>/gi)].map((match) => {
        const attributes = attrs(match[0]);
        return [attributes.hreflang, attributes.href];
      })
    );
    return { loc, alternates };
  });
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
    const h2s = headings(html, 'h2');
    const anchors = internalAnchors(html);
    const ldTypes = jsonLdTypes(html);
    const ldNodes = jsonLdNodes(html);
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
    if (
      h1s[0] &&
      h2s.some((heading) => heading.toLowerCase() === h1s[0].toLowerCase())
    ) {
      fail('an H2 duplicates the H1 verbatim');
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
    const robotsPolicy = metaContent(html, 'name', 'robots');
    if (!title) fail('no <title>');
    if (!description) fail('no meta description');
    if (robotsPolicy?.toLowerCase().includes('noindex')) {
      fail(`public route emits noindex: ${robotsPolicy}`);
    }
    if (title) titles[locale].set(target.path, title);
    if (description) descriptions[locale].set(target.path, description);
    const rankingLock = locale === 'en' && RANKING_SIGNAL_LOCKS[target.path];
    if (rankingLock && title !== rankingLock.title) {
      fail(`protected title changed: expected "${rankingLock.title}"`);
    }
    if (rankingLock && h1s[0] !== rankingLock.h1) {
      fail(`protected H1 changed: expected "${rankingLock.h1}"`);
    }

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
    if (target.path === '/') {
      const organization = ldNodes.find(
        (node) =>
          node['@type'] === 'Organization' &&
          node['@id']?.endsWith('#organization')
      );
      const webPage = ldNodes.find((node) => node['@type'] === 'WebPage');
      if (!organization?.sameAs?.includes(OFFICIAL_REPOSITORY_URL)) {
        fail('Organization sameAs is missing the official GitHub repository');
      }
      if (webPage?.author?.name !== PUBLIC_AUTHOR) {
        fail(`WebPage author is ${webPage?.author?.name ?? 'missing'}`);
      }
      if (webPage?.editor?.name !== MAINTAINER) {
        fail(`WebPage editor is ${webPage?.editor?.name ?? 'missing'}`);
      }
      if (
        webPage?.datePublished !== '2026-08-08' ||
        webPage?.dateModified !== '2026-08-16'
      ) {
        fail('WebPage publication or review date is missing or stale');
      }
      for (const expectedText of [PUBLIC_AUTHOR, MAINTAINER]) {
        if (!text.includes(expectedText)) {
          fail(`visible provenance is missing ${expectedText}`);
        }
      }
      for (const sourceHref of [
        'https://www.w3.org/TR/FileAPI/',
        'https://registry.khronos.org/webgl/specs/latest/',
        'https://www.w3.org/TR/mediastream-recording/',
        OFFICIAL_REPOSITORY_URL,
      ]) {
        if (!html.includes(`href="${sourceHref}"`)) {
          fail(`visible source link is missing ${sourceHref}`);
        }
      }
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
    const tokenCount = text.split(/\s+/).filter(Boolean).length;
    console.log(`  body tokens         : ${tokenCount} (diagnostic)`);
    if (locale === 'en') {
      for (const phrase of target.phrases) {
        const count = countPhrase(text, phrase);
        const density = ((count / tokenCount) * 100).toFixed(2);
        console.log(
          `  phrase "${phrase}" : ${count}x, ${density}% (diagnostic)`
        );
      }
    }
  }
}

for (const locale of ['en', 'zh']) {
  const path = localizedPath('/about', locale);
  const response = await fetch(`${BASE}${path}`);
  const html = await response.text();
  const text = bodyText(html);
  const expectedH1 =
    locale === 'en'
      ? 'About Remove Matcha Filter'
      : '关于 Remove Matcha Filter';
  const h1s = headings(html, 'h1');
  const htmlLang = html.match(/<html[^>]+lang="([^"]+)"/i)?.[1];
  const ldTypes = jsonLdTypes(html);
  console.log(`\n=== ${path} (${locale} trust page) ===`);
  if (response.status !== 200) fail(`HTTP ${response.status}`);
  if (htmlLang !== locale) fail(`<html lang> is ${htmlLang ?? 'missing'}`);
  if (h1s.length !== 1 || h1s[0] !== expectedH1) {
    fail(`localized About H1 is "${h1s.join(' | ')}"`);
  }
  if (!ldTypes.includes('AboutPage')) fail('missing AboutPage JSON-LD');
  for (const expectedText of [PUBLIC_AUTHOR, MAINTAINER]) {
    if (!text.includes(expectedText)) {
      fail(`About page is missing ${expectedText}`);
    }
  }
}

for (const locale of ['en', 'zh']) {
  const path = localizedPath('/contact', locale);
  const response = await fetch(`${BASE}${path}`);
  const html = await response.text();
  const expectedH1 = locale === 'en' ? 'Contact' : '联系我们';
  const h1s = headings(html, 'h1');
  const htmlLang = html.match(/<html[^>]+lang="([^"]+)"/i)?.[1];
  console.log(`\n=== ${path} (${locale} localized static page) ===`);
  if (response.status !== 200) fail(`HTTP ${response.status}`);
  if (htmlLang !== locale) fail(`<html lang> is ${htmlLang ?? 'missing'}`);
  if (h1s.length !== 1 || h1s[0] !== expectedH1) {
    fail(`localized contact H1 is "${h1s.join(' | ')}"`);
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
const parsedSitemapEntries = sitemapEntries(sitemap);
const expectedSitemapEntryCount = SITEMAP_PATHS.length * 2;
if (parsedSitemapEntries.length !== expectedSitemapEntryCount) {
  fail(
    `sitemap has ${parsedSitemapEntries.length} entries; expected ${expectedSitemapEntryCount}`
  );
}
for (const path of SITEMAP_PATHS) {
  const englishPath = path === '/' ? '/' : path;
  const chinesePath = path === '/' ? '/zh' : `/zh${path}`;
  const expectedAlternates = {
    en: `${canonicalOrigin}${englishPath}`,
    zh: `${canonicalOrigin}${chinesePath}`,
    'x-default': `${canonicalOrigin}${englishPath}`,
  };

  for (const locale of ['en', 'zh']) {
    const expectedLoc = expectedAlternates[locale];
    const entry = parsedSitemapEntries.find(({ loc }) => loc === expectedLoc);
    if (!entry) {
      fail(`sitemap missing ${locale} entry for ${path}`);
      continue;
    }
    for (const [hreflang, expectedHref] of Object.entries(expectedAlternates)) {
      if (entry.alternates[hreflang] !== expectedHref) {
        fail(
          `sitemap ${locale} ${path} has wrong ${hreflang} alternate: ${entry.alternates[hreflang] ?? 'missing'}`
        );
      }
    }
  }
}

for (const target of INDEX_CONTROL_TARGETS) {
  const response = await fetch(`${BASE}${target.path}`);
  const html = await response.text();
  const robotsPolicy = metaContent(html, 'name', 'robots')?.toLowerCase();
  console.log(`\n=== ${target.path} (index control) ===`);
  if (response.status !== 200) fail(`HTTP ${response.status}`);
  if (!robotsPolicy) {
    fail('missing robots meta');
    continue;
  }
  for (const directive of target.directives) {
    if (!robotsPolicy.split(/\s*,\s*/).includes(directive)) {
      fail(`robots meta missing ${directive}: ${robotsPolicy}`);
    }
  }
  console.log(`  robots              : ${robotsPolicy}`);
}

const robotsResponse = await fetch(`${BASE}/robots.txt`);
const robots = await robotsResponse.text();
if (robotsResponse.status !== 200) fail(`robots HTTP ${robotsResponse.status}`);
if (!robots.includes('Disallow: /api/')) {
  fail('robots missing Disallow: /api/');
}
if (!robots.includes('Disallow: /zh/api/')) {
  fail('robots missing Disallow: /zh/api/');
}
for (const rule of ['Disallow: /admin', 'Disallow: /settings']) {
  if (robots.includes(rule)) {
    fail(`robots prevents crawlers from observing route noindex: ${rule}`);
  }
}
if (robots.includes('Disallow: /*?*'))
  fail('robots still blocks every query string');
if (!robots.includes('Sitemap:')) fail('robots missing sitemap directive');

for (const path of [
  '/zh/api/config/public',
  '/zh/ads.txt',
  '/zh/llms.txt',
  '/zh/llms-full.txt',
  '/zh/robots.txt',
  '/zh/sitemap.xml',
]) {
  const response = await fetch(`${BASE}${path}`, { redirect: 'manual' });
  const expectedLocation = path.replace(/^\/zh/, '');
  console.log(`\n=== ${path} (locale-free operational route) ===`);
  if (response.status !== 308)
    fail(`expected HTTP 308, received ${response.status}`);
  const location = response.headers.get('location');
  if (!location || new URL(location, ORIGIN).pathname !== expectedLocation) {
    fail(`redirect location is ${location ?? 'missing'}`);
  }
}

for (const [path, expectedPath] of [
  ['/From-Photo?utm_source=seo-qa', '/from-photo'],
  [
    '/ZH/How-To-Remove-Matcha-Filter?utm_source=seo-qa',
    '/zh/how-to-remove-matcha-filter',
  ],
]) {
  const response = await fetch(`${BASE}${path}`, { redirect: 'manual' });
  const location = response.headers.get('location');
  const redirectUrl = location ? new URL(location, ORIGIN) : null;
  console.log(`\n=== ${path} (canonical path casing) ===`);
  if (response.status !== 308)
    fail(`expected HTTP 308, received ${response.status}`);
  if (redirectUrl?.pathname !== expectedPath) {
    fail(`redirect pathname is ${redirectUrl?.pathname ?? 'missing'}`);
  }
  if (redirectUrl?.searchParams.get('utm_source') !== 'seo-qa') {
    fail('redirect did not preserve the query string');
  }
}

console.log(
  failures
    ? `\n${failures} SEO check(s) failed.`
    : '\nAll bilingual SEO checks passed. Counts above are diagnostics, not ranking guarantees.'
);
process.exit(failures ? 1 : 0);
