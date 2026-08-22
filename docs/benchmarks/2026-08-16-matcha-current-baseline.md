# Matcha current baseline

- **Baseline frozen:** 2026-08-16 (Asia/Shanghai)
- **Quality-upgrade release annotation:** `2026-08-16-matcha-quality-baseline`
- **Git commit:** `8ff4b76e225476dc05945c46017290964f1db66c`
- **Cloudflare Worker version:** `d14c1bf2-ffba-498e-a752-900894420f48`
- **Worker version number:** 9
- **Worker version created:** 2026-08-15 14:53:31 UTC
- **Deployment source:** Wrangler

The Cloudflare timestamp and version metadata were read from the Cloudflare API
on 2026-08-16. The API identifies the deployed bundle, but does not prove that
every local uncommitted source file below was part of that bundle. The clean
renderer/analyser files match the recorded Git commit; dirty entry and loading
files are therefore recorded with both their commit and pre-P0 working-copy
hashes.

## Renderer identity

The shipped default preset in `src/lib/matcha/presets.ts` is:

```text
color: 70
noise: 45
detail: 35
saturation at full color strength: 1.22
photo long-edge ceiling: 4096px
video long-edge ceiling: 1920px
video recording target: 30fps
processing path: local WebGL
```

SHA-256 values:

| File                                    | Commit `8ff4b76`                                                   | Pre-P0 working copy                                                | State at freeze |
| --------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ | --------------- |
| `src/lib/matcha/analyze.ts`             | `05affa44dae5cdf63cfef707606034409371fd97a02c34e5193e780dd6826007` | same                                                               | clean           |
| `src/lib/matcha/renderer.ts`            | `42777eb3d93fb64e3dec5131c66a7b3cfec35cd07dbfad3cf0c17415f8a89942` | same                                                               | clean           |
| `src/lib/matcha/shaders.ts`             | `0d3136b3811b2629485e5b1eb499ec53dab2b33b57e9b8f4d5e8296bafbf821f` | same                                                               | clean           |
| `src/lib/matcha/presets.ts`             | `8188d924c97b0f184257a25d4e970d2f35c8833bb61f6dd5078e5b8b30f839e1` | same                                                               | clean           |
| `src/lib/matcha/export.ts`              | `9e22ca9bf29df42b9d11ad20d38969dc931cb004da99704c48db179eba7a9615` | same                                                               | clean           |
| `src/lib/matcha/load-media.ts`          | `9f05352c1b9e4cce3f9ff51bb86f0089115a7b5b49aab66b2c230451039be25a` | `beea1f04f724d61ada8e14225db651dda0e863f63bebecc67ff28b15ac99c49c` | dirty before P0 |
| `src/components/matcha/matcha-tool.tsx` | `5a86f5b52580693c99b583eef2e73440c1be4d64226b614ea21d8c2681415843` | `e8304af85cfc00879b32dc124aa5111c0c972f13d876f946fb9b5d951fedc34d` | dirty before P0 |

## Search Console baseline

Source export directory:
`/Users/yekai/Desktop/removematchafilter.com-Performance-on-Search-2026-08-15/`

The export filter is Web search over “Last 3 months”, but the chart contains
only 2026-08-08 through 2026-08-13 because the property was new and Search
Console reporting lags. This is a six-day launch snapshot, not a stable demand
forecast or a basis for projecting long-term revenue.

### Site total and daily chart

| Date       |    Clicks | Impressions |        CTR |          Position |
| ---------- | --------: | ----------: | ---------: | ----------------: |
| 2026-08-08 |        45 |         238 |     18.91% |               8.7 |
| 2026-08-09 |     1,654 |       7,682 |     21.53% |               8.6 |
| 2026-08-10 |     1,367 |       7,199 |     18.99% |               9.1 |
| 2026-08-11 |     1,287 |       6,904 |     18.64% |               8.8 |
| 2026-08-12 |     1,114 |       6,641 |     16.77% |               8.9 |
| 2026-08-13 |       875 |       5,088 |     17.20% |               8.9 |
| **Total**  | **6,342** |  **33,752** | **18.79%** | **8.84 weighted** |

The decline after 2026-08-09 is consistent with declining demand or a changed
query mix, but six days cannot establish a trend. Compare complete seven-day
windows and omit the newest two reporting days before making SEO decisions.

### Visible query families

`Queries.csv` contains 924 rows totalling 3,952 clicks and 19,838 impressions,
only 62.3% of site clicks and 58.8% of site impressions. Search Console hides
some low-volume queries, so these families are directional and overlap.

