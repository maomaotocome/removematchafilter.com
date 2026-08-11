# Manual QA Matrix — P0

Automated coverage (`pnpm qa:tool`) runs **only** in headless Chromium with a
SwiftShader GPU. Everything below must be executed by a human on the real
browser and marked off. Nothing here may be reported as passing until it has
actually been run.

Status values: `PASS`, `FAIL`, `NOT VERIFIED`.

## Legend of required checks per browser

1. **Photo** — choose, adjust all three sliders, reset, export PNG, open the file.
2. **Video with audio** — choose a clip _that has sound_, adjust, export.
3. **Audio present** — play the exported file; confirm the original sound is there and audible.
4. **A/V sync** — confirm sound still lines up with picture at the end of the clip, not just the start.
5. **Container** — check the real file type (`file <name>` or a media inspector), and that the extension matches.
6. **Errors** — feed an unsupported file, an oversized file, and a corrupt file; each must explain the next action and stay recoverable.

## Desktop

| Browser         | Version   | 1 Photo      | 2 Video+audio | 3 Audio present | 4 A/V sync   | 5 Container  | 6 Errors     |
| --------------- | --------- | ------------ | ------------- | --------------- | ------------ | ------------ | ------------ |
| Chrome (macOS)  | _fill in_ | NOT VERIFIED | NOT VERIFIED  | NOT VERIFIED    | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| Edge (Windows)  | _fill in_ | NOT VERIFIED | NOT VERIFIED  | NOT VERIFIED    | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| Safari (macOS)  | _fill in_ | NOT VERIFIED | NOT VERIFIED  | NOT VERIFIED    | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| Firefox (macOS) | _fill in_ | NOT VERIFIED | NOT VERIFIED  | NOT VERIFIED    | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |

**Headless Chromium (automated, for reference only):** photo PASS, video+audio
PASS, audio present PASS (2ch/48kHz, RMS 0.338), A/V sync PASS (0.011 s drift),
container PASS (`video/mp4`, `.mp4`), errors PASS. This is _not_ a substitute
for a row above — headless Chromium is not a browser users have.

### Safari-specific risks to watch

- `HTMLVideoElement.captureStream()` is not exposed, so audio comes from the
  Web Audio fallback in `getSourceAudioTrack`. Confirm the exported file has
  sound, and that the page itself still plays audio during export.
- `MediaRecorder` support is newer and may negotiate a different container than
  requested. Check item 5 carefully — the extension is derived from
  `recorder.mimeType`, so a surprise container should still be named correctly.
- If audio cannot be preserved in Safari, per brief §4 (L98) the honest options
  are to scope the video promise down for Safari or exclude it — not to ship a
  silent export as complete.

### Firefox-specific risks

- Uses `mozCaptureStream`/`captureStream`; verify the audio path.
- Will almost certainly produce WebM rather than MP4. Item 5 must confirm the
  file is named `.webm` in that case.

## Mobile

| Device / OS  | Browser | 1 Photo      | 2 Video+audio | 3 Audio present | 4 A/V sync   | Memory under load | Backgrounding mid-export |
| ------------ | ------- | ------------ | ------------- | --------------- | ------------ | ----------------- | ------------------------ |
| iPhone (iOS) | Safari  | NOT VERIFIED | NOT VERIFIED  | NOT VERIFIED    | NOT VERIFIED | NOT VERIFIED      | NOT VERIFIED             |
| Android      | Chrome  | NOT VERIFIED | NOT VERIFIED  | NOT VERIFIED    | NOT VERIFIED | NOT VERIFIED      | NOT VERIFIED             |

### Mobile-specific checks

- **Memory:** load a large photo (near the 25 MB limit) and a 200 MB video. Watch
  for a tab crash or reload. The 4096 px photo / 1920 px video render ceilings are
  intended to prevent this but are untested on real hardware.
- **Backgrounding:** start a video export, switch apps for ~10 seconds, return.
  Expected behaviour: `requestAnimationFrame` throttles, so the recording may be
  short or stalled. The UI warns against this; confirm the warning appears and
  that the result is either correct or a clear error — never a silently truncated
  file presented as success.
- **Layout:** confirm no horizontal scrolling and that the primary CTA is
  reachable without zooming.

## Sign-off

P0 acceptance items §10 L199–L203 cannot be checked off until every desktop row
and at least one mobile row reads PASS. Record the actual versions tested.

### Contact inbox (§7 L160, §10 L207)

| Item                           | Status | Date       | Notes                                                                               |
| ------------------------------ | ------ | ---------- | ----------------------------------------------------------------------------------- |
| `hello@removematchafilter.com` | PASS   | 2026-08-08 | Manual receipt test performed; test email arrived. Signed off by the project owner. |

`VITE_CONTACT_EMAIL` is configured and the trust pages render it as a live
`mailto:` link. `pnpm check:launch` still prints its deliverability reminder on
every run by design — the script cannot observe an inbox, so the WARN stays as a
standing prompt to re-test if the address or forwarding ever changes. This
sign-off row, not the absence of that warning, is the record of verification.

### Audio degradation behaviour (automated, Chromium only)

Verified by `pnpm qa:tool` with injected capability stubs:

- No audio-capable `MediaRecorder` type → export **refuses** with a recoverable
  error; no silent file, no Success state.
- `captureStream` absent but `mozCaptureStream` present → the Firefox-prefixed
  route is actually called and the export succeeds.
- All audio extraction routes removed → error shown, and the UI never claims
  "The source had no audio".
- Three consecutive exports of the same clip → all succeed, zero console errors.

These stubs prove the _logic_. They do not prove how Safari or Firefox behave in
reality — those rows above remain NOT VERIFIED.
