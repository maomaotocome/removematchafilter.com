// On-page SEO audit against the live server:  pnpm qa:seo [baseUrl]
//
//   pnpm build && pnpm start &
//   pnpm qa:seo
//
// What this asserts vs. what it only reports — the distinction matters, because
// the launch brief (§5 L132) forbids targeting a fixed word count or keyword
// density, and forbids promising rich results (L133).
//
// ASSERTED (a mismatch is a real defect):
//   - H1 is exactly the string the brief specifies for that route. Not a
//     substring match: the brief's H1s contain articles ("from a Photo") that a
//     naive "does the H1 contain the query" check would fail, and deleting
//     those articles to satisfy such a check would be writing copy for the
//     linter instead of the reader.
//   - canonical, title, description, OG tags, and parseable JSON-LD exist.
//   - Real <a> internal links exist (a stylesheet <link rel> is not a link).
//
// REPORTED ONLY (diagnostics — no pass/fail threshold):
//   - body word count. There is no "too thin" line to cross.
//   - exact target-phrase occurrences. Presence is worth seeing; a required
//     count would be density targeting.
const BASE = process.argv[2] || 'http://localhost:3000';

// H1s are quoted verbatim from docs/launch-brief.md §5. If the brief changes,
// change these to match — never the reverse.
const TARGETS = [
  {
    path: '/',
    phrase: 'remove matcha filter',
    h1: 'Remove the Matcha Filter from Photos and Videos',
  },
  {
    path: '/from-photo',
    phrase: 'remove matcha filter from photo',
    h1: 'Remove the Matcha Filter from a Photo',
  },
  {
    path: '/from-video',
    phrase: 'remove matcha filter from video',
    h1: 'Remove the Matcha Filter from a Video',
  },
];

// Wording from §3 L59-64. Split by whether the phrase can be written as natural
// English on the page.
//
// `matcha filter remover` and `matcha remover` read normally in a sentence, so
// the homepage carries them and their presence is asserted.
//
// `filter remover matcha` and `remover matcha filter` are search word-orders,
// not English. Forcing them into body copy verbatim would mean writing for a
// string matcher instead of a reader, so they are reported as diagnostics only.
// The homepage covers that intent through the natural phrasings above; §3 L66
// forbids giving these variants their own URLs.
const ASSERTED_VARIANTS = ['matcha filter remover', 'matcha remover'];
const DIAGNOSTIC_VARIANTS = ['filter remover matcha', 'remover matcha filter'];

const strip = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Text a crawler reads: <body> minus script/style/noscript. */
function bodyText(html) {
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
  return strip(
    body
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
  ).replace(/&[a-z]+;|&#x?[0-9a-f]+;/gi, ' ');
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

const metaContent = (html, attr, value) =>
  html.match(
    new RegExp(`<meta[^>]+${attr}="${value}"[^>]*content="([^"]*)"`, 'i')
  )?.[1] ??
  html.match(
    new RegExp(`<meta[^>]+content="([^"]*)"[^>]*${attr}="${value}"`, 'i')
  )?.[1] ??
  null;

/**
 * Flatten JSON-LD to node @types. Handles the `@graph` container the routes
 * actually emit — reading only the root object's `@type` reports every page as
 * having no schema, because the root of a @graph document has no @type.
 */
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

/** Real anchors only. `<link rel="stylesheet" href="/x.css">` is not a link. */
function internalAnchors(html) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
    .map(([, attrs, inner]) => ({
      href: attrs.match(/\bhref="([^"]*)"/i)?.[1] ?? '',
      text: strip(inner),
    }))
    .filter((a) => /^\/(?!\/)/.test(a.href));
}

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.log(`  FAIL  ${message}`);
};

