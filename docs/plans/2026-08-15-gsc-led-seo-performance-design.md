# GSC-led SEO and mobile performance optimization

**Date:** 2026-08-15
**Status:** Approved

## Goal

Grow qualified organic traffic while protecting the five-page search cluster
that is already ranking. The work prioritizes two proven opportunities from
Search Console: the `matcha filter remover` wording family and video removal
intent. Because 94% of clicks are mobile, the same release also removes the
highest-confidence mobile loading and runtime bottlenecks.

## Evidence baseline

- 6,342 clicks and 33,752 impressions across the available six-day chart.
- The visible `remover` query family has more impressions than the equivalent
  `remove` family while ranking slightly lower.
- `/from-video` has strong CTR but an average position just outside page one.
- `/matcha-filter-trend` has high impressions, low CTR, and mixed tool versus
  informational intent.
- The Philippines supplies roughly half of traffic, but explicitly Tagalog
  queries are still a small test-sized segment of visible queries.
- Mobile Lighthouse isolation tests identify third-party analytics and public
  SaaS/auth dependencies as the largest initial-load opportunity. The tool
  also keeps rendering video frames after playback has paused.

## Search architecture

Keep the approved public cluster:

- `/` — broad photo/video tool and `remove` + `remover` wording.
- `/from-photo` — photo, image, picture, and screenshot intent.
- `/from-video` — video and TikTok removal intent.
- `/how-to-remove-matcha-filter` — instructional workflow.
- `/matcha-filter-trend` — trend meaning, appearance, and recovery limits.

Do not create pages for word-order variations, `effect remover`, TikTok word
order, adult terms, or photo/image synonyms. Those expressions share an
existing page's intent and would create thin content or cannibalization.

## On-page changes

### Homepage

- Keep the current title and URL stable in this first iteration.
- Lead the H1 with `Free Matcha Filter Remover` while the subhead preserves the
  existing `Remove Matcha Filter` phrasing.
- Use `matcha effect`, `free`, and `remover` naturally in explanatory copy and
  FAQ text; do not set or measure keyword density.

### Video page

- Keep the current title and URL stable.
- Lead the H1 with `Free Matcha Filter Remover for Video`.
- Turn the existing TikTok section into the exact how-to wording users employ
  while keeping the permission, compression, and recovery-boundary guidance.

### Photo page

- Preserve title, H1, URL, and page structure because the photo query family is
  already ranking well.
- Add at most one natural `remover for photos` reference if the final copy pass
  finds it useful.

### Guide page

- Preserve title and H1.
- Move the photo/video tool choices near the top so the page satisfies users
  who want to act immediately and gives both tool pages early descriptive
  internal links.
- Do not add a Tagalog block until native-language review is available.

### Trend page

- Separate informational intent from the tool homepage: focus title/H1 on
  meaning, appearance, and recovery limits.
- Add an explicit `without the filter` section that answers the visible query
  without claiming hidden or replaced pixels can be recovered.
- Keep the existing safety boundary; do not expand adult-query content.

## Mobile performance changes

Implement in measured priority order:

1. Load Google Analytics after the page load/idle window instead of competing
   with the first render. Cloudflare's separately injected analytics beacon is
   a deployment-dashboard follow-up, not a code assumption.
2. Avoid loading Google One Tap and account-menu dependencies on the public
   Matcha pages unless the feature is enabled and needed.
3. Decode uploaded images asynchronously.
4. Redraw video only for new video frames and stop work while paused, ended,
   hidden, or unmounted; draw a single frame after seeking or parameter changes.
5. Make the visible drop zone a complete keyboard- and touch-accessible file
   target and bring small mobile controls to a 44px target where practical.

Do not lazy-load the above-the-fold tool itself. It is the page's primary action
and its own compressed chunk is not the measured bottleneck.

## Technical SEO integration

Ship the already prepared high-confidence hardening with this change:

- one sitemap `<url>` per localized URL, with reciprocal `en`, `zh`, and
  `x-default` alternates;
- route-level `noindex` for template, auth, admin, and settings surfaces;
- allow crawlers to fetch those pages so they can observe `noindex`;
- keep `/api/` disallowed.

Do not add another HTTP-to-HTTPS rule. Live requests already receive a
permanent HTTPS redirect. A future Cloudflare task may add `www` DNS plus a
single redirect to the apex domain.

## Verification

- Run the production build.
- Run launch checks and the local SEO audit against the production build.
- Verify the five English and five Chinese core pages have unique metadata,
  self-canonicals, reciprocal hreflang, valid JSON-LD, and no `noindex`.
- Verify sitemap entry count and route-level index controls.
- Run photo/video tool QA, including video pause, seek, resume, export, audio,
  and tab-visibility behavior.
- Run mobile layout/touch checks on short and standard phone viewports.
- Run the security scan over the final worktree.
- Compare post-deploy Search Console over two complete seven-day windows;
  export query-by-page data for the main, video, guide, and trend queries before
  making a second-round title change or adding a Tagalog locale.

## Success criteria

- No new thin pages or misleading product claims.
- Existing photo and `remove matcha filter` coverage remains intact.
- Homepage and video page clearly cover the proven `remover` wording.
- Trend and guide pages have cleaner intent ownership and stronger internal
  paths to the tools.
- Mobile first-render resources and idle GPU work are measurably reduced with
  no functional regression.
- Build, SEO, launch, tool, layout, and security checks pass.