| Query family                        | Clicks | Impressions |    CTR | Impression-weighted position |
| ----------------------------------- | -----: | ----------: | -----: | ---------------------------: |
| `remover` token                     |  1,786 |       8,385 | 21.30% |                         9.92 |
| `remove` token, excluding `remover` |  1,580 |       7,196 | 21.96% |                         9.25 |
| video                               |    609 |       2,419 | 25.18% |                        10.44 |
| photo/image/picture                 |     49 |         276 | 17.75% |                         7.34 |
| TikTok                              |    130 |         917 | 14.18% |                         8.85 |
| how / Tagalog `paano`               |    333 |       1,816 | 18.34% |                        10.04 |
| trend / viral                       |    238 |       2,394 |  9.94% |                        10.54 |
| Tagalog                             |     34 |         334 | 10.18% |                         8.84 |

Largest position 8–30 opportunities are `matcha filter remover` (1,994
impressions, position 13.95), `matcha filter remover video` (510, 10.50),
`how to remove matcha filter` (352, 15.31), `remove matcha filter video`
(273, 11.32), and `matcha filter trend` (149, 14.15).

### Page rows

| Page                              | Clicks | Impressions |    CTR | Position |
| --------------------------------- | -----: | ----------: | -----: | -------: |
| `https://removematchafilter.com/` |  5,436 |      28,600 | 19.01% |     8.66 |
| `/from-video`                     |    605 |       2,746 | 22.03% |    11.60 |
| `http://removematchafilter.com/`  |    231 |       1,137 | 20.32% |    14.03 |
| `/from-photo`                     |    102 |         572 | 17.83% |    14.74 |
| `/matcha-filter-trend`            |     86 |       2,641 |  3.26% |    13.24 |
| `/how-to-remove-matcha-filter`    |     64 |         355 | 18.03% |    23.74 |

Page rows and property totals use different Search Console aggregation rules
and are not summed as a funnel. The HTTP row is historical/reporting evidence,
not proof of a current redirect failure; the live HTTP URL returned a permanent
redirect during the 2026-08-15 review.

### Country and device

| Country         | Clicks | Impressions |    CTR | Position |
| --------------- | -----: | ----------: | -----: | -------: |
| Philippines     |  3,287 |      17,490 | 18.79% |     9.15 |
| United States   |    461 |       3,327 | 13.86% |     8.77 |
| Indonesia       |    357 |       1,774 | 20.12% |     8.44 |
| Myanmar (Burma) |    254 |       1,286 | 19.75% |     7.99 |
| Malaysia        |    119 |         560 | 21.25% |     8.95 |
| Russia          |    119 |         429 | 27.74% |     6.47 |
| United Kingdom  |    107 |         539 | 19.85% |     9.10 |
| Thailand        |     87 |         422 | 20.62% |     7.95 |
| Germany         |     86 |         392 | 21.94% |     9.49 |
| Italy           |     82 |         335 | 24.48% |     8.48 |

| Device  | Clicks | Impressions |    CTR | Position |
| ------- | -----: | ----------: | -----: | -------: |
| Mobile  |  5,961 |      30,542 | 19.52% |     8.79 |
| Desktop |    279 |       2,726 | 10.23% |     9.61 |
| Tablet  |    102 |         484 | 21.07% |     8.13 |

## Protected search intents

These public routes are the protected ownership map. Quality work must not
change their URLs, canonicals, hreflang, sitemap role, or create word-order
duplicates.

| Intent       | Owner route                    | Primary job                                    |
| ------------ | ------------------------------ | ---------------------------------------------- |
| Homepage     | `/`                            | Free Matcha remover for photo and video        |
| Photo        | `/from-photo`                  | Local single-image workflow                    |
| Video/TikTok | `/from-video`                  | Local frame-by-frame video workflow and export |
| Guide        | `/how-to-remove-matcha-filter` | Step-by-step informational intent              |
| Trend        | `/matcha-filter-trend`         | Meaning, context, and honest recovery boundary |

## Pre-P0 worktree snapshot

Captured before this P0 implementation. `M`, `D`, and `??` retain Git porcelain
meaning. These changes belong to earlier workstreams and must be preserved.

