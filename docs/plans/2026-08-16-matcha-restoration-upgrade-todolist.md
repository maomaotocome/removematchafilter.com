# Matcha restoration quality, benchmark, and monetization TODO

- **Date:** 2026-08-16
- **Design:** `docs/plans/2026-08-16-matcha-restoration-upgrade-design.md`
- **Execution status:** In progress — first P0/P1/P2 infrastructure slice

**Current release:** Keep the deployed local WebGL tool unchanged until a gate
below explicitly authorizes replacement.

## How an AI agent must use this plan

This is a gated execution plan, not a list to complete blindly.

- Complete phases in order. Do not start a later phase merely because it is
  technically possible.
- At every decision gate, produce the named evidence and stop if the gate fails.
- Never tune a candidate against the locked holdout set.
- Preserve the current public URLs, canonicals, hreflang, noindex rules, and
  honest recovery-limit copy.
- Preserve unrelated worktree changes. Stage and commit only files belonging to
  the current task.
- Read `AGENTS.md` before coding. Run the project security-scan skill before
  every commit.
- Do not install a model or package until its code, weights, transitive
  dependencies, and commercial terms have been reviewed.
- Do not add or expose provider tokens in client code, logs, fixtures, commits,
  screenshots, or analytics.
- Do not deploy without using the `deploy-cloudflare` skill and obtaining the
  required final deployment confirmation.
- Update the checkboxes and the evidence table as work completes. A checkbox is
  complete only when its acceptance criteria pass.

## Phase and dependency map

```text
P0 Baseline and governance
  -> P1 Dataset pilot
     -> P2 Benchmark harness and current baseline
        -> P3 Locked dataset v1
           -> P4 Local candidate development
              -> P5 Holdout decision and guarded rollout
                 -> P6 Optional cloud-AI evaluation
                    -> P7 Monetization experiments
```

P6 is optional. P7 must not wait for P6 if the only experiment is a carefully
controlled ad placement, but both P5 and the monetization gates must pass.

## Required evidence index

Maintain this table during execution. Use links to committed aggregate reports,
never links to private media.

| Evidence                                  | Required before | Status                                                            | Location                                                |
| ----------------------------------------- | --------------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| Baseline funnel and performance report    | P3              | Partial: search/renderer frozen; consented product funnel pending | `docs/benchmarks/2026-08-16-matcha-current-baseline.md` |
| Dataset card and rights audit             | P2              | Template complete; private audit blocked on real effect/media     | `docs/benchmarks/matcha-dataset-card-template.md`       |
| Pilot manifest validation report          | P2              | Validator complete; real pilot not collected                      | `scripts/benchmark/`                                    |
| Current renderer benchmark                | P4              | Harness and synthetic smoke complete; real baseline blocked       | `scripts/benchmark/run.mjs`                             |
| Candidate comparison report               | P5              | Not started                                                       | —                                                       |
| Locked holdout report                     | P5 release      | Not started                                                       | —                                                       |
| AI licence and vendor review              | P6 public beta  | Not started                                                       | —                                                       |
| AI cost/latency/identity report           | P6 public beta  | Not started                                                       | —                                                       |
| Ad experiment plan and rollback threshold | P7              | Not started                                                       | —                                                       |
| Credit demand and unit-economics report   | P7 paid AI      | Not started                                                       | —                                                       |

---

# P0 — Baseline, privacy, and experiment governance

## P0.1 Freeze the comparison baseline

- [x] Record the current commit, deployed Cloudflare version, deployment date,
      and every uncommitted file without modifying or cleaning the worktree.
- [x] Record the current default parameters from
      `src/lib/matcha/presets.ts` and hash the relevant renderer/analyser files.
- [x] Save aggregate 2026-08-15 GSC baselines for query, page, country, and
      device segments in a committed Markdown report; do not duplicate raw CSVs
      containing unnecessary data.
- [x] Define the five protected search intents: homepage, photo, video, guide,
      and trend.
- [x] Create a release annotation containing the quality-upgrade start date.

**Acceptance criteria**

- A future agent can reproduce exactly which renderer was the baseline.
- No existing worktree change is overwritten or included accidentally.
- The report states that the available GSC chart is a short trend window, not a
  stable long-term forecast.

## P0.2 Define safe analytics events

