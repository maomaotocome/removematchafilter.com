# Brand, search appearance, and quality hardening

Date: 2026-08-22
Status: Approved for implementation after the user selected visual direction A

## Goal

Make the site identity reliable across Google Search, browsers, iOS home-screen
bookmarks, and the public header while preserving the existing editorial photo
lab aesthetic. Address the verified search-snippet, accessibility, performance,
and response-header gaps found during the same production audit.

No database, authentication, payment, or user-media flow changes are included.
Production deployment remains a separate, explicitly confirmed step.

## Brand mark

The selected mark is a compact before/after comparison symbol:

- an ink-black rounded-square field matching the current primary color;
- a muted matcha-green left half and warm-cream right half;
- a high-contrast vertical comparison rail and circular handle;
- geometry built from SVG paths and shapes, with no runtime font dependency;
- enough internal spacing and contrast to remain legible at 16 px.

The mark appears beside the existing serif site name in the public header. The
wordmark, typography, neutral palette, and product name remain unchanged.

## Icon assets and metadata

The source mark will produce stable browser assets:

- `favicon.svg` as the scalable source;
- `favicon.ico` with conventional small icon sizes;
- a 96 px PNG favicon;
- a 180 px Apple Touch Icon;
- 192 px and 512 px web-app icons;
- a minimal web manifest using the existing app name and colors;
- a 512 px PNG organization logo for structured data.

The document head will link the stable icon, Apple icon, and manifest URLs. The
organization schema will use the crawlable PNG logo. `WebSite` structured data
will retain `Remove Matcha Filter` as the preferred name and add the lowercase
domain as a fallback `alternateName`.

## Search snippet behavior

The homepage is an evergreen tool, not an article. Its `WebPage` node will omit
article-like publication and modification dates. The visible provenance panel
will keep the honest review information but its date line will be excluded from
search snippets. Article and guide dates remain unchanged.

This does not promise that Google will immediately change the displayed icon,
site name, or snippet. After deployment, the homepage should be requested once
through Search Console URL Inspection and then allowed time to be reprocessed.

## Accessibility

The file drop zone will derive its accessible name from visible title and CTA
text through `aria-labelledby`. Descriptive and privacy copy will remain in
`aria-describedby`. Keyboard activation, disabled state, drag-and-drop, and the
hidden file input remain unchanged.

## Performance

The first comparison pair will gain an intermediate responsive image candidate
suited to high-density mobile screens. Existing lazy loading and explicit image
dimensions stay in place. Image generation scripts and asset references will
stay reproducible so the demo provenance remains accurate.

Server response time will be measured during verification, but application data
flow will not be changed without a separate profile proving where time is spent.

## Response security

The Worker will add conservative headers that do not change product behavior:

- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- a Permissions Policy disabling unused camera, microphone, geolocation, and
  payment capabilities;
- frame embedding protection;
- HSTS only after confirming every in-scope hostname is HTTPS-safe.

A full Content Security Policy is intentionally deferred until all analytics,
auth, and Cloudflare script origins have been enumerated and tested.

Cloudflare's managed `Content-Signal` robots directive is an account-level
choice and remains unchanged. It does not block Googlebot; the Lighthouse
unknown-directive warning will be documented rather than hidden in application
code.

## Failure handling and rollback

- Missing raster icon generation blocks completion; SVG-only output is not
  considered sufficient.
- If the new mark is unreadable at 16 px, revert to the approved geometry and
  simplify details before shipping rather than adding more visual elements.
- If a response header blocks analytics, auth, media processing, or downloads,
  remove that header and rerun the affected flow before deployment.
- Existing image assets are not deleted until every new responsive reference is
  verified.

## Verification

- inspect all generated icon files at native and enlarged sizes;
- confirm icon, Apple icon, manifest, PNG logo, and OG image return correct MIME
  types in a production-equivalent build;
- verify rendered English and Chinese head metadata and JSON-LD;
- run TypeScript, production build, bilingual SEO QA, tool QA, theme QA, and
  responsive layout QA;
- rerun mobile Lighthouse and compare LCP, transfer size, accessibility, and SEO
  findings against the 2026-08-22 baseline;
- run the project security scan before any commit or deployment;
- deploy only after a separate explicit production confirmation.
