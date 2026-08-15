# Matcha restoration quality and monetization upgrade design

- **Date:** 2026-08-16
- **Status:** Approved direction; ready for execution planning
- **Decision owner:** Product owner

**Primary objective:** Improve the real Matcha-filter reduction result without
giving up the site's free, fast, private core experience or its current Google
search momentum.

## Decision

Use a staged hybrid strategy:

1. Measure the existing tool and user funnel.
2. Build a rights-cleared paired Matcha dataset and a reproducible benchmark.
3. Improve the local browser pipeline with data-calibrated colour transforms
   and face-aware confidence, while keeping manual controls and video support.
4. Evaluate cloud AI only as an explicit, optional face-enhancement step.
5. Test monetization only after product-quality and traffic gates pass: first a
   low-impact ad experiment, then pay-as-you-go AI credits, and only later a
   subscription for a genuinely recurring multi-tool product.

This design rejects an immediate GFPGAN default integration, an immediate
subscription wall, intrusive ad formats, and speculative expansion into thin
SEO pages or unrelated tools.

## Why this is the selected approach

### First-party demand

The 2026-08-15 Search Console export contains 924 query rows. Demand is heavily
concentrated in `remove`, `remover`, `free`, photo, video, TikTok, and how-to
wording. It contains no `restore`, `enhance`, or `upscale` queries. That is
evidence for improving the current remover before selling a broad restoration
subscription.

### Current implementation

The existing browser pipeline is already more than a fixed CSS filter:

- `src/lib/matcha/analyze.ts` computes channel gains and black/white points
  from a downsampled frame using a grey-world assumption;
- `src/lib/matcha/shaders.ts` applies edge-preserving denoise, unsharp detail,
  white balance, level stretch, and saturation in WebGL;
- `src/lib/matcha/presets.ts` currently ships one moderate preset;
- the same renderer supports both photos and videos locally in the browser.

The likely quality ceiling is therefore calibration and scene understanding,
not the absence of a generic face-restoration model. A global grey-world
estimate can misread legitimate green subjects or unusual lighting, and one
preset cannot fit portraits, indoor scenes, outdoor foliage, and compressed
video equally well.

### AI model fit

GFPGAN and Real-ESRGAN may help visibly degraded faces or low-resolution media,
but they do not estimate the inverse Matcha colour transform. GFPGAN can also
alter identity. Cloud inference would remove the current no-upload guarantee,
add latency and failure modes, and is unsuitable as a per-frame video default.

CodeFormer is excluded from commercial production unless written commercial
permission is obtained. Its official repository uses the non-commercial NTU
S-Lab License 1.0 even where a third-party API page presents it as commercially
available. A platform label does not override upstream model rights.

## Alternatives considered

### A. Cloud-AI-first replacement

Upload every image to a generic restoration or editing API and market the
result as AI-powered.

**Advantages:** fast prototype, strong marketing label, minimal algorithm work.

**Disadvantages:** wrong primary problem, identity hallucination, upload/privacy
change, recurring cost, vendor dependence, queue latency, weak video fit, and no
proof that users want restoration.

**Decision:** rejected.

### B. Local-only calibration

Keep all processing in WebGL and improve it using a paired dataset, a fitted
colour transform, scene confidence, and optional local face detection.

**Advantages:** directly targets the colour problem; preserves privacy, speed,
video, and zero marginal API cost.

**Disadvantages:** requires disciplined data collection and cannot recreate
details destroyed by the source filter.

**Decision:** required foundation.

### C. Staged hybrid

Use approach B as the free default and add cloud face restoration only when a
user explicitly requests it and the benchmark proves a meaningful advantage.

**Advantages:** protects the existing product while creating a testable paid
value layer; cloud AI is used only where its model matches the task.

**Disadvantages:** more product states, privacy copy, failure handling, and
vendor/licence review.

**Decision:** selected after the local foundation passes its quality gate.

## Target architecture

### Offline evidence layer

A private, rights-cleared paired dataset contains the unfiltered original and
the corresponding Matcha-filtered export. It never ships with the website and
is never committed to Git. A committed manifest schema, benchmark harness, and
aggregate reports make the evaluation reproducible without publishing private
media.

### Free local processing layer

The browser pipeline becomes:

1. decode media locally;
2. compute global colour and luma statistics;
3. optionally locate a face region locally;
4. estimate scene/cast confidence;
5. select or blend a benchmarked colour transform;
6. apply denoise and detail conservatively;
7. show manual controls and a low-confidence warning when needed;
8. export locally.

The fitted transform may be a 3x3 matrix plus bias, a low-order polynomial, or
a compact 3D LUT. The simplest candidate that wins on validation and holdout is
selected; model complexity is not a success metric.

### Optional AI layer

An AI enhancement is not part of the default remover. It appears only after a
successful local result and only for eligible photos. The user must opt in to
uploading. The system must show provider-neutral copy, retention information,
cost/rate limits, cancel/retry behaviour, and the unchanged local result as a
fallback.

