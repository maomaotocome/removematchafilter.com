# Homepage proof-first CRO structure

Date: 2026-08-17
Status: Approved for implementation by the user's request to plan the optimal
solution and begin implementation

## Goal

Help an organic-search visitor understand the product, see credible output and
start processing a file before long explanatory content. The primary success
path is select media -> render -> export. Scroll depth and time on page are
diagnostics, not goals by themselves.

The change must preserve the established bilingual SEO cluster, current title,
H1, metadata, schema, routes and honest recovery limits.

## Options considered

### A. Reorder existing sections only

Move the six-card example grid immediately below the tool. This is the smallest
SEO and implementation risk, but it puts more than three thousand pixels of
gallery content directly after the primary action on a phone and still leaves a
visitor without media unable to experience the product.

### B. Proof-first compact gallery and sample path (selected)

Move examples below the tool, show one large interactive comparison, and expose
all six scenarios through a keyboard-accessible selector. Add a bundled sample
action that enters the existing renderer, plus a return-to-tool CTA after the
proof. Move objection handling and educational content after proof while
retaining all existing copy.

This gives the strongest improvement to proof, interaction and mobile length
without changing ranking copy or the renderer.

### C. Full landing-page and performance rewrite

Delete or rewrite repeated educational sections, split public and application
providers, and change the headline/font loading strategy at the same time. This
could improve performance further, but it changes too many ranking and runtime
variables to attribute the outcome safely.

## Page order

1. Header and tool-first hero.
2. Compact Before and After proof.
3. Full recovery boundary.
4. Three-step workflow.
5. Local-processing privacy explanation.
6. Photo and video route choices.
7. FAQ.
8. Trend and naming education.
9. Sources, authorship and tested limits.
10. Deeper learning cards and footer.

The examples section ends with a primary anchor back to `#tool`. The existing
trend and naming paragraphs remain present but no longer delay visual proof.

## Compact example component

- The first example is rendered on the server and remains the default.
- One Before/After slider is visible at a time.
- Six scenario controls remain visible in the DOM with `aria-pressed` state.
- Desktop uses an asymmetric proof-and-index layout; mobile places a horizontal
  scrollable scenario rail above the proof so it does not create six screens of
  content.
- Selecting a scenario replaces the comparison and caption without animation
  that could cause layout shift.
- Explicit image dimensions and responsive WebP sources remain in use.
- The disclosure continues to state that source images are purpose-made,
  AI-generated demo media and are not customer submissions or exact-effect
  ground truth.

## Bundled sample flow

The photo empty state offers `Try a sample photo` as a secondary action. It
requests the existing purpose-made Before fixture from the site's own static
assets, constructs a browser `File`, and passes it to the same `handleFile`
function used by drag-and-drop and the file picker.

The action is shown only in photo mode. Video mode does not pretend a still is a
video sample. A failed static request becomes a bounded, translated error and
leaves normal file selection available.

No user media, filenames, pixels or URLs are added to analytics. The existing
default-deny analytics consent boundary remains unchanged.

## Accessibility and error handling

- File-drop accessible names include the visible `Choose a photo/video` label
  and CTA copy.
- Scenario controls are real buttons with a clear pressed state.
- The comparison range retains its programmatic label.
- Sample loading uses the existing live loading state.
- Sample failures do not clear a valid existing result and do not change modes
  unexpectedly.

## Verification

- English and Chinese message files contain every new string.
- SSR section order places the gallery immediately after the tool and before
  the recovery boundary.
- All six scenario controls work by pointer and keyboard.
- The sample action reaches a rendered canvas through the production pipeline.
- Phone, tablet, laptop and desktop layouts have no horizontal overflow.
- Existing example assets load at suitable resolutions.
- `pnpm build`, formatting, SEO audit, tool QA, layout QA and theme QA pass.
- No deployment or Git commit is included in this implementation.
