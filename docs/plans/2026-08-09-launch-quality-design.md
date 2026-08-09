# Remove Matcha Filter launch quality design

## Approved direction

Keep the existing warm editorial identity and make a focused, conversion-first
launch pass. Do not replace the interface with a new visual system. The launch
must feel distinctive while keeping the browser-local tool, honest product
boundary, and search intent immediately clear.

## First-screen experience

- The brand must read `Remove Matcha Filter` in every environment.
- At 390x844 and 1440x900, the real file chooser must be visible without
  scrolling.
- Keep one H1, one concise promise, and one local-processing trust signal.
- Compact the empty tool state rather than hiding capability or trust copy.

## Evidence and information order

- Put reproducible before/after proof immediately after the working tool.
- Keep the current AI-source disclosure and never present the examples as
  customer results.
- Regenerate the example fixtures without periodic grain artifacts and export
  raw canvas pixels rather than screenshots of rounded UI containers.
- Use the safe default preset for both examples; avoid a deliberately extreme
  result that looks less natural than the source.
- Move explanatory and keyword-supporting prose below proof, followed by the
  workflow, route-specific guidance, FAQ, related links, and trust content.

## Interaction and accessibility

- Preserve native range controls and keyboard behavior.
- Give comparison controls a 44px interaction area and a unique accessible
  name that includes the example title.
- Keep visible focus states, reduced-motion behavior, sufficient contrast, and
  no horizontal overflow across the launch routes.

## Video quality gate

- A source clip with audio must export with audible audio on the same timeline
  as the video.
- Seek completion, recording start, playback start, and recorder stop must be
  explicitly coordinated rather than timing-dependent.
- If synchronized audio cannot pass repeatable real-browser QA, the video
  export promise and `/from-video` route are not eligible for launch.

## Search and production acceptance

- Preserve the approved titles, descriptions, H1s, canonicals, sitemap, robots,
  structured data, and internal links from `docs/launch-brief.md`.
- Run the complete responsive, theme, SEO, performance, and security launch
  audit; fix all blocking findings.
- Require production build, functional tool QA, launch checks, and security
  scan to pass before Cloudflare deployment.
- Deploy only to `https://removematchafilter.com` through the repository's
  Cloudflare workflow, then repeat photo/video, network, canonical, sitemap,
  and console checks against production.

Google top-five placement is a strategic target, not a deployment guarantee.
The launch establishes the technical and on-page foundation; continued ranking
work will require indexing, content depth, authority, backlinks, and measured
user behavior after release.