- [x] Write an event specification before adding code.
- [x] Use only these low-cardinality event names unless the specification is
      reviewed:
  - `matcha_file_selected`
  - `matcha_render_ready`
  - `matcha_export_started`
  - `matcha_export_succeeded`
  - `matcha_export_failed`
  - `matcha_preset_selected`
  - `matcha_ai_offer_viewed`
  - `matcha_ai_opt_in`
  - `matcha_ai_succeeded`
  - `matcha_ai_failed`
- [x] Allow only reviewed parameters such as `media_mode`, `size_bucket`,
      `duration_bucket`, `preset_id`, `processing_path`, and a bounded `error_code`.
- [x] Explicitly prohibit filename, file path, blob URL, media pixels, prompt,
      free-text errors, face count, inferred demographics, and unique file hashes.
- [x] Use the existing delayed GA loader and ensure events queue safely before
      the external script finishes loading.
- [x] Add unit/browser tests proving prohibited values are not sent.
- [ ] Verify analytics consent and privacy-policy requirements for the actual
      deployment regions before enabling new events.

**Acceptance criteria**

- A local test completes file selection, rendering, and export and shows the
  expected bounded events.
- A repository search and network inspection find no media-identifying value.
- Tool functionality remains available when analytics is blocked.

## P0.3 Define reference environments

- [ ] Select one lower/mid-range Android reference device representative of the
      mobile audience, one recent iPhone/Safari device, and one desktop Chrome
      environment.
- [ ] Record OS, browser, RAM class, screen size, DPR, thermal/power conditions,
      and test network profile.
- [ ] Define photo inputs at approximately 1MP, 4MP, and the supported maximum.
- [ ] Define video inputs at 720p and 1080p, 24/30fps, with and without audio.
- [ ] Run each timed case at least five times after one warm-up and report
      median and p95, not the best run.

**Acceptance criteria**

- Performance comparisons always use the same named environments and inputs.
- Browser emulation is marked as emulation; it is not presented as real-device
  performance evidence.

---

# P1 — Build the Matcha paired-dataset pilot

## P1.1 Create dataset governance before collecting media

- [x] Add `/private-data/` and `/benchmark-results/raw/` to `.gitignore`.
- [x] Create committed documentation under `scripts/benchmark/` covering
      allowed sources, consent, storage, deletion, and incident handling.
- [x] Create `scripts/benchmark/manifest.schema.json`.
- [x] Create a synthetic `manifest.example.jsonl` containing no real person or
      private path.
- [ ] Store actual media under
      `private-data/matcha-benchmark/v1/`; never under `public/`, `src/`, or tracked
      test-fixture directories.
- [ ] Store consent/rights records separately from media, referenced by an
      anonymous `rights_id`.
- [x] Define a dataset deletion process by `pair_id` and `rights_id`.
- [x] Document who is allowed to access the private directory.

**Required manifest fields**

- `pair_id`
- `media_type`: `photo` or `video`
- `scene_category`
- `capture_group_id` for keeping the same person/scene in one split
- `original_path` and `filtered_path`, both private relative paths
- `original_sha256` and `filtered_sha256`
- original and filtered width/height, plus video fps/duration/codec where used
- `capture_device_family` without serial numbers
- `filter_name`, observed app version, capture date, and export path description
- `lighting_category`, `dominant_green`, and `compression_generation`
- `has_adult_faces` and a coarse face-count bucket
- `rights_id`, allowed uses, expiration/deletion date if any
- `split`: `calibration`, `validation`, or `holdout`
- normalization/alignment status and rejection reason

Do not store names, handles, URLs to personal profiles, GPS, ethnicity, race,
health attributes, face embeddings, or free-form personal descriptions.

## P1.2 Define the v1 sampling matrix

Target **120 still-image pairs**:

| Category               | Pairs | Primary failure being tested               |
| ---------------------- | ----: | ------------------------------------------ |
| Single portrait/selfie |    48 | skin tone, hair, face-local correction     |
| Group/lifestyle        |    24 | multiple faces, mixed local lighting       |
| Indoor/warm/low light  |    18 | warm lights, shadow noise, clipping        |
| Outdoor/sky/greenery   |    18 | legitimate greens, sky, neutral surfaces   |
| Product/food/no person |    12 | labels, whites, texture, non-face fallback |

Target **24 paired video clips**, each 5–10 seconds:

