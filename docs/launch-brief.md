# RemoveMatchaFilter.com Launch Brief

> This file is the single product and acceptance source for the P0 launch.
> Target location in the ShipAny repository: `docs/launch-brief.md`
> Last updated: 2026-08-08

## 1. Product

- **Name:** Remove Matcha Filter
- **Production domain:** `https://removematchafilter.com`
- **Primary search language:** English, with complete Chinese versions of all
  core SEO pages through the existing locale routing
- **Stack:** the current ShipAny TanStack repository
- **Deployment target:** Cloudflare Workers through the repository's `/deploy-cloudflare` skill

### Value proposition

Reduce the Matcha filter look in photos and videos directly in the browser, with adjustable color, noise and detail controls.

### Core user job

A visitor can choose a photo or video without signing in, adjust the visible Matcha filter look, preview the result and export a more natural-looking version.

### Honest product boundary

The tool can adjust existing color, noise, detail and visual intensity. It cannot recover pixels or information already destroyed, replaced or hidden by the original filter.

- Search-facing copy may use the phrase `remove matcha filter` because that is how users search.
- Product claims must use accurate language such as `reduce`, `adjust` and `make it look more natural`.
- Never claim `100% restore`, `recover the original pixels`, `reveal hidden content` or equivalent capabilities.

## 2. Reference boundaries

Public references:

- `https://matchafilter.app/remove/` — reference only its tool-first, immediately usable information hierarchy.
- `https://matchafilter.app/remove-filter-from-video/` — reference only its hierarchy for explaining a video workflow.

Allowed:

- Learn from public information hierarchy, interaction patterns and responsive behavior.
- Create an original visual direction and original English copy.

Forbidden:

- Copying the reference brand, logo, trademark, copy, reviews, examples, images, videos, CSS or other protected assets.
- Presenting scraped or generated material as genuine user results.

## 3. P0 routes and search intent

| Route | Primary query | Page responsibility | Default tool mode |
|---|---|---|---|
| `/` | `remove matcha filter` | Main tool; covers photo and video | Photo and Video entry points |
| `/from-video` | `remove matcha filter from video` | Video workflow, limitations, compatibility and export | Video |
| `/from-photo` | `remove matcha filter from photo` | Photo workflow, comparison, formats and download | Photo |
| `/matcha-filter-trend` | `matcha filter trend` | Explain the trend, visual layers and recovery boundary | None |
| `/how-to-remove-matcha-filter` | `how to remove matcha filter` | Complete task-oriented photo and video guide | None |
| `/privacy-policy` | Trust/legal | Explain real file, analytics and cookie behavior | None |
| `/terms-of-service` | Trust/legal | Usage rules, limitations and user responsibility | None |
| `/contact` | Trust | Real support and feedback route | None |

The homepage must naturally cover relevant wording such as:

- `matcha filter remover`
- `filter remover matcha`
- `matcha remover`
- `remover matcha filter`

Do not create separate P0 pages for those word-order variants. Also do not create `/free/`, `/online/`, `/matcha-filter-remover/`, `/remover-matcha-filter/` or `/filter-remover-matcha/`.

## 4. Shared tool

All three public tool pages must reuse one core tool implementation. Do not copy the component or processing logic per route.

### Required P0 functions

- File chooser and drag-and-drop.
- Photo and Video modes.
- One safe default adjustment preset.
- User-facing Color, Noise and Detail controls.
- Original/result preview or comparison.
- Reset.
- Export/Download.
- Preserve the source audio track when an input video contains audio.
- Clear local-processing message.
- Real loading, processing, success, error and unsupported states.

### Processing and privacy

- Media must be processed locally in the visitor's browser by default.
- Photos and videos must not be uploaded to this site, analytics vendors or third-party processing APIs.
- Non-media anonymous product events are allowed only if they contain no filenames, media, user content or identifying information and are disclosed in the Privacy Policy.
- Production QA must verify network behavior after choosing and exporting real media.

### Implementation constraints

- Follow the current repository's components, dependencies and patterns before choosing libraries or file locations.
- Prefer appropriate browser-native Canvas/WebGL and media capabilities.
- Feature-detect video export and show a useful unsupported state instead of failing silently.
- Select the recording container and codecs from actual capability checks such as `MediaRecorder.isTypeSupported()`; name the export from the recorder's real media type.
- A silent export from a video that contains audio is not a completed P0 video result. If audio preservation cannot be implemented reliably, remove the video-export promise and video page from P0 instead of shipping a degraded result as complete.
- Do not advertise formats, browsers, file sizes or duration limits until they have passed QA.
- Do not add a server media queue, custom database schema or backend module for P0.

## 5. Page SEO

### Homepage

- **Title:** `Remove Matcha Filter Online – Free Photo & Video Tool`
- **H1:** `Remove Matcha Filter from Photos and Videos`
- **Description:** `Reduce the Matcha filter effect in your browser. Adjust color, noise and detail, preview the result, and export—no upload required.`
- **Canonical:** `https://removematchafilter.com/`

### Video page

- **Title:** `Remove Matcha Filter from Video Online – Free Tool`
- **H1:** `Remove Matcha Filter from a Video`
- **Description:** `Adjust the Matcha filter look in a video locally in your browser. Preview color, noise and detail changes, then export your result.`
- **Canonical:** `https://removematchafilter.com/from-video`

