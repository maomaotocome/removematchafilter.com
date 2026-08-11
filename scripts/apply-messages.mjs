// One-shot helper: merge a patch of flat dot-keyed messages into
// messages/<locale>.json, preserving existing keys and sorting nothing.
// Usage: node scripts/apply-messages.mjs <locale> <patch.json>
import { readFileSync, writeFileSync } from 'node:fs';

const [locale, patchPath] = process.argv.slice(2);
if (!locale || !patchPath) {
  console.error('usage: node scripts/apply-messages.mjs <locale> <patch.json>');
  process.exit(1);
}

const target = `messages/${locale}.json`;
const current = JSON.parse(readFileSync(target, 'utf8'));
const patch = JSON.parse(readFileSync(patchPath, 'utf8'));
const merged = { ...current, ...patch };
writeFileSync(target, `${JSON.stringify(merged, null, 2)}\n`);
console.log(
  `${target}: ${Object.keys(patch).length} keys applied, ${Object.keys(merged).length} total`
);