- [ ] 12 portrait/short-form creator clips.
- [ ] 4 group/lifestyle clips.
- [ ] 4 indoor/warm/low-light clips.
- [ ] 4 outdoor/greenery clips.
- [ ] Include static, moderate-motion, and camera-motion examples.
- [ ] Include clips with speech/music only when all audio rights and participant
      consent are explicit; otherwise remove audio before storage.

Coverage requirements may overlap categories:

- [ ] At least 30% of stills contain naturally green subjects/backgrounds.
- [ ] At least 30% contain warm or mixed lighting.
- [ ] Include front- and rear-camera sources and more than one mobile device
      family where available.
- [ ] Include a range of complexions and lighting outcomes without storing or
      inferring race/ethnicity labels.
- [ ] No minors.
- [ ] No celebrity, scraped private account, copyrighted stock without
      transformation rights, or unlicensed brand campaign media.

## P1.3 Acquire genuinely paired media

Preferred source order:

1. controlled media created for this benchmark by consenting adults;
2. product-owner media with explicit benchmark/product-improvement rights;
3. licensed media whose licence explicitly permits the required transformation
   and evaluation;
4. volunteered user pairs with a clear consent and deletion workflow.

- [ ] Capture/export the neutral original first.
- [ ] Apply the real Matcha effect to the same source without an intervening
      crop or edit whenever the source application permits it.
- [ ] Record the real effect name/version and export settings; do not silently
      substitute the repository's synthetic green grade.
- [ ] Keep original and filtered files immutable after ingestion.
- [ ] Create normalized derivatives rather than editing raw files.
- [ ] If the actual effect is no longer reproducibly available, stop and record
      the blocker. Synthetic fixtures may test infrastructure but cannot replace
      the gold set.

## P1.4 Build a 30-photo and 6-video pilot first

- [ ] Collect a balanced pilot before attempting the full matrix.
- [ ] Strip EXIF/GPS and unnecessary audio metadata from normalized copies.
- [ ] Correct orientation consistently.
- [ ] Detect duplicates by SHA-256 and perceptual similarity.
- [ ] Geometrically align filtered outputs with originals when the exporting
      application changes crop, scale, or rotation.
- [ ] Reject pairs with unrecoverable occlusion, different scene content,
      mismatched frames, missing rights, or failed alignment.
- [ ] Have a second reviewer verify at least 20% of pilot manifest entries.

**Pilot acceptance criteria**

- 30 valid photo pairs and 6 valid video pairs cover every category.
- 100% have rights records and hashes.
- 0 contain EXIF GPS, account handles, or minors.
- A benchmark script can open both sides of every pair.
- Alignment/rejection decisions are reproducible and documented.

---

# P2 — Build the reproducible benchmark harness

## P2.1 Create the benchmark command and output contract

- [x] Add `scripts/benchmark/run.mjs` with explicit dataset, candidate, split,
      and output arguments.
- [x] Add `scripts/benchmark/validate-manifest.mjs`.
- [x] Reuse the project's Playwright/Chromium image decoding and real WebGL
      renderer where practical; do not create a visually similar fake renderer.
- [x] Record tool commit, candidate ID, manifest hash, browser version, OS,
      timestamp, and parameters in every result.
- [x] Make deterministic runs deterministic: fixed seeds, ordered inputs, and
      stable transforms.
- [x] Write raw per-item results only to a gitignored directory.
- [ ] Generate a committed aggregate JSON and human-readable Markdown report
      without private filenames or thumbnails.
- [x] Return non-zero when validation, decoding, candidate execution, or metric
      coverage fails.

Suggested command contract:

```sh
pnpm benchmark:matcha -- \
  --manifest private-data/matcha-benchmark/v1/manifest.jsonl \
  --split validation \
  --candidate current-webgl \
  --out benchmark-results/raw/current-validation
```

## P2.2 Implement paired-image normalization

- [x] Convert evaluation pixels to a defined colour space and document browser
      colour-management limitations.
- [ ] Align and crop both images to the common valid region.
- [x] Record the geometric transform and coverage percentage.
- [ ] Exclude borders, app UI, watermarks, and padded pixels.
- [ ] Refuse an objective comparison when alignment confidence is below the
      documented threshold; keep the item for human review if still useful.
- [ ] Preserve a full-resolution path and a standard evaluation-resolution path.

## P2.3 Implement objective photo metrics

Primary metrics:

