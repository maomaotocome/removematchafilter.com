# Matcha restoration execution log

- **Started:** 2026-08-16
- **Coordinator:** root agent
- **Approved design:**
  `docs/plans/2026-08-16-matcha-restoration-upgrade-design.md`
- **Master TODO:**
  `docs/plans/2026-08-16-matcha-restoration-upgrade-todolist.md`

## Context anchors

- The production default remains the local WebGL renderer.
- This execution slice is limited to P0, the P1 pilot infrastructure, and the
  minimum P2 harness needed to measure the current renderer.
- Do not replace the production algorithm, add cloud AI, add billing, add ads,
  create new SEO pages, or deploy during this slice.
- Real paired media must be rights-cleared and created with the real Matcha
  effect. Synthetic fixtures may test infrastructure but cannot satisfy the
  dataset gate.
- Private media, consent records, raw reviews, raw benchmark results, secrets,
  filenames, blob URLs, pixels, face attributes, and biometric data must not be
  committed or sent to analytics.
- The existing worktree contains earlier deployed but uncommitted changes.
  Every contributor must preserve them; the coordinator alone stages/commits.

## Workstreams

| ID        | Owner           | Scope                                                                      | Files owned                                                                                                                                                                             | Status                                                                          | Gate evidence                                                |
| --------- | --------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| P0        | `gsc_content`   | Baseline, event contract, privacy-safe funnel events and QA                | `docs/benchmarks/2026-08-16-matcha-current-baseline.md`, `docs/analytics/matcha-events.md`, `src/lib/analytics/matcha-events.ts`, scoped edits to `matcha-tool.tsx` and `tool-test.mjs` | Infrastructure complete; production activation blocked on consent/policy review | Build plus 56/56 browser QA                                  |
| P1        | `technical_seo` | Private-data governance, manifest schema/example, validator and tests      | `.gitignore`, `scripts/benchmark/{README,manifest*,validate*,test-validate*}`, dataset-card template                                                                                    | Governance complete; real pilot blocked on provenance/media                     | 15/15 validator tests plus manual governance audit           |
| P2        | `mobile_perf`   | Image metrics, benchmark runner, real-current-renderer candidate and tests | `scripts/benchmark/run.mjs`, `scripts/benchmark/lib/**`, `scripts/benchmark/candidates/**`, `scripts/benchmark/test-image-metrics.mjs`                                                  | Minimum photo harness complete; real baseline blocked on pilot                  | 6/6 metric tests plus real-UI synthetic smoke                |
| DATA      | `root`          | Verify availability and lawful acquisition path for the real effect/pairs  | Research note; no media collection until a legal source is confirmed                                                                                                                    | Blocked on exact effect provenance                                              | Exact effect/LUT/project or owned pairs plus rights evidence |
| INTEGRATE | `root`          | Review, reconcile, test, security scan, evidence report                    | Integration-only changes after workstreams finish                                                                                                                                       | First slice complete                                                            | Full scoped QA and first-slice decision report               |

## Dependency and stop rules

1. P0, P1, and metric-unit portions of P2 may run in parallel.
2. A real baseline run depends on a valid manifest and at least the pilot media.
3. Pilot collection cannot be marked complete without 30 real photo pairs and
   6 real video pairs passing rights and manifest checks.
4. If the real Matcha effect cannot be accessed reproducibly, stop collection
   and report the blocker. Do not substitute the deterministic demo grade.
5. No P3/P4 candidate work begins until the current baseline exposes repeatable
   failure categories.

## Evidence ledger

| Timestamp  | Workstream   | Evidence                                                             | Result                                                                                                                  | Follow-up                                                                |
| ---------- | ------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 2026-08-16 | Coordination | Approved design `8ff4b76` split into P0/P1/P2/DATA workstreams       | Started                                                                                                                 | Await bounded agent results                                              |
| 2026-08-16 | DATA         | Official Effect House documentation plus current trend-source review | No single canonical official Matcha effect verified; term covers materially different treatments                        | Require an exact effect source or owned paired samples before collection |
| 2026-08-16 | P0           | Build and isolated browser QA                                        | Build passed; 56/56 checks passed; analytics made 0 real network requests                                               | Keep product events default-deny until consent/policy review             |
| 2026-08-16 | P1           | Manifest validator and governance suite                              | 15/15 tests passed; synthetic/rejected/unsafe content excluded                                                          | Collect no media until DATA gate passes                                  |
| 2026-08-16 | P2           | Metric suite and full current-WebGL synthetic smoke                  | 6/6 tests passed; real local UI canvas ran at the shipped 70/45/35 controls                                             | Run real baseline only after eligible pilot exists                       |
| 2026-08-16 | Integration  | `pnpm benchmark:test`                                                | 21/21 tests passed                                                                                                      | Finish security and final build checks                                   |
| 2026-08-16 | Integration  | Final build, formatting, diff, and project security scan             | Build passed; formatting/diff checks passed; deterministic and manual security review found no HIGH/MEDIUM/LOW findings | Do not deploy this measurement-only slice                                |

## Decisions and deviations

- Internal collaboration agents are used inside this root task; no additional
  user-visible chat/thread is created.
- The repository does not provide the `writing-plans` skill, so the committed
  master TODO serves as the implementation-plan source of truth.
- A task may be marked `Blocked` without blocking independent workstreams. The
  blocking fact and required external input must be written here.
- The target is split into a correctable colour-grade/LUT family and a
  generative/geometry-changing family. Only the first can provide restoration
  ground truth for the deterministic renderer; the second is a recovery-limit
  category, not an optimization target.
- No scraped, private, sexual, suggestive, or minor-associated media may enter
  the dataset. Synthetic fixtures can verify code paths but can never be
  reported as real Matcha-effect evidence.
