# Evidence-led example gallery design

Date: 2026-08-15
Status: Approved direction A, refined with GSC and live competitor evidence

## Objective

Strengthen the site's visual proof without slowing the tool or making claims the
product cannot support. The gallery should help searchers quickly recognize their
own use case, interact with real before/after results, and continue into the tool.
The SEO objective is to improve the usefulness and engagement of the existing
five-page bilingual cluster, especially queries currently near positions 6-15,
not to create thin pages or manufacture keyword density.

## Evidence

### First-party search demand

The 2026-08-15 Search Console export shows the strongest query families are:

- generic/free remover: `matcha filter remover`, `remove matcha filter`, and
  free/online variants;
- video: `matcha filter remover video`, `remove matcha filter video`, and video
  free/online variants;
- TikTok/trend/how-to: `matcha trend filter remover`, `remove matcha filter
tiktok`, and how-to variants;
- photo: `remove matcha filter from photo` and related variants.

The Philippines is the largest country segment by a wide margin, followed by the
United States, Indonesia, Myanmar, and Malaysia. The visuals therefore need to
feel like contemporary social content rather than Western stock photography
only, while avoiding stereotypes or claims about real users.

### Live competitor pattern review

The reviewed filter-removal pages consistently use:

- a person or selfie as the primary proof image;
- additional travel, city, or mountain scenes to expose sky and foliage shifts;
- product/still-life imagery to demonstrate whites, texture, and brand colour;
- before/after interaction or paired comparisons rather than decorative art.

Relevant pages reviewed:

- Fotor: <https://www.fotor.com/features/remove-filter-from-photo/>
- YouCam: <https://yce.perfectcorp.com/features/filter-remover>
- PhotoCut: <https://www.photocut.ai/free-tools/remove-filter-from-photo/>
- Editimg: <https://editimg.ai/features/remove-filter-from-photo>
- img2img: <https://www.img-2-img.com/remove-filter-from-photo>

This is category evidence, not permission to copy their assets, layouts, or
claims. Our differentiator remains instant local processing, honest limitations,
and examples produced by the shipped tool.

## Gallery design

Use six complementary comparisons:

1. close portrait/selfie — skin tone and hair;
2. short-form creator frame — the video/TikTok use case represented as a still;
3. friends/lifestyle scene — multiple skin tones and indoor daylight;
4. travel/city scene — sky, architecture, and neutral surfaces;
5. tabletop/product scene — paper, wood, packaging, and small detail;
6. food/interior scene — warm light, whites, and natural colour contrast.

All source scenes are generated specifically for the site at a 3:2 ratio and
contain no brands, UI, text, logos, or third-party media. People are clearly
adults and fictional. Source imagery should be sharp, photorealistic, naturally
lit, and include neutral as well as warm/cool reference colours so visitors can
judge correction rather than merely admire an image.

## Proof and provenance

The pipeline stays auditable:

1. generate a neutral source image with the project `generate-image` skill;
2. apply the deterministic matcha-style grade to make the Before fixture;
3. upload that fixture into the locally running product;
4. export the After from the product's actual canvas output;
5. display an explicit disclosure that the source photos are AI-generated demo
   media and the results are not customer submissions.

The page must continue to say the tool reduces a colour cast and compression
artifacts; it must not claim to recover destroyed pixels, identity, or an exact
original.

## Image delivery and interaction

- Full images: 1280 px wide, 3:2, WebP plus JPEG fallback.
- Small source: 480 px WebP; the 1280 px candidate serves high-DPR devices.
- Explicit width/height to prevent layout shift.
- Lazy loading and asynchronous decoding because the gallery is below the tool.
- Six independent keyboard-accessible range controls, preserving crawlable
  Before and After images in the DOM.
- Two-column desktop grid and one-column mobile flow; no hero image or autoplay
  media that could damage LCP.
- Concise bilingual captions map each scene to a real evaluation criterion;
  captions should not repeat the same keyword mechanically.

## Success criteria

- Every full example is at least 1280 px wide and visually sharp at high DPR.
- Every After is regenerated through the current product build.
- All six comparisons work by pointer and keyboard and remain usable at 390,
  768, 1512, and 1920 px viewport widths.
- No new horizontal overflow, console error, CLS regression, or eager image load.
- English and Chinese copy remain complete and honest.
- Production build, SEO audit, tool QA, layout QA, theme QA, and security scan
  pass before deployment.
- Live homepage and public configuration endpoint return 200 after deployment;
  the deployed HTML and assets show all six examples.