- [x] CIEDE2000 colour difference over the valid image region.
- [ ] CIEDE2000 over reviewed face/skin and neutral-reference ROIs where present.
- [x] Highlight/shadow clipping introduced by the candidate.
- [x] Structural similarity on luminance after alignment.
- [ ] Edge preservation and visible halo score around strong edges.

Secondary diagnostics:

- [x] Per-channel mean and percentile error.
- [x] Saturation and luma-distribution error.
- [x] PSNR as a diagnostic, not the sole quality score.
- [x] Processing duration, peak canvas size, and failure class.

Every metric needs a unit test using small deterministic colour patches with
known expected values and tolerance. Do not accept metrics merely because they
produce numbers.

## P2.4 Implement video metrics

- [ ] Align original and filtered timelines before comparing frames.
- [ ] Evaluate a fixed set of timestamps plus scene-change boundaries.
- [ ] Measure frame-level colour error and clipping.
- [ ] Measure temporal colour variance/flicker after compensating for scene
      motion where practical.
- [ ] Record render FPS, long tasks, dropped/duplicated frames, export duration,
      output duration, audio presence, and A/V sync.
- [ ] Flag face-detail changes that vary from frame to frame.

## P2.5 Create blind human review

- [ ] Build a local review page that randomizes left/right and hides candidate
      names, filenames, and expected winner.
- [ ] Ask four bounded questions:
  1. Which result is closer to the known original?
  2. Which has more natural colour/skin tone?
  3. Which contains fewer visible artifacts?
  4. Does either change a person's recognizable features?
- [ ] Add `tie/indistinguishable` and `cannot judge` choices.
- [ ] Obtain at least three independent ratings per holdout item.
- [ ] Keep reviewers from seeing objective metrics before rating.
- [ ] Report point estimate and confidence interval, category breakdown, ties,
      disagreement, and excluded judgments.
- [ ] Store raw review assignments privately; commit aggregate results only.

## P2.6 Benchmark the current renderer

- [ ] Run the exact deployed/current renderer against the pilot.
- [ ] Produce category failure examples described in words, not published
      private images.
- [ ] Confirm or reject the hypotheses that global grey-world correction fails
      on legitimate green scenes and that a single preset underperforms across
      indoor/outdoor/portrait categories.
- [ ] Measure mobile photo latency and 720p/1080p video performance using P0.3.
- [ ] Record export success and audio behaviour with existing QA.

**P2 gate**

Proceed only if the harness is deterministic within documented tolerance, all
metrics have tests, reviewers can complete blinded evaluation, and the baseline
report identifies real, repeatable failure groups. If not, improve the evidence
system before changing the renderer.

---

# P3 — Complete and lock dataset v1

- [ ] Expand the accepted pilot to the full 120-photo/24-video matrix.
- [ ] Split by `capture_group_id`, never by individual file, so the same person
      or scene cannot appear across calibration, validation, and holdout.
- [ ] Target 60% calibration, 20% validation, and 20% holdout while preserving
      category coverage.
- [ ] Validate every rights record, hash, path, metadata strip, alignment, and
      category.
- [ ] Have a second reviewer verify all holdout entries and a random 20% of the
      other entries.
- [ ] Freeze the holdout manifest and record its SHA-256.
- [ ] Restrict access so candidate developers cannot browse holdout outputs
      while tuning.
- [ ] Write a dataset card documenting collection, limitations, exclusions,
      known biases, intended use, prohibited use, retention, and deletion.

**P3 gate**

- 120 valid photo pairs and 24 valid video pairs.
- 100% rights and manifest validation.
- No cross-split `capture_group_id` leakage.
- Holdout hash recorded before candidate selection.
- Synthetic examples are clearly separated from the real gold set.

---

# P4 — Develop the local quality candidates

## P4.1 Establish candidate IDs and one-change experiments

Use stable IDs such as:

- `B0-filtered-input`
- `B1-current-webgl`
- `C1-fitted-matrix`
- `C2-polynomial-colour`
- `C3-3d-lut`
- `C4-face-aware-blend`
- `C5-scene-presets`

- [ ] Change one material factor per candidate where possible.
- [ ] Record all fitted parameters and the calibration-manifest hash.
- [ ] Do not select a candidate from demo-image aesthetics alone.

## P4.2 Fit the simplest colour inversion first

