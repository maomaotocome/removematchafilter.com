# Trends- and GSC-led SEO cluster expansion

**Date:** 2026-08-22
**Status:** Approved

## Objective

Increase qualified English Google traffic and improve the probability of
reaching the top five without sacrificing the `remover`, generic video, photo,
or homepage rankings already producing clicks. Chinese public-page parity,
honest recovery limits, browser-local processing claims, and the proof-first
homepage structure remain hard requirements.

Rankings are a target, not a guarantee. Google Trends is a relative demand
signal, while Search Console records the site's observed search performance;
neither is treated as a forecast by itself.

## Evidence and interpretation

- Preserve the established `remover` and video demand because the current GSC
  export shows materially more visible clicks for those families than for the
  `how to` family.
- Expand `how to` and TikTok coverage because the weekly Trends export shows
  rising relative interest and GSC already shows TikTok variants ranking with
  lower CTR than the strongest generic video terms.
- Treat CapCut as an experimental adjacent intent. The page must solve a
  source-project decision that the existing video page does not solve; it must
  not be a word-order variant.
- Do not use a fixed keyword-density target, copied paragraphs, invented search
  volumes, ranking guarantees, or unsupported backlink estimates.

## Search architecture

The public cluster expands from five to seven routes:

- `/` — broad photo/video tool and the proven `remove` + `remover` intent.
- `/from-photo` — photo, image, picture, and screenshot workflow.
- `/from-video` — generic exported-video workflow and video remover intent.
- `/how-to-remove-matcha-filter` — cross-format instructional workflow.
- `/matcha-filter-trend` — meaning, visible appearance, and recovery limits.
- `/remove-matcha-filter-tiktok` — TikTok-specific ownership, source quality,
  compression, video processing, audio, and export workflow.
- `/remove-matcha-filter-capcut` — source-project-first CapCut workflow that
  distinguishes an editable filter/effect from a baked exported file.

Every route has English and Chinese output through Paraglide. The two platform
routes receive self-canonicals, reciprocal `en`, `zh`, and `x-default`
alternates, sitemap entries, breadcrumbs, matching visible and structured
content, and machine-readable summary entries.

The header remains focused on the five core destinations. Platform pages are
linked from the footer and from contextually relevant homepage, video, guide,
trend, and platform-page sections.

## Existing-page changes

### Homepage

- Preserve URL, title, H1, canonical, tool-first layout, and the generator ->
  compact Before/After proof order.
- Add a prominent but compact guide path after proof or the recovery boundary.
- Add platform learning cards without moving explanatory content above the
  working tool or proof.

### Video page

- Preserve URL, title, and H1.
- Keep generic video ownership and add `TikTok` naturally to the meta
  description.
- Give the existing TikTok section a stable anchor and a contextual link to the
  full TikTok workflow.
- Add a CapCut decision link without turning the generic page into a CapCut
  tutorial.

### How-to page

- Preserve URL, title, H1, and the existing visible five-step guide and HowTo
  data.
- Add a platform decision section linking to TikTok, CapCut, photo, and video
  workflows.

### Trend page

- Preserve URL and H1.
- Test the title `Matcha Filter Trend: What It Is & How to Reduce It` to better
  express the page's informational and correction value.
- Keep the visible recovery boundary and add contextual paths to the platform
  and tool pages.

### Photo page

- Preserve core URL, title, H1, metadata, and content ownership.
- Accept only link changes required to keep the cluster connected.

## TikTok page

Proposed metadata:

- Title: `How to Remove Matcha Filter on TikTok – Free Video Tool`
- H1: `How to Remove the Matcha Filter from a TikTok Video`

The page opens with the real video tool in video mode, followed by:

1. a concise answer and the source/permission boundary;
2. why the highest-quality owned copy matters;
3. TikTok/social-download compression and caption-edge limitations;
4. upload, colour, noise, detail, comparison, audio, and export workflow;
5. the difference between reducing a visible grade and restoring replaced
   pixels;
6. troubleshooting and a TikTok-specific FAQ;
7. links to the generic video, CapCut, guide, and trend pages.

The site does not connect to TikTok, scrape a URL, download platform content,
or claim platform affiliation.

## CapCut page

Proposed metadata:

- Title: `How to Remove Matcha Filter in CapCut – Source-First Guide`
- H1: `How to Remove the Matcha Filter in CapCut`

The page starts with a two-path decision:

1. If an editable project remains, use CapCut to reduce/clear the filter or
   remove the relevant effect track before exporting again.
2. If only a baked export remains, use this site's video correction workflow
   to reduce surviving green cast, grain, and contrast changes.

The copy distinguishes filters, effects, and rendered exports; avoids brittle
button-position promises; cites current official CapCut guidance; includes a
clear independent/non-affiliation statement; and links to the browser-local
video tool rather than implying control over CapCut.

## Structured data and metadata

- Keep JSON-LD synchronized with visible content.
- Use BreadcrumbList and FAQPage on both platform pages.
- Use Article for guide-style platform content and WebApplication only where
  the working tool is visibly present.
- Keep HowTo on the existing guide for semantic completeness, without claiming
  a Google rich-result benefit.
- Give every new public route unique English and Chinese metadata.
- Extend sitemap, `llms.txt`, `llms-full.txt`, footer links, and SEO QA coverage.

## Performance and accessibility

- Keep the homepage's initial route and tool bundle unchanged except for small
  static link content.
- Route-split platform content. Reuse existing components instead of adding a
  new UI framework or dependency.
- Maintain one H1, a logical heading hierarchy, keyboard-operable links and
  controls, 44px practical touch targets, responsive text, and no horizontal
  overflow at 390px, 768px, or 1440px.
- Preserve truthful local-processing and media-permission copy in both locales.

## Verification

The implementation is complete only when all of the following pass:

- `pnpm build`;
- SSR SEO checks for seven English and seven Chinese routes;
- unique title/description, one H1, canonical and reciprocal hreflang checks;
- sitemap, robots, JSON-LD parsing, and internal-link checks;
- photo/video tool regression checks, including the TikTok page's video tool;
- 390px, 768px, and 1440px layout checks and light/dark checks;
- final security scan with no HIGH findings.

Regression assertions must lock the homepage, photo, video, and guide ranking
signals called out above. New pages must not copy long blocks from existing
routes or add homepage-critical JavaScript.

## Measurement and rollback

Review complete 7-, 14-, and 28-day GSC windows for TikTok, CapCut, how-to,
trend, homepage remover, and generic video query groups, including the landing
page dimension.

- If homepage or generic video performance declines by more than 15% across two
  comparable complete seven-day windows without a matching market decline,
  revert the associated metadata/internal-link change.
- If the TikTok page causes clear query-page rotation and lower combined
  clicks, merge its unique content into `/from-video` and 301 the route.
- If CapCut still lacks meaningful independent demand after 28 days, merge its
  useful source-project guidance into the video guide and 301 the route.

No database, authentication, payment, media-processing algorithm, or existing
public URL is changed by this SEO release.

## Release boundary

Implementation, build, SEO, functional, layout, theme, and security validation
produce a release-ready worktree. Production deployment remains a separate
explicit-confirmation step because the current worktree contains many existing
uncommitted changes.