for (const { path, phrase, h1 } of TARGETS) {
  const response = await fetch(`${BASE}${path}`);
  const html = await response.text();
  const text = bodyText(html);
  const h1s = headings(html, 'h1');
  const h2s = headings(html, 'h2');
  const anchors = internalAnchors(html);
  const ldTypes = jsonLdTypes(html);
  const canonical = html.match(
    /<link[^>]+rel="canonical"[^>]*href="([^"]*)"/i
  )?.[1];

  console.log(`\n=== ${path} (target: "${phrase}") ===`);
  console.log(`  http status         : ${response.status}`);

  // --- Asserted -----------------------------------------------------------
  if (h1s.length !== 1) fail(`expected exactly 1 H1, found ${h1s.length}`);
  if (h1s[0] !== h1) {
    fail(
      `H1 does not match the brief.\n        brief: ${h1}\n        page : ${h1s[0] ?? '(none)'}`
    );
  } else {
    console.log(`  H1 matches brief    : yes — "${h1s[0]}"`);
  }

  if (!canonical) fail('no canonical link');
  else console.log(`  canonical           : ${canonical}`);

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (!title) fail('no <title>');
  else console.log(`  title               : ${strip(title)}`);

  const description = metaContent(html, 'name', 'description');
  if (!description) fail('no meta description');
  else console.log(`  description         : ${description.slice(0, 70)}…`);

  if (!ldTypes.length) fail('no JSON-LD');
  else if (ldTypes.includes('UNPARSEABLE')) fail('JSON-LD does not parse');
  else console.log(`  JSON-LD types       : ${ldTypes.join(', ')}`);

  const ogMissing = ['og:title', 'og:description', 'og:url', 'og:image'].filter(
    (property) => !metaContent(html, 'property', property)
  );
  if (ogMissing.length) fail(`missing OG tags: ${ogMissing.join(', ')}`);
  else console.log('  og:title/desc/url/image: 4/4');

  if (!anchors.length) fail('no internal <a> links');
  else console.log(`  internal <a> links  : ${anchors.length}`);

  // The three tool pages must link to each other (§5 L131).
  const peers = TARGETS.map((t) => t.path).filter((p) => p !== path);
  const missingPeers = peers.filter(
    (peer) => !anchors.some((a) => a.href === peer || a.href === `${peer}/`)
  );
  if (missingPeers.length)
    fail(`no link to peer page(s): ${missingPeers.join(', ')}`);
  else console.log(`  links to peer pages : ${peers.join(', ')}`);

  if (path === '/') {
    const missing = ASSERTED_VARIANTS.filter((v) => countPhrase(text, v) === 0);
    if (missing.length) {
      fail(`homepage does not cover (§3): ${missing.join(', ')}`);
    } else {
      console.log(
        `  §3 natural wording  : ${ASSERTED_VARIANTS.map((v) => `"${v}" ${countPhrase(text, v)}x`).join(', ')}`
      );
    }
    console.log(
      `  §3 search word-order: ${DIAGNOSTIC_VARIANTS.map((v) => `"${v}" ${countPhrase(text, v)}x`).join(', ')} (diagnostic — not natural English, not asserted)`
    );
  }

  // --- Reported only ------------------------------------------------------
  console.log(
    `  body words          : ${text.split(/\s+/).filter(Boolean).length} (informational — brief §5 forbids a word-count target)`
  );
  console.log(
    `  target phrase       : ${countPhrase(text, phrase)}x (informational — no density target)`
  );
  console.log(
    `  H2 count            : ${h2s.length} (${h2s.filter((h) => /matcha/i.test(h)).length} mention matcha)`
  );
  console.log(`  H3 count            : ${headings(html, 'h3').length}`);
  console.log(
    `  anchor samples      : ${anchors
      .slice(0, 4)
      .map((a) => `${a.href} :: ${a.text.slice(0, 32)}`)
      .join(' / ')}`
  );
}

console.log(
  failures
    ? `\n${failures} SEO check(s) failed.`
    : '\nAll asserted SEO checks passed. Word counts and phrase counts above are diagnostics, not gates.'
);
process.exit(failures ? 1 : 0);