- [ ] Fit a regularized 3x3 RGB matrix plus bias on calibration pairs.
- [ ] Constrain or penalize clipping and extreme channel gains.
- [ ] Compare it with a low-order polynomial transform.
- [ ] Test a compact 3D LUT only if simpler transforms leave consistent,
      material validation error.
- [ ] Verify WebGL1/WebGL2 precision and cross-browser output tolerance.
- [ ] Keep a confidence-based path back to the current conservative correction.

**Decision rule:** choose the least complex transform whose validation result is
not materially worse than the best candidate and whose mobile/video performance
meets budget.

## P4.3 Add local face-aware estimation carefully

- [ ] Prototype MediaPipe Face Detector or Face Landmarker locally; document
      package/model licences and bundle size.
- [ ] Run synchronous vision work in a Web Worker or otherwise prove it does not
      block the main interaction path.
- [ ] Do not treat the whole face box as skin. Define a conservative ROI that
      avoids hair, eyes, mouth, and surrounding background, or reject the estimate
      when confidence is insufficient.
- [ ] Blend face-local evidence with global statistics instead of recolouring
      only the face and creating seams.
- [ ] For video, detect at a bounded cadence and track/interpolate between
      detections; measure temporal stability.
- [ ] Fall back cleanly on no face, multiple uncertain faces, unsupported
      browser, slow device, or model-load failure.
- [ ] Keep all face detection local and do not emit face analytics.

## P4.4 Add scene/preset behaviour only when validated

- [ ] Test `Portrait`, `Indoor`, and `Outdoor` candidates against their named
      validation categories.
- [ ] Add an `Auto` choice that reports low confidence instead of pretending to
      know the original.
- [ ] Preserve manual colour/noise/detail controls.
- [ ] Avoid category names or copy that imply recovery of hidden information.
- [ ] Do not ship more presets when they do not produce a statistically or
      visually material improvement.

## P4.5 Protect detail and video

- [ ] Tune denoise and unsharp after colour estimation, not simultaneously with
      the first colour experiment.
- [ ] Measure halos, skin texture, text/product edges, compression artifacts,
      and noise amplification.
- [ ] Verify video colour does not pulse when face detection confidence changes.
- [ ] Preserve pause/seek/resume, visibility throttling, audio, and export type.

## P4.6 Select on validation only

- [ ] Run every viable candidate on the validation split.
- [ ] Review aggregate and per-category metrics.
- [ ] Conduct blinded human comparisons for the top two candidates versus B1.
- [ ] Perform an error audit on every severe regression.
- [ ] Choose one release candidate and freeze its parameters/code before
      touching holdout.
- [ ] Write a selection report explaining rejected candidates and trade-offs.

---

# P5 — Holdout decision, product integration, and rollout

## P5.1 Run the locked holdout once

- [ ] Verify the holdout manifest hash before execution.
- [ ] Run B1 and the frozen release candidate with identical environments.
- [ ] Complete blinded human review before looking at candidate labels.
- [ ] Report every design quality gate, not only metrics that improved.
- [ ] If the candidate fails, do not tune on holdout. Document the failure,
      return to calibration/validation with a new candidate ID, and create a future
      holdout version only through the governance process.

## P5.2 Integrate behind a reversible flag

- [ ] Keep the existing renderer available as the fallback.
- [ ] Add a server/build-controlled rollout flag without exposing secrets.
- [ ] Cache local model assets with versioned URLs if MediaPipe is used.
- [ ] Ensure the tool still works when the model asset fails to load.
- [ ] Update bilingual UI copy and accessibility labels.
- [ ] Update honest privacy/recovery-limit copy only to describe what is
      actually shipped.
- [ ] Do not change public routes, canonicals, sitemap intent, or page titles
      merely because the algorithm changed.

## P5.3 Full pre-release verification

- [ ] `pnpm build`
- [ ] `pnpm qa:tool`
- [ ] `pnpm qa:seo http://localhost:3000`
- [ ] `pnpm qa:theme`
- [ ] high-DPR/mobile layout checks
- [ ] benchmark smoke suite with non-private fixtures
- [ ] real-device photo and video performance checks
- [ ] analytics privacy/network inspection
- [ ] accessibility keyboard/touch checks
- [ ] security scan over the exact worktree/diff
- [ ] `git diff --check`
- [ ] review every product claim against actual behaviour

## P5.4 Guarded production rollout

