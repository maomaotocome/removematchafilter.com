# Matcha effect provenance and collection gate

**Status:** Blocked pending an exact, rights-cleared target effect or owned
original/filtered pairs.

## What was verified

TikTok Effect House documents a filter as a post-effect driven by a LUT texture,
and its effect-management flow exposes an effect detail page and searchable
effect name. Those mechanics can support reproducible paired capture when the
exact effect is known:

- [Filter object documentation](https://effecthouse.tiktok.com/learn/guides/workspace/objects/post-effect/filter)
- [Effect detail and search documentation](https://effecthouse.tiktok.com/learn/guides/management-and-growth/view-your-effect)

The research did not locate a trustworthy official page identifying one
canonical effect named “Matcha Filter.” Current public usage mixes simple green
colour grades with liquid-looking or generative transformations. Therefore the
product must not treat the label as one stable algorithm or claim to reverse an
official TikTok effect.

## Target taxonomy

### A. Correctable colour-grade family

- Green or yellow-green cast.
- Flattened contrast or creamy highlights.
- Added grain or softened local detail.
- Original geometry and most tonal information remain present.

This family is eligible for paired restoration benchmarking if its exact LUT,
effect project, or repeatable capture method is documented.

### B. Generative or geometry-changing family

- Faces, contours, objects, or backgrounds are redrawn.
- Content is covered, replaced, or synthesized.
- The transformation discards information required to recover the original.

This family is a recovery-boundary category. It must not be used as ground
truth for optimizing a deterministic colour/noise/detail renderer, and the
site must not imply that it can reveal or reconstruct hidden content.

## Safe acquisition options, in priority order

1. Obtain the exact effect detail URL, creator/project identifier, or licensed
   LUT, then apply it to media owned by the project using a documented device
   and export workflow.
2. Ask the product owner or consenting volunteers for owned original/filtered
   pairs, along with permission to use them only for internal evaluation and a
   record of the exact effect used.
3. If no canonical effect exists, create two or three explicitly versioned,
   rights-cleared colour-grade variants. Label them as “Matcha-style test
   variants,” never as an official or exact reverse-engineered effect.

## Rejected sources and shortcuts

- Scraping social posts, private groups, or leaked media.
- Sexual, suggestive, censored, intimate, or minor-associated content.
- Inferring or reconstructing covered bodies or hidden content.
- Treating an unrelated matcha-themed aesthetic app as the trend’s canonical
  filter without provenance evidence.
- Using the site’s deterministic demo grade as the gold-standard target.
- Reporting synthetic fixtures as real user or real-effect samples.

## Collection gate

Collection may start only after all of the following are true:

- The exact effect URL/project/LUT is documented, or each donated pair includes
  a reproducible effect identifier and rights statement.
- Rights permit private internal evaluation and reviewer access.
- At least three safe photo pairs and one safe video pair demonstrate that the
  transformation is repeatable.
- A second reviewer confirms that the media is non-explicit, contains no known
  minors, and matches the documented target family.
- Originals, consent records, and raw outputs are stored outside Git and are
  excluded from analytics.

Once this gate passes, the pilot can expand toward the approved 30-photo and
6-video minimum. Until then, P0 analytics, P1 validation, and P2 metric tooling
may proceed independently, but no “real Matcha baseline” may be claimed.
