import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { validateManifestText } from './validate-manifest.mjs';

const schema = JSON.parse(
  await readFile(new URL('./manifest.schema.json', import.meta.url), 'utf8')
);
const exampleText = await readFile(
  new URL('./manifest.example.jsonl', import.meta.url),
  'utf8'
);

const options = {
  schema,
  repoRoot: '/synthetic/repository',
  today: '2026-08-16',
};

function firstExample() {
  return structuredClone(JSON.parse(exampleText.trim().split(/\r?\n/)[0]));
}

function distinctCopy(entry, token = '2') {
  const copy = structuredClone(entry);
  copy.pair_id = `synthetic-photo-00${token}`;
  copy.capture_group_id = `synthetic-group-photo-00${token}`;
  copy.original_path = `private-data/matcha-benchmark/v1/synthetic-placeholder/photo-00${token}-original.png`;
  copy.filtered_path = `private-data/matcha-benchmark/v1/synthetic-placeholder/photo-00${token}-filtered.png`;
  copy.original_sha256 = 'e'.repeat(64);
  copy.filtered_sha256 = 'f'.repeat(64);
  copy.rights_id = `rights-synthetic-placeholder-${token}`;
  return copy;
}

function validateEntries(entries) {
  return validateManifestText(
    `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`,
    options
  );
}

test('accepts the committed synthetic example only as non-eligible smoke data', () => {
  const result = validateManifestText(exampleText, options);
  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.equal(result.stats.total, 2);
  assert.equal(result.stats.benchmarkEligible, 0);
  assert.equal(result.stats.photo, 1);
  assert.equal(result.stats.video, 1);
  assert.equal(result.holdoutCount, 0);
  assert.match(result.holdoutSha256, /^[a-f0-9]{64}$/);
});

test('hashes accepted non-synthetic holdout records deterministically', () => {
  const entry = firstExample();
  entry.source_kind = 'controlled_consent';
  entry.capture_device_family = 'android_phone_family';
  entry.split = 'holdout';
  entry.allowed_uses = [
    'benchmark_evaluation',
    'blind_human_review',
    'internal_aggregate_reporting',
  ];
  const first = validateEntries([entry]);
  const second = validateEntries([entry]);
  assert.equal(first.valid, true, first.errors.join('\n'));
  assert.equal(first.stats.benchmarkEligible, 1);
  assert.equal(first.holdoutCount, 1);
  assert.equal(first.holdoutSha256, second.holdoutSha256);
});

test('rejects relative path traversal outside private-data', () => {
  const entry = firstExample();
  entry.original_path =
    'private-data/matcha-benchmark/v1/../../../public/leak.png';
  const result = validateEntries([entry]);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('path traversal')));
});

test('rejects absolute paths and URLs', () => {
  const absolute = firstExample();
  absolute.filtered_path = '/tmp/filtered.png';
  const url = distinctCopy(firstExample());
  url.filtered_path = 'https://example.com/private.png';
  const result = validateEntries([absolute, url]);
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((error) =>
      error.includes('absolute paths and URLs are prohibited')
    )
  );
});

test('rejects a SHA-256 reused by another media item', () => {
  const first = firstExample();
  const second = distinctCopy(first);
  second.original_sha256 = first.original_sha256;
  const result = validateEntries([first, second]);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('duplicate SHA-256')));
});

test('rejects capture groups assigned to more than one split', () => {
  const first = firstExample();
  const second = distinctCopy(first);
  second.capture_group_id = first.capture_group_id;
  second.split = 'holdout';
  const result = validateEntries([first, second]);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('leaks across')));
});

test('rejects missing rights reference and allowed-use grant', () => {
  const entry = firstExample();
  entry.source_kind = 'controlled_consent';
  entry.capture_device_family = 'iphone_family';
  delete entry.rights_id;
  delete entry.allowed_uses;
  const result = validateEntries([entry]);
  assert.equal(result.valid, false);
  assert.equal(result.stats.benchmarkEligible, 0);
  assert.equal(result.holdoutSha256, null);
  assert.ok(result.errors.some((error) => error.includes('rights_id')));
  assert.ok(result.errors.some((error) => error.includes('allowed_uses')));
});

test('rejects forbidden personal fields even when schema rejects them too', () => {
  const entry = firstExample();
  entry.person_name = 'Synthetic Person';
  const result = validateEntries([entry]);
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((error) =>
      error.includes('personal or sensitive fields are prohibited')
    )
  );
});

test('rejects a declaration that EXIF remains present', () => {
  const entry = firstExample();
  entry.metadata_sanitization.exif_status = 'present';
  const result = validateEntries([entry]);
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((error) =>
      error.includes('metadata_sanitization.exif_status')
    )
  );
});

test('rejects sexual, suggestive, or intimate benchmark content', () => {
  const entry = firstExample();
  entry.contains_sexual_or_intimate_content = true;
  const result = validateEntries([entry]);
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((error) =>
      error.includes('contains_sexual_or_intimate_content')
    )
  );
});

test('keeps rejected governance records out of benchmark-eligible counts', () => {
  const entry = firstExample();
  entry.record_status = 'rejected';
  entry.split = 'validation';
  entry.normalization_status = 'failed';
  entry.alignment_status = 'failed';
  entry.rejection_reason = 'alignment_failed';
  const result = validateEntries([entry]);
  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.equal(result.stats.accepted, 0);
  assert.equal(result.stats.rejected, 1);
  assert.equal(result.stats.benchmarkEligible, 0);
  assert.equal(result.holdoutCount, 0);
});

test('rejects and excludes a rejected record placed in holdout', () => {
  const entry = firstExample();
  entry.record_status = 'rejected';
  entry.split = 'holdout';
  entry.normalization_status = 'failed';
  entry.alignment_status = 'failed';
  entry.rejection_reason = 'alignment_failed';
  const result = validateEntries([entry]);
  assert.equal(result.valid, false);
  assert.equal(result.stats.benchmarkEligible, 0);
  assert.equal(result.holdoutCount, 0);
  assert.ok(
    result.errors.some((error) =>
      error.includes('holdout entries must be accepted')
    )
  );
});

test('rejects synthetic fixtures placed in holdout', () => {
  const entry = firstExample();
  entry.split = 'holdout';
  const result = validateEntries([entry]);
  assert.equal(result.valid, false);
  assert.equal(result.stats.benchmarkEligible, 0);
  assert.equal(result.holdoutCount, 0);
  assert.ok(
    result.errors.some((error) =>
      error.includes('synthetic fixtures are prohibited from holdout')
    )
  );
});

test('uses the injected date when checking expired rights', () => {
  const entry = firstExample();
  entry.rights_expires_on = '2026-08-15';
  const result = validateEntries([entry]);
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((error) => error.includes('rights have expired'))
  );
});

test('requires complete video timing, codec, and audio metadata', () => {
  const video = JSON.parse(exampleText.trim().split(/\r?\n/)[1]);
  delete video.filtered_metadata.codec;
  video.metadata_sanitization.audio_status = 'rights_cleared';
  video.original_metadata.has_audio = true;
  const result = validateEntries([video]);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('codec')));
});