- [ ] Obtain final deploy confirmation and deploy with `deploy-cloudflare`.
- [ ] Verify homepage, photo, video, public config, sitemap, HTTPS redirect, and
      representative image/video exports in production.
- [ ] Begin at internal/opt-in or the smallest supported rollout percentage.
- [ ] Monitor bounded error classes, successful-export rate, performance, and
      support complaints.
- [ ] Expand only when the rollback triggers remain clear for a complete
      observation window.

**Immediate rollback triggers**

- severe identity complaint or unexpected upload;
- systematic magenta/green failure category;
- export success regression greater than 5%;
- p95 interaction or rendering regression greater than the approved budget;
- video flicker/A-V regression;
- privacy, security, licence, or analytics leak;
- material SEO/indexability regression.

---

# P6 — Optional cloud-AI enhancement evaluation

P6 starts only after P5 succeeds. It is a separate product experiment, not part
of fixing the local remover.

## P6.1 Vendor/model due diligence

- [ ] Evaluate only models matching a measured residual problem: GFPGAN for
      visibly degraded faces and Real-ESRGAN for resolution/detail.
- [ ] Exclude general text-guided image editing from the first evaluation.
- [ ] Block CodeFormer from commercial use without written permission that
      resolves its upstream non-commercial licence.
- [ ] Treat undocumented Kie/fal/Replicate wrappers as unapproved until the
      underlying model, weights, provider terms, pricing, retention, and deletion
      are documented.
- [ ] Record provider/model version and pin it; never rely on an unversioned
      latest model in a benchmark.
- [ ] Review content policy, data location, retention, deletion API, outage
      history, SLA if any, commercial rights, indemnity limits, and price-change
      handling.

## P6.2 Offline evaluation only

- [ ] Select the worst 30 eligible portrait cases from calibration/validation,
      not holdout.
- [ ] Compare local-only output with local + each AI candidate.
- [ ] Use high-fidelity settings first and record all seeds/parameters.
- [ ] Have reviewers focus on identity, eyes, teeth, skin texture, hair boundary,
      jewellery, text, and background damage.
- [ ] Measure success/failure, queue time, compute time, total time, output size,
      and current cost per eligible image.
- [ ] Recalculate monthly unit economics using measured opt-in and completion,
      not UV assumptions.

## P6.3 Design explicit opt-in and fallback

- [ ] Offer AI only after the local result exists.
- [ ] State clearly that the photo leaves the device and name retention in plain
      language before consent.
- [ ] Do not pre-check consent or hide it in terms.
- [ ] Preserve/download the local result if cloud processing fails.
- [ ] Provide cancel, timeout, retry, and refund/credit restoration behaviour.
- [ ] Do not market generated facial detail as recovered truth.

## P6.4 Secure server architecture

- [ ] Keep vendor tokens server-side in the existing encrypted configuration
      system or Worker secrets.
- [ ] Authenticate paid/limited requests where required without gating the free
      local tool.
- [ ] Validate magic bytes, MIME, size, pixel count, and supported dimensions.
- [ ] Re-encode or sanitize hostile metadata where the provider workflow needs
      an uploaded copy.
- [ ] Apply per-IP/account rate limits, concurrency limits, timeouts, and budget
      ceilings.
- [ ] Prevent SSRF by never accepting an arbitrary server-fetch URL from users.
- [ ] Verify webhook signatures and make credit/refund operations idempotent.
- [ ] Delete temporary files and logs on the documented schedule.
- [ ] Add abuse, provider outage, and cost-spike alerts.

## P6 gate

Do not launch publicly unless every optional-AI quality, licence, privacy,
latency, reliability, and unit-economics gate in the design document passes.

---

# P7 — Monetization experiments

## P7.1 Establish a 28-day post-quality baseline

- [ ] Wait for 28 complete days after the local quality release unless the
      owner explicitly approves an earlier isolated experiment.
- [ ] Report organic clicks, positions, CTR, successful exports, export funnel,
      device/country mix, repeat processor rate, and Core Web Vitals.
- [ ] Segment photo and video behaviour; do not infer paid demand from pageviews.
- [ ] Require at least 1,000 measured successful exports before judging the
      conversion impact of monetization.

## P7.2 Test one low-impact ad placement

- [ ] Prefer AdSense or another policy-compliant network; reject pop-under,
      forced redirect, misleading download, or full-screen interruption formats.
