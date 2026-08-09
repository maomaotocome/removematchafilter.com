// Pre-deploy gate for the launch-brief blockers that a build cannot catch.
// Run before /deploy-cloudflare:  pnpm check:launch
//
// This checks configuration and repository state only. Behavioural claims —
// audio preservation, container correctness, no-upload — are proven by
// `pnpm qa:tool`, which measures real exported media. A string check here is
// never a substitute for that.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const blockers = [];
const warnings = [];
const passes = [];

const env = existsSync('.env.production')
  ? readFileSync('.env.production', 'utf8')
  : '';
const envValue = (key) =>
  (env.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1] ?? '').trim();

// --- Single source of truth for the brief ---------------------------------
if (existsSync('launch-brief.md')) {
  blockers.push(
    'A second launch-brief.md exists in the repository root. Only ' +
      'docs/launch-brief.md may exist — delete the root copy.'
  );
} else {
  passes.push('no duplicate launch-brief.md in the repository root');
}

if (!existsSync('docs/launch-brief.md')) {
  blockers.push(
    'docs/launch-brief.md is missing — it is the only spec source.'
  );
} else {
  passes.push('docs/launch-brief.md present');
}

// --- Contact channel (§7 L160) -------------------------------------------
const contact =
  envValue('VITE_CONTACT_EMAIL') || process.env.VITE_CONTACT_EMAIL || '';
if (!contact) {
  blockers.push(
    'VITE_CONTACT_EMAIL is not set. The trust pages show a "not configured" ' +
      'notice. Set a real, monitored inbox in .env.production.'
  );
} else if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(contact)) {
  blockers.push(`VITE_CONTACT_EMAIL is not a valid address: "${contact}".`);
} else {
  passes.push(`VITE_CONTACT_EMAIL configured (${contact})`);
  warnings.push(
    `Deliverability of ${contact} is NOT verified by this script. Send a real ` +
      'test message and confirm receipt before deploying — a configured ' +
      'string is not a working inbox.'
  );
}

// --- Production origin (§5 L129, §10 L210) -------------------------------
const appUrl = envValue('VITE_APP_URL');
if (!appUrl) {
  blockers.push('VITE_APP_URL is not set in .env.production.');
} else if (/localhost|127\.0\.0\.1|workers\.dev/.test(appUrl)) {
  blockers.push(
    `VITE_APP_URL is "${appUrl}". Canonical/OG/sitemap would ship a ` +
      'localhost or workers.dev origin. Set the production domain.'
  );
} else {
  passes.push(`VITE_APP_URL is a production origin (${appUrl})`);
}

// --- Auth secret ----------------------------------------------------------
// Not an SEO item. AUTH_SECRET is required for better-auth to serve real
// production traffic (sign-in, sessions, the whole authenticated surface), so
// this stays a pre-deploy blocker.
//
// It is deliberately NOT expected in .env.production: per AGENTS.md, server-side
// secrets belong in the runtime environment, not a committed or local env file.
// /deploy-cloudflare provisions it as a Workers secret. This check therefore
// reports "unavailable in the current environment" rather than "missing from a
// file" — it stays a BLOCKER until deploy provisions it, which is expected.
//
// The value is never generated, written, or printed here — only its presence
// and shape are examined.
const authSecret = envValue('AUTH_SECRET') || process.env.AUTH_SECRET || '';
const PROVISION_HINT =
  'AUTH_SECRET is unavailable in the current production environment. ' +
  'Provision it as a Cloudflare secret through /deploy-cloudflare before ' +
  'serving production traffic.';
if (!authSecret) {
  blockers.push(PROVISION_HINT);
} else if (/change|placeholder|your-|secret-here|example/i.test(authSecret)) {
  blockers.push(
    `AUTH_SECRET resolves to a placeholder value. ${PROVISION_HINT}`
  );
} else if (authSecret.length < 32) {
  blockers.push(
    `AUTH_SECRET resolves to only ${authSecret.length} characters; at least 32 ` +
      `are required. ${PROVISION_HINT}`
  );
} else {
  passes.push(
    'AUTH_SECRET is available in this environment and is not a placeholder'
  );
}

// Canonicals are built from locale-free paths; a trailing slash in any of them
// would emit a canonical pointing at the router's 307 redirect.
const canonicalPaths = [
  '/from-photo',
  '/from-video',
  '/matcha-filter-trend',
  '/how-to-remove-matcha-filter',
  '/contact',
  '/privacy-policy',
  '/terms-of-service',
];
const sitemapSource = existsSync('src/routes/sitemap[.]xml.ts')
  ? readFileSync('src/routes/sitemap[.]xml.ts', 'utf8')
  : '';
const trailing = canonicalPaths.filter((p) =>
  sitemapSource.includes(`'${p}/'`)
);
if (trailing.length) {
  blockers.push(
    `Sitemap paths carry trailing slashes the router redirects away: ${trailing.join(', ')}.`
  );
} else if (sitemapSource) {
  passes.push('sitemap paths use non-redirecting, trailing-slash-free URLs');
}
if (appUrl?.endsWith('/') && appUrl !== `${new URL(appUrl).origin}/`) {
  blockers.push(`VITE_APP_URL has a trailing path slash: "${appUrl}".`);
}