API secrets stay server-side. Input validation, request authentication, rate
limiting, file-size limits, MIME verification, provider timeouts, deletion, and
abuse controls are required before public release.

### Measurement layer

Low-cardinality analytics events measure file selection, local render success,
export, processing mode, error class, preset choice, and optional AI opt-in.
Events must never include filenames, blob URLs, image pixels, prompts, facial
attributes, or other personal media data.

### Monetization layer

- The core Matcha remover remains free, local, no-login, and watermark-free.
- Ads are tested only as a single responsive placement after the result or in a
  content-rich section, never as pop-ups, pop-unders, forced redirects, or
  overlays blocking the tool.
- Optional AI enhancement is first sold through one-time credits because the
  current intent is largely one-off.
- Subscription is unlocked only by recurring behaviour and a coherent set of
  at least three paid capabilities, not by adding a billing page early.

## Data and privacy rules

- No minors in the benchmark.
- Do not scrape private social posts or assume that public visibility grants
  model-training or transformation rights.
- Every real-person item needs documented consent and a recorded usage basis.
- Strip EXIF, GPS, device serials, account names, audio conversations, and other
  unnecessary identifiers before evaluation.
- Store consent records separately from media and reference them by anonymous
  ID.
- Do not label or infer race, ethnicity, health, identity, or other sensitive
  traits. Coverage may be reviewed without storing those labels.
- Never commit private media, consent documents, API keys, raw review exports,
  or biometric embeddings.
- Existing synthetic demo images are suitable for smoke tests only, not as the
  gold benchmark.

## Quality gates

### Local pipeline gate

The new default can replace the existing pipeline only when all conditions are
met on a locked holdout set:

- blind human preference point estimate at least 65% versus the current output,
  with the confidence interval not favouring the current output;
- median overall colour error improves by at least 15%;
- no key scene category worsens by more than 5% on its primary metric;
- clipped dark or bright pixels remain below 1% unless already clipped in the
  input;
- no new visible halos, magenta casts, skin patching, or temporal flicker;
- photo processing remains responsive on the reference mobile device;
- 720p video remains real-time and 1080p degradation stays within the agreed
  performance budget;
- existing photo/video export and audio tests still pass.

The thresholds are internal launch gates, not claims to publish on the site.

### Optional AI gate

Cloud AI may enter a limited beta only when:

- it wins at least 65% of eligible-case blind comparisons against the local
  output alone;
- severe identity-change flags are zero in the reviewed release set;
- success rate is at least 98% excluding user cancellation;
- p95 completion time is at most 8 seconds for the supported photo limit;
- provider/model commercial terms are documented and approved;
- expected inference cost is no more than 10% of net AI revenue;
- upload consent, retention copy, deletion, fallback, rate limiting, and abuse
  protection have passed security review.

### Monetization gates

- Do not interpret a short trend spike as stable traffic; use at least 28
  complete days after the quality release.
- Test one ad placement only after at least 1,000 successful exports have been
  measured and Core Web Vitals are healthy.
- Reject the ad experiment if successful-export conversion falls by more than
  5%, Core Web Vitals regress, or user complaints materially increase.
- Offer one-time AI credits before subscription.
- Consider subscription only after at least three coherent paid capabilities,
  a 30-day returning-processor rate of at least 15%, and real credit customers
  demonstrate recurring usage.

These are decision rules for this project; they are not universal industry
benchmarks.

## SEO and product boundaries

- Preserve the existing five-page English/Chinese intent cluster.
- Do not create pages for word-order variants or generic AI features without
  distinct query and SERP evidence.
- Do not add `AI`, `restore`, `original`, or `recover` claims before the shipped
  function and benchmark support them.
- Continue to describe the core result as reducing/adjusting a visible filter,
  not recovering destroyed pixels or revealing hidden content.
- Keep local processing as the default differentiator even if an optional
  upload feature is later added.

## Rollout and rollback

1. Run the new local pipeline behind an internal flag.
2. Generate benchmark outputs without exposing the candidate to production.
3. Lock and run the holdout once selection is complete.
4. Ship to a small percentage or opt-in beta with the old renderer available as
   a fallback.
5. Compare errors, successful exports, performance, and user preference.
6. Roll back immediately on identity complaints, systematic colour failures,
   export regression, performance regression, or privacy/security failure.

The rollback unit is the candidate pipeline or optional AI feature flag; URLs,
metadata, and the established SEO cluster must remain stable.

## References

- GFPGAN: <https://github.com/TencentARC/GFPGAN>
- Replicate GFPGAN: <https://replicate.com/tencentarc/gfpgan>
- Real-ESRGAN: <https://github.com/xinntao/Real-ESRGAN>
- CodeFormer licence: <https://github.com/sczhou/CodeFormer/blob/master/LICENSE>
- MediaPipe Face Detector for Web:
  <https://developers.google.com/edge/mediapipe/solutions/vision/face_detector/web_js>
- Replicate data retention:
  <https://replicate.com/docs/topics/predictions/data-retention/>
- Google page experience:
  <https://developers.google.com/search/docs/appearance/page-experience>
