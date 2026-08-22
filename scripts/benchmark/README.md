# Matcha benchmark dataset governance

This directory contains the public contract and validator for a future private,
rights-cleared paired-media benchmark. It contains **no real benchmark media,
consent record, private filename, review export, or measured benchmark result**.

The goal is to make unsafe or unreproducible collection fail before any media is
used to tune the product. Synthetic fixtures may exercise infrastructure, but
they are never benchmark-eligible, can never enter holdout, and cannot replace
real pairs made with the real Matcha effect.

## Repository and private storage boundary

Tracked governance files:

- `manifest.schema.json` — JSON Schema for one JSONL record.
- `manifest.example.jsonl` — synthetic placeholders only; referenced files do
  not exist and must not be treated as evidence.
- `validate-manifest.mjs` — schema, privacy, path, rights, split, and duplicate
  checks plus deterministic hashes.
- `test-validate-manifest.mjs` — dependency-free Node tests.

All real inputs and identifying rights material stay outside Git under this
gitignored layout (or an equivalent approved encrypted private store):

```text
private-data/matcha-benchmark/v1/
├── media/
│   ├── raw/                 # immutable source captures/exports
│   └── normalized/          # sanitized derivatives used for evaluation
├── rights/                  # consent and licence records, separate from media
├── manifests/               # private JSONL manifests
└── reviews/                 # private assignments and raw human judgments

benchmark-results/raw/       # per-item outputs, private filenames, diagnostics
```

Never place real media in `public/`, `src/`, tracked fixtures, documentation,
issues, pull requests, screenshots, or chat transcripts. Never commit raw
per-item results or raw reviewer assignments. Only privacy-reviewed aggregate
reports without filenames or thumbnails may be tracked.

`.gitignore` is a last guard, not access control. Before each commit, verify the
staged file list and run the project security scan.

## Who may access the dataset

Access is role-based, named, and least-privilege:

- The product owner and appointed dataset custodian may access rights records.
- An appointed ingestion reviewer may access raw media only while ingesting,
  sanitizing, or deleting a pair.
- Benchmark operators may access normalized calibration/validation media when
  required, but do not receive identity-bearing consent documents.
- A separate holdout steward controls holdout inputs and outputs. Candidate
  developers must not browse holdout media or outputs while tuning.
- No contractor, automated vendor, cloud model, or analytics service receives
  media without a separately approved purpose, agreement, and explicit consent.

Use encrypted storage, encrypted transport, device access control, audit logs,
and the shortest practical retention period. Do not copy the directory into a
consumer sync folder or shared drive by default.

## Allowed sources

Use this order:

1. Controlled media created by consenting adults for this benchmark.
2. Product-owner media with explicit benchmark and product-improvement rights.
3. Licensed media whose licence expressly permits transformation, evaluation,
   derived outputs, and the intended internal use.
4. Volunteered pairs with explicit consent and a working deletion process.

Every pair must use the same scene/content on both sides. Capture or export the
neutral original first, then apply the real Matcha effect without an intervening
crop or edit when possible. Record the observed effect name, application
version, date, device family, and bounded export method. If the real effect is
not reproducibly available, stop; a synthetic green grade is not a substitute.

Prohibited sources and content:

- minors;
- sexual, suggestive, intimate, exploitative, or non-consensual content;
- celebrities or scraped personal/social accounts;
- public posts treated as if visibility granted transformation rights;
- stock or campaigns without explicit transformation/evaluation rights;
- audio conversations without rights from all required participants;
- media carrying account handles, watermarks, profile links, GPS, or other
  unnecessary identifiers into evaluation.

Do not label or infer race, ethnicity, health, identity, or other sensitive
traits. Coverage may be reviewed without storing those labels.

## Rights records and anonymous manifest IDs

Real consent/licence documents live in `rights/`, not beside media and never in
the committed schema/example. A manifest stores only an anonymous `rights_id`
and bounded `allowed_uses` values.

A private rights record must establish, at minimum:

- the rights holder and verifier, stored only in the restricted rights system;
- adult status and confirmation that no minor is present;
- confirmation that no sexual, suggestive, or intimate content is present;
- source/provenance and authority to grant the rights;
- permitted benchmark, calibration, product-improvement, human-review, and
  aggregate-reporting uses;
- permission for transformations and derived evaluation outputs;
- audio permissions where audio is retained;
- consent date, expiry/deletion date if any, revocation method, and reviewer;
- retention/deletion obligations and any licence-specific restrictions.

The validator proves only that a syntactically valid `rights_id` and required
allowed-use declarations exist. A human rights audit must confirm the referenced
record is authentic, current, applicable to every participant, and consistent
with the manifest.

## Ingestion procedure

1. Verify provenance, adult status, content boundary, consent/licence, and the
   real effect before copying media into private storage.
2. Assign anonymous `pair_id`, `capture_group_id`, and `rights_id` values. Do
   not encode names, handles, dates of birth, account IDs, or device serials.
3. Keep ingested raw media immutable. Generate normalized derivatives rather
   than editing raw files.
4. Strip EXIF, GPS, device serials, account identifiers, unnecessary audio
   metadata, and unnecessary audio. Correct orientation consistently.
5. Independently inspect the normalized files; a manifest declaration is not
   proof that metadata was actually removed.
6. Hash every stored media object with SHA-256. Reject duplicate hashes and
   investigate perceptual duplicates separately.
7. Record dimensions and MIME type. For video also record FPS, duration, codec,
   and retained-audio state.
