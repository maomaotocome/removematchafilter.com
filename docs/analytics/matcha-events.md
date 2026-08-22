# Matcha tool analytics event contract

- **Version:** 1
- **Effective for development:** 2026-08-16
- **Production status:** Consent-gated implementation complete 2026-08-22;
  delivery remains default-deny until each visitor explicitly opts in
- **Decision goal:** Measure the local select → render → export funnel without
  learning anything about the user's media

## Privacy boundary

Events may describe only a coarse product state. They must never contain:

- filename or extension-derived name;
- local file path, directory, origin path, page URL parameter, or referrer text;
- object/blob/data URL;
- media bytes, pixels, thumbnails, base64, EXIF, audio, or captions;
- free-text errors, exception messages, stack traces, or browser logs;
- prompts or other user-entered/free text;
- face count, face location, embeddings, identity, expression, skin tone,
  inferred demographics, or any other facial/biometric attribute;
- exact file size, exact dimensions, exact duration, or a unique file hash.

Unknown event names, parameter names, and parameter values are dropped by the
runtime allowlist. Analytics failure must never interrupt loading, rendering,
adjustment, or export.

## Implemented events

| Event                     | Decision supported                                  | Trigger                                                        | Allowed parameters                                                             |
| ------------------------- | --------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `matcha_file_selected`    | How many valid/invalid selections enter the funnel? | A file reaches the tool's selection handler, before decoding   | `media_mode`, `size_bucket`, `processing_path`                                 |
| `matcha_render_ready`     | Does an accepted file reach a usable local result?  | The renderer draws the first frame once for the selected media | `media_mode`, `size_bucket`, `duration_bucket`, `preset_id`, `processing_path` |
| `matcha_export_started`   | How many rendered sessions attempt export?          | Immediately before photo/video export work begins              | `media_mode`, `size_bucket`, `duration_bucket`, `preset_id`, `processing_path` |
| `matcha_export_succeeded` | What is the successful-export conversion?           | A download-producing export resolves successfully              | `media_mode`, `size_bucket`, `duration_bucket`, `preset_id`, `processing_path` |
| `matcha_export_failed`    | Which bounded export class blocks completion?       | Export throws after starting                                   | the export parameters plus `error_code`                                        |
| `matcha_preset_selected`  | Is the shipped preset deliberately reselected?      | The user presses Reset, selecting the default preset           | `media_mode`, `preset_id`, `processing_path`                                   |

The future names `matcha_ai_offer_viewed`, `matcha_ai_opt_in`,
`matcha_ai_succeeded`, and `matcha_ai_failed` are reserved by the approved
design but are not emitted by the current local-only product.

## Allowed values

| Parameter         | Allowed values                                                               | Derivation                                                                                   |
| ----------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `media_mode`      | `photo`, `video`, `unknown`                                                  | MIME/extension classifier; `unknown` is used only for an unsupported selection               |
| `size_bucket`     | `under_1_mb`, `1_10_mb`, `10_50_mb`, `over_50_mb`                            | Coarse bucket from `File.size`; exact bytes are discarded                                    |
| `duration_bucket` | `not_applicable`, `unknown`, `under_10_s`, `10_30_s`, `30_60_s`, `over_60_s` | Coarse bucket after video metadata decode; photos use `not_applicable`                       |
| `preset_id`       | `default`                                                                    | Stable identifier for the current 70/45/35 preset                                            |
| `processing_path` | `local_webgl`                                                                | Current free processor only                                                                  |
| `error_code`      | `export_unsupported`, `audio_unavailable`, `export_failed`                   | Bounded code selected by a known control-flow branch; never derived from an exception string |

Adding an enum value is a schema change and requires updating this document,
the runtime allowlist, and privacy QA together.

Size boundaries are lower-inclusive: 1 MiB starts `1_10_mb`, 10 MiB starts
`10_50_mb`, and 50 MiB starts `over_50_mb`. `File.size` is specified as a
finite non-negative integer; a non-finite or negative direct API call is
conservatively reduced to `under_1_mb` and never emitted as a distinct value.

## Queue and failure behaviour

- The client helper is an SSR no-op.
- Product-event collection is default-deny. Unless an explicit in-memory
  consent signal is `granted`, an event is neither captured nor queued.
- Setting consent to `denied` or `unknown` clears the bounded in-memory queue
  immediately. The event helper does not persist consent; the reviewed consent
  component stores only the visitor's `granted`/`denied` choice in localStorage.
- Before the delayed GA loader defines `window.gtag`, at most 32 sanitized
  post-consent events are kept in module memory.
- A bounded retry waits for the existing loader; the helper never loads a
  script or performs a network request itself.
- When `gtag` becomes available, queued events are delivered in order.
- When analytics is blocked, absent, misconfigured, or throws, the tool keeps
  working. The queue remains bounded and is not persisted.
- No event is written to cookies, local storage, IndexedDB, server logs, or the
  application database by this helper.

## QA contract

The browser tool QA must:

1. block Google Analytics/Tag Manager/Plausible endpoints so the test makes no
   real analytics request;
2. capture sanitized events from real photo, error, reset, and video paths;
3. require each event name, parameter key, and parameter value to be allowlisted;
4. reject fixture filenames, temporary paths, `blob:`/`data:` URLs, free-text
   errors, prompts, hashes, pixels, and face/demographic fields;
5. complete photo and video exports while analytics remains blocked.

## Consent and policy gate

The 2026-08-22 implementation keeps all analytics scripts absent until the
visitor selects “Allow analytics.” The choice is reversible from a persistent
analytics-settings control. Declining or withdrawing disables GA delivery,
removes the loader and clears accessible GA cookies. Google ad storage,
personalisation and ad-user-data signals remain denied.

The English and Chinese privacy policies now disclose Google Analytics, the
coarse allowlisted product events, browser storage, the data categories that
may be processed, the media fields that are prohibited, and how to withdraw.
The production owner remains responsible for legal review and GA-property
configuration for the jurisdictions served; this document records the
technical boundary and is not legal advice.
