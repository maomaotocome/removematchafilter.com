# Remove Matcha Filter SEO growth upgrade

## Approved objective

Win the English Google results for `remove matcha filter` while building a
useful, bilingual topic cluster that also serves Chinese visitors. The site
must remain tool-first, fast, honest about what its deterministic correction
can and cannot recover, and clearly differentiated from paid AI reconstruction
tools.

This plan supersedes the launch brief where the newly approved SEO direction
conflicts with the original P0 copy lock. In particular, the homepage H1 will
use the contiguous phrase `Remove Matcha Filter`, and content quality will be
judged by search-intent coverage rather than by a fixed word-count target.

## Recommended direction

Use a focused on-site ranking sprint rather than publishing a broad set of
thin long-tail pages. Strengthen the three existing tool pages, add two durable
learning pages, and connect them through useful contextual links and post-export
actions.

The public cluster will be:

- `/` — primary tool and mixed photo/video intent.
- `/from-photo` — photo-specific workflow, formats, tuning and limitations.
- `/from-video` — video-specific workflow, compatibility, audio and export.
- `/matcha-filter-trend` — plain-language explanation of the visual trend and
  why people try to reduce it.
- `/how-to-remove-matcha-filter` — complete task-oriented tutorial for photos
  and videos.

Every route will have a Chinese version through the existing `/zh` locale
rewrite. English remains the default locale and primary ranking target.

## Homepage and tool experience

- Change the H1 to `Remove Matcha Filter from Photos and Videos` so the primary
  query appears intact at the beginning.
- Strengthen the first-screen differentiation with accurate trust points:
  free, no account or credits, and local browser processing.
- Replace the disconnected capability/limitation prose with a scannable
  recovery-boundary table explaining what can usually be reduced, what varies,
  and what cannot be restored.
- Add a compact trend explainer below the working tool and proof, without
  displacing the tool from the first screen.
- Add a TikTok-specific FAQ while keeping the answer neutral and safety-aware.
- Expand the photo/video comparison only where the information helps users
  choose the correct workflow.
- After export, offer useful next actions: open the full guide, switch media
  type, and share or copy the tool link. Sharing the page never shares or
  uploads the visitor's media.

## New core pages

### Matcha Filter trend page

Explain what the look is, how its visible layers affect a file, why the term is
being searched, whether it is an official platform effect, the difference
between correction and reconstruction, and how to use the local tool. Avoid
unverifiable popularity counts, sensational language and copied competitor
phrasing.

### How-to page

Provide a complete workflow: choose the right source, load it locally, correct
colour first, reduce added texture carefully, restore detail last, compare,
export, and troubleshoot common photo/video issues. It will link directly to
the matching tool mode and state the recovery boundary before users begin.

## Technical SEO

- Emit self-referencing canonical links and route-correct `hreflang` alternates
  for English, Chinese and `x-default` on every public page.
- Add unique titles, descriptions and social metadata for the two new routes.
- Add visible breadcrumbs and matching BreadcrumbList data.
- Add honest Article and HowTo structured data only where the visible content
  supports it; keep FAQ data synchronized with the rendered questions.
- Add both new routes to navigation, footer, sitemap and the site's machine-
  readable content summaries.
- Remove the blanket query-string robots block so campaign URLs can be crawled
  and their canonical tags observed; continue blocking admin, settings and API
  surfaces.
- Update the SEO QA script so it validates the approved H1s, new pages,
  localized alternates and page-to-page links instead of enforcing the old
  launch copy.

## Content and trust rules

- Use natural English first and a native-quality Chinese translation, not
  literal word-for-word duplication.
- Do not force awkward keyword variants or target keyword density.
- Do not claim to recover original pixels, reveal hidden/censored content, or
  reconstruct a person or background.
- Do not invent trend statistics, customer counts, reviews, publication
  history, endorsements or platform affiliation.
- Reuse the site's owned before/after examples; do not scrape social posts or
  competitor media.

## Verification

- Production build and strict TypeScript compilation through `pnpm build`.
- Server-rendered SEO audit for all five public routes in English and Chinese.
- Inspect canonical, alternates, title, description, headings, internal links
  and parseable JSON-LD in delivered HTML.
- Verify sitemap and robots responses.
- Exercise photo and video tool flows, including the new post-export actions.
- Check 390px, 768px and 1440px layouts and both light/dark themes.
- Run the project security scan against the complete diff before any commit.

Rankings are a strategic target, not a guaranteed result. Indexing, backlinks,
content freshness and measured visitor behaviour remain ongoing off-site work
after this on-site foundation ships.