```text
 M messages/en.json
 M messages/zh.json
 D public/imgs/examples/photo-flatlay-after-480.webp
 D public/imgs/examples/photo-flatlay-after.jpg
 D public/imgs/examples/photo-flatlay-after.webp
 D public/imgs/examples/photo-flatlay-before-480.webp
 D public/imgs/examples/photo-flatlay-before.jpg
 D public/imgs/examples/photo-flatlay-before.webp
 M public/imgs/examples/photo-portrait-after-480.webp
 M public/imgs/examples/photo-portrait-after.jpg
 M public/imgs/examples/photo-portrait-after.webp
 M public/imgs/examples/photo-portrait-before-480.webp
 M public/imgs/examples/photo-portrait-before.jpg
 M public/imgs/examples/photo-portrait-before.webp
 D public/imgs/generated/src-flatlay-1786198897120.png
 D public/imgs/generated/src-portrait-1786198893447.png
 M scripts/qa/make-demo-examples.mjs
 M scripts/qa/make-demo-fixtures.mjs
 M scripts/qa/seo-audit.mjs
 M scripts/qa/tool-test.mjs
 M scripts/qa/verify-layout.mjs
 M src/blocks/matcha/examples.tsx
 M src/blocks/matcha/site-chrome.tsx
 M src/components/analytics/google-analytics.tsx
 M src/components/matcha/example-compare.tsx
 M src/components/matcha/matcha-tool.tsx
 M src/components/matcha/media-drop-zone.tsx
 M src/lib/matcha/load-media.ts
 M src/routes/__root.tsx
 M src/routes/admin/route.tsx
 M src/routes/blog/$slug.tsx
 M src/routes/blog/index.tsx
 M src/routes/how-to-remove-matcha-filter.tsx
 M src/routes/matcha-filter-trend.tsx
 M src/routes/pricing.tsx
 M src/routes/robots[.]txt.ts
 M src/routes/settings/route.tsx
 M src/routes/sitemap[.]xml.ts
?? docs/plans/2026-08-16-matcha-restoration-execution-log.md
?? public/imgs/examples/photo-city-after-480.webp
?? public/imgs/examples/photo-city-after-640.webp
?? public/imgs/examples/photo-city-after.jpg
?? public/imgs/examples/photo-city-after.webp
?? public/imgs/examples/photo-city-before-480.webp
?? public/imgs/examples/photo-city-before-640.webp
?? public/imgs/examples/photo-city-before.jpg
?? public/imgs/examples/photo-city-before.webp
?? public/imgs/examples/photo-creator-after-480.webp
?? public/imgs/examples/photo-creator-after-640.webp
?? public/imgs/examples/photo-creator-after.jpg
?? public/imgs/examples/photo-creator-after.webp
?? public/imgs/examples/photo-creator-before-480.webp
?? public/imgs/examples/photo-creator-before-640.webp
?? public/imgs/examples/photo-creator-before.jpg
?? public/imgs/examples/photo-creator-before.webp
?? public/imgs/examples/photo-food-after-480.webp
?? public/imgs/examples/photo-food-after-640.webp
?? public/imgs/examples/photo-food-after.jpg
?? public/imgs/examples/photo-food-after.webp
?? public/imgs/examples/photo-food-before-480.webp
?? public/imgs/examples/photo-food-before-640.webp
?? public/imgs/examples/photo-food-before.jpg
?? public/imgs/examples/photo-food-before.webp
?? public/imgs/examples/photo-friends-after-480.webp
?? public/imgs/examples/photo-friends-after-640.webp
?? public/imgs/examples/photo-friends-after.jpg
?? public/imgs/examples/photo-friends-after.webp
?? public/imgs/examples/photo-friends-before-480.webp
?? public/imgs/examples/photo-friends-before-640.webp
?? public/imgs/examples/photo-friends-before.jpg
?? public/imgs/examples/photo-friends-before.webp
?? public/imgs/examples/photo-portrait-after-640.webp
?? public/imgs/examples/photo-portrait-before-640.webp
?? public/imgs/examples/photo-product-after-480.webp
?? public/imgs/examples/photo-product-after-640.webp
?? public/imgs/examples/photo-product-after.jpg
?? public/imgs/examples/photo-product-after.webp
?? public/imgs/examples/photo-product-before-480.webp
?? public/imgs/examples/photo-product-before-640.webp
?? public/imgs/examples/photo-product-before.jpg
?? public/imgs/examples/photo-product-before.webp
?? scripts/qa/sources/
?? src/blocks/matcha/public-header.tsx
?? src/routes/(auth)/route.tsx
```

## Interpretation limits

- Average position is an impression-weighted average across queries and result
  contexts, not a guaranteed fixed rank.
- Separate query and page CSVs do not reveal query-by-page ownership or
  cannibalisation. Export a page breakdown while filtering a target query.
- Country does not equal language. Philippine traffic alone does not prove that
  a Tagalog page is the largest opportunity.
- No quality claim is inferred from clicks. Product-quality comparison begins
  only after a rights-cleared paired benchmark exists.