- [ ] Place one responsive unit after a completed result or in a content-rich
      section, never between upload and result/download.
- [ ] Reserve its dimensions to prevent layout shift.
- [ ] Load asynchronously and preserve the tool when ad code is blocked.
- [ ] Run a controlled cohort experiment with a prewritten duration and minimum
      sample size.
- [ ] Compare revenue per session, successful-export conversion, LCP, CLS, INP,
      bounce/engagement, and support complaints.
- [ ] Remove the placement if conversion falls by more than 5%, Core Web Vitals
      materially regress, or policy/trust complaints appear.

## P7.3 Validate AI willingness to pay before billing build-out

- [ ] Measure eligible users, offer views, opt-in rate, completion, repeat use,
      and requests for batch/HD output.
- [ ] Test pricing intent without charging only if the UX clearly labels the
      test and does not deceive users.
- [ ] Interview or survey actual repeat users with bounded questions.
- [ ] Build a unit-economics sheet including inference, storage/egress, payment
      fees, refunds, abuse, free trials, taxes, and support.
- [ ] Require expected inference/variable cost below 10% of net AI revenue and a
      credible gross margin after payment costs.

## P7.4 Launch one-time credits before subscription

- [ ] Keep the local remover unlimited and free.
- [ ] Give a small, explicit AI trial only after abuse limits exist.
- [ ] Sell a simple one-time credit pack before monthly renewal.
- [ ] Show exact credit consumption before processing.
- [ ] Deduct credit only on successful output; restore it idempotently on
      provider failure.
- [ ] Add purchase, usage, expiry, refund, and cancellation copy in both
      languages.
- [ ] Use existing payment/credit modules and production migration workflow;
      never apply a production schema migration without review.

## P7.5 Subscription gate

Build a subscription offer only when all are true:

- [ ] At least three coherent paid capabilities exist, such as AI face enhance,
      batch processing, and high-resolution upscale.
- [ ] Thirty-day returning-processor rate is at least 15%.
- [ ] Real credit customers demonstrate repeated use and request a recurring
      plan.
- [ ] Churn/refund assumptions and provider cost sensitivity are modelled.
- [ ] The subscription does not gate the free search-intent workflow.

If these conditions fail, retain one-time credits and ads rather than forcing a
subscription onto one-off users.

---

# Cross-cutting SEO and content TODO

- [ ] Keep the existing five-page bilingual cluster and intent ownership.
- [ ] Use GSC query-by-page data before changing titles or creating a page.
- [ ] Do not create `AI photo restorer`, `upscale`, or other pages until the
      capability exists and distinct search demand/SERP intent is validated.
- [ ] Do not create word-order pages or fixed-density content.
- [ ] Update examples only with outputs from the actually shipped default
      pipeline; label synthetic demo sources honestly.
- [ ] Add `AI` copy only beside the optional AI feature, never to the local
      output by implication.
- [ ] Preserve canonicals, reciprocal hreflang, sitemap entries, and noindex for
      template/auth/admin/settings surfaces.
- [ ] Compare two complete seven-day GSC windows after each material rollout;
      avoid daily reactive edits.

# Cross-cutting Definition of Done

A phase is not complete until:

- [ ] every task checkbox and gate is satisfied or explicitly marked rejected
      with evidence;
- [ ] code and documents match real behaviour;
- [ ] bilingual copy is complete;
- [ ] privacy/licence/security review is complete;
- [ ] build and relevant QA pass;
- [ ] aggregate evidence is committed without private data;
- [ ] private inputs, secrets, and raw reviews remain untracked;
- [ ] rollback instructions are tested and documented;
- [ ] production claims avoid exact recovery, hidden-content revelation, or
      identity guarantees.

# Recommended first execution slice

The first AI implementation task should be limited to **P0 + P1 pilot + the
minimum P2 harness needed to benchmark B1**. It must not modify the production
renderer.

Expected first-slice deliverables:

1. analytics event specification and privacy tests;
2. private-dataset governance, gitignore, schema, and example manifest;
3. 30-photo/6-video rights-cleared pilot collected outside Git;
4. manifest validator;
5. deterministic current-renderer benchmark command;
6. tested colour/clipping/performance metrics;
7. current-baseline aggregate report;
8. a go/no-go recommendation for completing dataset v1.

Stopping after this slice is intentional. It gives the next AI agent evidence
for algorithm design instead of letting it optimize against invented examples.
