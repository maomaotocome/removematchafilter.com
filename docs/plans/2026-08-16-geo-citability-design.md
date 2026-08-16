# GEO citability and provenance design

- **Date:** 2026-08-16
- **Site:** `https://removematchafilter.com/`
- **Primary market:** English Google and generative search
- **Localization:** New core content ships in English and Chinese together
- **Public author:** Matcha Filter Remover Team
- **Maintainer:** Jared

## Objective

Close the truthful gaps in the supplied GEO audit without adding unsupported
claims, fabricated authority, or schema that is not represented in visible page
content. Preserve the existing five-page search-intent cluster and add one
distinct trust page, `/about`, rather than creating keyword-variant pages.

## Chosen approach

Use a complete, visible provenance layer:

1. Add a homepage Sources & methodology section with an answer-first summary,
   visible authorship and review dates, exact product limits derived from the
   shipped code, and primary technical sources.
2. Add `WebPage`, editorial-team, and maintainer nodes to homepage JSON-LD.
   Keep the existing Organization, WebSite, WebApplication, and FAQPage nodes.
3. Add the official GitHub repository as the brand's truthful `sameAs` link and
   code repository. Do not invent social, Wikipedia, or Wikidata profiles.
4. Publish a bilingual `/about` page covering ownership, product boundaries,
   testing method, editorial policy, sources, GitHub, and contact.
5. Surface About in the localized footer, sitemap, `llms.txt`, and
   `llms-full.txt`.

Two lighter alternatives were rejected:

- **Schema-only patch:** fast, but structured data would not be backed by
  visible content and would not solve the citation failure.
- **Citation-only patch:** improves extractability, but leaves author, entity,
  freshness, and About signals incomplete.

## Source and claim policy

- W3C File API supports the explanation of browser object URLs.
- Khronos WebGL specifications identify the rendering API used by the tool.
- W3C MediaStream Recording specifies the `MediaRecorder` API used for video
  export.
- Product limits come from shipped constants: 25 MB photos, 200 MB videos,
  4096 px photo long edge, and 1920 px video long edge.
- External specifications explain browser capabilities; they do not prove that
  this product can recover destroyed pixels or guarantee a particular result.
- Do not repeat the audit extension's `+115%` or `+40%` claims because the
  supplied report does not provide their underlying study or methodology.

## Entity and schema model

- `Organization`: the Remove Matcha Filter brand and publisher.
- `Organization #editorial-team`: Matcha Filter Remover Team, the public author.
- `Person #jared`: Jared, the named maintainer and team member.
- `WebPage`: localized homepage URL, publication/review dates, author, editor,
  publisher, WebSite membership, and WebApplication subject.
- `AboutPage`: localized `/about` URL with the same truthful publisher,
  author, maintainer, and dates.

All JSON-LD names, dates, authorship, and relationships must also be visible on
the relevant page. The homepage remains a `WebPage`, not an `Article` added only
to trigger a validator.

## Content placement

Place Sources & methodology after the privacy explanation and before the FAQ.
This keeps the primary tool and existing search-intent content first while
putting evidence next to the technical claims it supports.

The section will expose:

- Published by Matcha Filter Remover Team.
- Maintained by Jared.
- Published 2026-08-08 and reviewed 2026-08-16.
- Four current processing limits.
- Primary-source links plus the official GitHub implementation link.

## Verification

- `pnpm build`
- Local SSR inspection for English and Chinese homepage/About HTML
- JSON-LD parse and type/field assertions
- Canonical and reciprocal hreflang checks
- Sitemap and llms discovery checks
- Project SEO QA and launch checks
- Security scan before each commit

Cloudflare deployment remains a separate final action and still requires the
explicit deploy confirmation mandated by the deployment workflow.
