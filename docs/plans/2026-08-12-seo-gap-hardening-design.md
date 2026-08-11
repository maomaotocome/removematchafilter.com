# SEO gap hardening

## Approved objective

Treat the external SEO report as an audit reference rather than a replacement
for the approved growth strategy. Preserve the five-page Matcha topic cluster,
its titles, headings, copy and structured data. Fix only high-confidence
technical gaps that are observable in the repository and production HTML.

The implementation must not target a fixed keyword density, create thin pages
for word-order variants, or invent social proof, trend statistics or video
assets.

## Findings

The production versions of the five core routes already emit unique metadata,
self-referencing canonicals, English and Chinese `hreflang` alternates,
Open Graph metadata and route-appropriate JSON-LD. The sitemap and robots
endpoints are live, and the tool already offers post-export sharing and
TikTok-specific guidance.

Two remaining gaps are worth correcting:

1. The XML sitemap emits only the English URL as a `<loc>` for each localized
   page. A multilingual sitemap should contain a separate `<url>` entry for
   every localized URL, and every entry should list itself and all alternate
   versions.
2. Dormant template, account and private application routes can still inherit
   indexable metadata. In particular, `/pricing`, `/blog`, `/sign-in`,
   `/admin/**` and `/settings/**` are not part of the approved public search
   surface.

## Sitemap design

Keep the existing canonical public path list. For each path, generate one
entry per configured locale. With the current eight paths and two locales,
the sitemap will contain sixteen `<url>` entries.

Every entry will contain:

- A localized `<loc>` for the entry's own locale.
- An `en` alternate.
- A `zh` alternate.
- An `x-default` alternate pointing to the base-locale URL.
- The existing route-appropriate priority and change frequency.

No synthetic `lastmod` value will be added. Dates should only be emitted when
the application has an accurate source of modification time.

## Index-control design

Add route-level robots metadata instead of deleting reusable ShipAny
capabilities:

- `/pricing` and `/blog/**`: `noindex, follow`. These routes remain available
  for later product use, but their current template content must not compete
  with the Matcha topic cluster.
- Authentication, `/admin/**` and `/settings/**`: `noindex, nofollow`. These are
  utility/private application surfaces, not search landing pages.

Apply the metadata at route-group or layout boundaries where possible so new
child pages inherit the correct policy. Keep `/api/` disallowed in robots.txt.
Remove the `/admin` and `/settings` crawl disallows so compliant crawlers can
fetch those HTML pages and observe their `noindex` directives. Authentication
and authorization remain application responsibilities; robots.txt is not a
security boundary.

The eight canonical public paths remain indexable and unchanged.

## Verification

Extend the server-rendered SEO audit to verify:

- A separate sitemap `<url>` exists for every English and Chinese canonical.
- Each localized entry contains reciprocal `en`, `zh` and `x-default`
  alternates.
- Public core pages do not emit `noindex`.
- Pricing, blog, authentication, admin and settings routes emit the intended
  robots metadata.
- Robots.txt continues to block `/api/` and no longer prevents crawlers from
  reading the admin/settings `noindex` metadata.

Run formatting checks for touched files, `pnpm build`, the local production
server, and the SEO audit. Do not deploy or modify Google Search Console,
Cloudflare Crawler Hints, social accounts or backlinks in this change.