// --- i18n key parity (AGENTS.md) -----------------------------------------
try {
  const en = JSON.parse(readFileSync('messages/en.json', 'utf8'));
  const zh = JSON.parse(readFileSync('messages/zh.json', 'utf8'));
  const missing = Object.keys(en).filter((k) => !(k in zh));
  const extra = Object.keys(zh).filter((k) => !(k in en));
  if (missing.length || extra.length) {
    blockers.push(
      `Message key parity broken: ${missing.length} key(s) missing from zh, ` +
        `${extra.length} extra. First missing: ${missing.slice(0, 3).join(', ') || 'none'}`
    );
  } else {
    passes.push(`en/zh key parity holds (${Object.keys(en).length} keys each)`);
  }
  // Copied English is worse than a missing key — it ships as fake translation.
  const copied = Object.keys(en).filter(
    (k) => en[k] === zh[k] && en[k].length > 25 && /[a-z]{4}/i.test(en[k])
  );
  if (copied.length) {
    warnings.push(
      `${copied.length} zh value(s) are identical to English — verify they are ` +
        `intentional (e.g. brand names): ${copied.slice(0, 3).join(', ')}`
    );
  }
} catch (error) {
  blockers.push(`Could not compare message files: ${error.message}`);
}

// --- Git origin (§9 L189, §10 L211) --------------------------------------
try {
  const origin = execFileSync('git', ['remote', 'get-url', 'origin'], {
    encoding: 'utf8',
  }).trim();
  if (/shipany-ai\/shipany-tanstack/.test(origin)) {
    blockers.push(
      `Git origin still points at the ShipAny template (${origin}). ` +
        "Point it at the project's own repository before pushing."
    );
  } else {
    passes.push(`git origin points at the project repository (${origin})`);
  }
} catch {
  blockers.push('Could not read git origin.');
}

// --- Owned examples exist (§7 L155) --------------------------------------
const examplesDir = 'public/imgs/examples';
const examples = existsSync(examplesDir) ? readdirSync(examplesDir) : [];
// Read the filenames the examples block actually renders rather than hardcoding
// them: a hardcoded list silently keeps passing against orphaned files after the
// examples are regenerated under new names, which is the opposite of a gate.
const examplesBlock = existsSync('src/blocks/matcha/examples.tsx')
  ? readFileSync('src/blocks/matcha/examples.tsx', 'utf8')
  : '';
const referenced = [
  ...examplesBlock.matchAll(/\/imgs\/examples\/([\w.-]+)/g),
].map((m) => m[1]);
const missingExamples = referenced.filter((f) => !examples.includes(f));
if (referenced.length === 0) {
  blockers.push(
    'No before/after examples are referenced by src/blocks/matcha/examples.tsx.'
  );
} else if (missingExamples.length) {
  blockers.push(
    `Missing before/after examples: ${missingExamples.join(', ')}. ` +
      'Regenerate with `pnpm qa:demo` against a running server.'
  );
} else {
  passes.push(
    `owned before/after examples present (${referenced.length} referenced)`
  );
}

// --- Forbidden capability claims (§1 L29) --------------------------------
const FORBIDDEN = [
  /100\s*%\s*restore/i,
  /recover the original/i,
  /reveal hidden/i,
  /remove any filter perfectly/i,
];
const textFiles = [
  'messages/en.json',
  'messages/zh.json',
  ...readdirSync('src/content/pages').map((f) => `src/content/pages/${f}`),
];
let claimFound = false;
for (const file of textFiles) {
  const body = readFileSync(file, 'utf8');
  for (const pattern of FORBIDDEN) {
    if (!pattern.test(body)) continue;
    const line = body
      .split('\n')
      .find((l) => pattern.test(l))
      ?.trim();
    // A denial ("cannot recover the original") is required copy, not a claim.
    if (line && /\b(cannot|can't|not|never|no)\b/i.test(line)) continue;
    claimFound = true;
    blockers.push(`${file}: forbidden capability claim — ${line ?? pattern}`);
  }
}
if (!claimFound) passes.push('no forbidden capability claims in user copy');

// --- Report ---------------------------------------------------------------
const inlang = JSON.parse(readFileSync('project.inlang/settings.json', 'utf8'));
console.log(`note    published locales: ${inlang.locales.join(', ')}`);
console.log(
  'note    audio/container/no-upload claims are verified by `pnpm qa:tool`, not here'
);
for (const p of passes) console.log(`ok      ${p}`);
for (const w of warnings) console.log(`WARN    ${w}`);
for (const b of blockers) console.log(`BLOCKER ${b}`);

console.log(
  blockers.length
    ? `\n${blockers.length} launch blocker(s) — do not deploy.`
    : '\nNo automated launch blockers. Manual items remain: see the QA matrix.'
);
process.exit(blockers.length ? 1 : 0);