8. Align the pair when crop, scale, rotation, or timing changed. Use a bounded
   rejection reason when the pair cannot be evaluated.
9. Assign the entire `capture_group_id` to one split. Never split the same
   person or scene across calibration, validation, and holdout.
10. Run the validator and complete the required second-review sample before the
    pair is eligible for a benchmark.

Accepted records require completed normalization, resolved alignment, current
rights, safe metadata declarations, and no rejection reason. Rejected records
may remain in the private manifest as governance audit evidence, but the
validator excludes them from benchmark-eligible and holdout counts. Benchmark
runners must consume accepted, non-synthetic records only.

## Manifest validation

Validate the synthetic example:

```sh
node scripts/benchmark/validate-manifest.mjs \
  scripts/benchmark/manifest.example.jsonl
```

Validate a private manifest from the repository root:

```sh
node scripts/benchmark/validate-manifest.mjs \
  --manifest private-data/matcha-benchmark/v1/manifests/pilot.jsonl
```

Run the tests:

```sh
node --test scripts/benchmark/test-validate-manifest.mjs
```

Paths in JSONL are repository-relative POSIX paths and must resolve beneath
`private-data/matcha-benchmark/v1/`. The validator rejects absolute paths,
URLs, backslashes, dot segments, traversal, duplicate paths, duplicate hashes,
duplicate pair IDs, cross-split capture groups, missing rights declarations,
unsafe metadata declarations, incomplete media metadata, minors, sexual or
intimate content, and invalid acceptance/rejection state.

Output includes:

- a SHA-256 of the exact manifest text;
- an accepted, non-synthetic benchmark-eligible count;
- a deterministic holdout SHA-256 over accepted, non-synthetic holdout records,
  canonicalized and sorted by `pair_id`;
- separate accepted/rejected, media-type, and split counts.

An empty holdout produces the standard SHA-256 of an empty byte sequence and a
count of zero. It is **not** a locked holdout. Record a holdout hash only after
the manifest is valid, every holdout record has passed human governance review,
and access has been restricted.

## Deletion by `pair_id` or `rights_id`

The dataset custodian performs deletion, with a second person verifying:

1. Suspend the affected pair(s) from benchmark and review runs immediately.
2. Resolve every manifest entry by `pair_id`, or every pair referencing the
   requested `rights_id`; do not assume one rights record maps to one pair.
3. Delete raw media, normalized derivatives, previews, caches, per-item raw
   benchmark outputs, raw review assignments, and authorized backup copies.
4. Delete or restrict the consent/licence record according to the request and
   legal retention duty. If a minimal revocation tombstone must remain, keep it
   separately, access-restricted, and free of media or unnecessary identity.
5. Remove the private manifest entries, version the dataset, re-run validation,
   and regenerate aggregate reports and hashes.
6. If a holdout item is removed, invalidate that holdout version. Do not silently
   replace it; create and govern a new dataset/holdout version before comparison.
7. Record completion time, scope, backup status, verifier, and any exception in
   the restricted incident/deletion log. Do not put private details in Git.

## Incident handling

If private media, rights material, raw results, or identifiers appear in Git,
logs, analytics, a public bucket, or an unauthorized service:

1. Stop collection, benchmark execution, and further sharing.
2. Restrict access and notify the product owner/dataset custodian.
3. Preserve a private incident timeline without copying the exposed material
   into more systems.
4. Remove access and public copies; treat Git history cleanup, credential
   rotation, participant notice, and legal/privacy review as incident actions
   requiring owner approval.
5. Identify every affected `pair_id`/`rights_id`, complete required deletion,
   and invalidate derived reports or holdout versions.
6. Document root cause and preventive controls in a privacy-safe aggregate note.

Do not assume deleting the current working-tree file removes it from Git history
or remote caches.

## What automation cannot prove

The schema and validator cannot automatically prove:

- that consent is genuine, informed, unrevoked, or signed by every participant;
- that a licence actually grants transformation and product-improvement rights;
- that a face belongs to an adult or that prohibited content is absent;
- that normalized files truly contain no EXIF/GPS/identifiers;
- that a device-family value does not conceal a serial in free text;
- that media depicts the same event, uses the real Matcha effect, or is aligned;
- that audio rights cover every speaker, performer, composition, and recording;
- that perceptually similar files have different SHA-256 values;
- that storage, backups, and access controls match this document;
- that reviewers are independent or holdout access remained blind.

Those are human governance and evidence boundaries. Do not mark P1 complete
until the private pilot, rights audit, metadata inspection, second review, and
media-open checks exist outside Git.

## Running the restoration benchmark

Start the application locally, then run the accepted, non-synthetic split:

```sh
pnpm benchmark:matcha -- \
  --manifest private-data/matcha-benchmark/v1/manifests/pilot.jsonl \
  --split validation \
  --candidate current-webgl \
  --out benchmark-results/raw/current-validation \
  --aggregate-out benchmark-results/aggregates/current-validation
```

The current candidate accepts loopback URLs only and drives the real local
`/from-photo` UI after hydration. It verifies file hashes, decodes all image
sides in Chromium, reads the shipping WebGL canvas, writes private per-item
results only to the ignored raw directory, and optionally writes a separately
deidentified aggregate JSON/Markdown pair to a committable directory.

Synthetic fixtures are rejected by default. `--allow-synthetic-smoke` is only
for infrastructure smoke tests, refuses holdout and mixed real/synthetic
splits, and labels its report as non-evidence. The minimum harness intentionally
does not invent face-ROI, true halo, or video optical-flow scores; selecting
data that requires unsupported coverage returns a non-success result.