### Photo page

- **Title:** `Remove Matcha Filter from Photo Online – Free Tool`
- **H1:** `Remove Matcha Filter from a Photo`
- **Description:** `Reduce the Matcha filter look in a photo for free. Adjust color, noise and detail in your browser, compare the result, and download it.`
- **Canonical:** `https://removematchafilter.com/from-photo`

### SEO implementation requirements

- Each tool page needs unique, intent-specific server-rendered copy.
- Each indexable page needs an accurate title, description, H1 and self-referencing canonical.
- Each public page needs route-correct English, Chinese and `x-default`
  `hreflang` alternates; an alternate must never point to a different page's
  topic.
- Each canonical must be the final non-redirecting URL returned by the current router. Do not force trailing slashes when the repository redirects them away.
- Use the current repository's metadata, sitemap, robots, Open Graph, i18n and file-route patterns.
- The three tool pages must link to each other with useful anchor text.
- Do not target a fixed word count or keyword density.
- Do not promise FAQ or HowTo rich results.
- Do not publish blank, placeholder or English-copy locale pages. Every new
  core SEO route must ship in English and Chinese together.

## 6. Page structure

Each tool page should use the same lightweight structure while keeping its main content specific to the page intent:

1. Header.
2. Hero with an accurate promise, primary CTA and local-processing message.
3. Shared filter remover tool.
4. Honest capability and limitation note.
5. Three-step workflow.
6. Two or three owned, safe and reproducible examples.
7. Photo- or video-specific explanation.
8. User-focused FAQ.
9. Related page links.
10. Footer.

The tool and primary CTA must be visible without a decorative hero image pushing them below the first screen.

## 7. Safety and trust

- Examples must use owned or clearly licensed media and must be generated by the current product version.
- Do not scrape TikTok, competitors or unknown users for examples.
- Do not imply the product can remove clothing, censorship, privacy protection or reveal hidden content.
- Terms must prohibit privacy violations, non-consensual sexual content, harassment and illegal use.
- Privacy, Terms and Contact must describe the real implementation and real contact channel; do not invent company details, addresses or response times.
- `VITE_CONTACT_EMAIL` must contain a real, working inbox before deployment. A visible “not configured” state is acceptable during development but is a release blocker.

## 8. Explicitly out of P0

- Login and registration in the public user flow.
- Pricing, payment and credits.
- Custom database work.
- User history or saved projects.
- UGC or a public gallery.
- Server-side media processing.
- AI filter detection.
- Batch or programmatic SEO pages.
- A separate Dashboard.
- Decorative AI images that block launch.

Do not delete ShipAny's existing reusable SaaS capabilities. Leave unused capabilities disconnected from the P0 user journey.

## 9. Repository and skill rules

- ShipAny Agent Skills are the primary development interface.
- Before implementation, read the current repository's `AGENTS.md`, `CLAUDE.md`, `.claude/skills/quick-start/SKILL.md` and relevant existing code.
- This is TanStack Start. Do not introduce Next.js App Router, `next/*`, React Server Components or `next-intl` patterns.
- Use `/quick-start` once with this Launch Brief.
- Do not run `/clone-website` after `/quick-start` unless a later, explicitly approved pixel-level UI replacement requires it.
- Do not use `/new-page` for public SEO routes; it is for Dashboard pages.
- Use `/new-static-page` only to add missing static trust pages.
- Do not use `/new-module` for the browser-local P0 tool.
- Run `/security-scan` before each commit and before deployment.
- Deploy through `/deploy-cloudflare --domain=removematchafilter.com` only after QA and security review.
- Before the first push, verify that Git `origin` points to the project's own repository and not `shipany-ai/shipany-tanstack`. Never invent or guess the replacement remote URL.

If this file conflicts with current repository instructions, follow the current repository and skill instructions, document the conflict and preserve the product intent.

## 10. Acceptance criteria

The P0 is complete only when all items pass:

- [ ] `/quick-start` has been run once and its baseline build succeeds.
- [ ] One shared tool serves all three tool pages.
- [ ] Photo selection, adjustment, preview, reset and export work in target browsers.
- [ ] Video selection, adjustment, preview, reset and export work in the declared target browsers.
- [ ] A source video with audio exports with an audible, synchronized audio track.
- [ ] Unsupported and error states explain the next action.
- [ ] Page content and browser claims match tested behavior.
- [ ] No user media is uploaded, verified through browser network inspection.
- [ ] All three tool pages have unique intent content and correct metadata/canonical.
- [ ] The trend and how-to pages have complete English and Chinese content,
      correct metadata/canonical/hreflang and matching visible/structured data.
- [ ] Privacy, Terms and Contact exist and reflect real behavior.
- [ ] `VITE_CONTACT_EMAIL` resolves to a real monitored inbox; no placeholder contact notice remains in production.
- [ ] Mobile layout has no blocking overflow and the core action is usable.
- [ ] Production build passes.
- [ ] Canonicals resolve directly without 301/307 redirects.
- [ ] Git `origin` points to the project's repository.
- [ ] `/security-scan` has no blocking issues.
- [ ] Production deployment completes through `/deploy-cloudflare`.
- [ ] The production domain passes a real photo and video end-to-end test.
- [ ] Sitemap is submitted to Google Search Console.
