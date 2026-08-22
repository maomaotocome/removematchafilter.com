# Matcha paired dataset card — template

> Template only. Do not add private filenames, paths, thumbnails, consent
> documents, participant identities, account details, sensitive traits, or raw
> reviewer responses to a committed dataset card.

## Dataset identity

| Field                    | Value                                                         |
| ------------------------ | ------------------------------------------------------------- |
| Dataset name             | `[private dataset name]`                                      |
| Version                  | `[version]`                                                   |
| Status                   | `[pilot / locked / deprecated]`                               |
| Dataset custodian        | `[role, not private contact details]`                         |
| Schema version           | `1.0`                                                         |
| Manifest SHA-256         | `[exact private manifest hash]`                               |
| Eligible holdout SHA-256 | `[canonical accepted non-synthetic holdout hash]`             |
| Holdout item count       | `[count; must be greater than zero before calling it locked]` |
| Collection period        | `[coarse date range]`                                         |
| Last rights audit        | `[YYYY-MM-DD]`                                                |
| Last validation          | `[YYYY-MM-DD and validator version/commit]`                   |

## Purpose and decision boundary

**Intended use**

- `[for example: internal evaluation of Matcha-filter colour reduction]`
- `[for example: calibration using calibration split only]`
- `[for example: blinded human comparison under approved rights]`

**Prohibited use**

- Identity recognition, biometric identification, face embeddings, or
  demographic/sensitive-trait inference.
- Training or evaluating unrelated general-purpose models.
- Public demonstrations containing private media.
- Reconstructing hidden content or claiming recovery of destroyed pixels.
- Any use outside each referenced rights record.
- Tuning against validation outcomes without a declared experiment, or any
  tuning/browsing against locked holdout media or outputs.

## Composition

Report accepted, rejected, synthetic, and benchmark-eligible counts separately.
Synthetic fixtures must never be included in benchmark or holdout totals.

| Media/status                | Calibration | Validation | Holdout | Total |
| --------------------------- | ----------: | ---------: | ------: | ----: |
| Accepted real photos        |       `[n]` |      `[n]` |   `[n]` | `[n]` |
| Accepted real videos        |       `[n]` |      `[n]` |   `[n]` | `[n]` |
| Rejected governance records |       `[n]` |      `[n]` |     `0` | `[n]` |
| Synthetic smoke fixtures    |       `[n]` |      `[n]` |     `0` | `[n]` |

| Scene category         | Photo target | Photo actual |      Video target | Video actual |
| ---------------------- | -----------: | -----------: | ----------------: | -----------: |
| Single portrait/selfie |           48 |        `[n]` |                12 |        `[n]` |
| Group/lifestyle        |           24 |        `[n]` |                 4 |        `[n]` |
| Indoor/warm/low light  |           18 |        `[n]` |                 4 |        `[n]` |
| Outdoor/sky/greenery   |           18 |        `[n]` |                 4 |        `[n]` |
| Product/food/no person |           12 |        `[n]` | `[if applicable]` |        `[n]` |

Additional aggregate coverage, without participant-level sensitive labels:

- Naturally green subjects/backgrounds: `[percentage; target at least 30%]`
- Warm or mixed lighting: `[percentage; target at least 30%]`
- Front/rear camera coverage: `[aggregate description]`
- Device-family coverage: `[coarse families only]`
- Static/moderate/camera-motion video: `[aggregate counts]`
- Video with retained rights-cleared audio: `[count]`
- Video with absent/removed audio: `[count]`

## Sources and acquisition

- Allowed source types used: `[controlled consent / owner rights / licensed / volunteered]`
- Real Matcha effect and observed versions: `[aggregate, non-identifying description]`
- Pairing process: `[how the same source became original and filtered]`
- Excluded source types: `[confirm no scraped personal posts, celebrities, minors, or unlicensed campaigns]`
- Synthetic fixtures: `[purpose and strict separation from gold data]`

## Rights and consent audit

| Check                                              | Result                       | Evidence owner |
| -------------------------------------------------- | ---------------------------- | -------------- |
| Every real pair references a current rights record | `[pass/fail]`                | `[role]`       |
| All required participants are confirmed adults     | `[pass/fail]`                | `[role]`       |
| Zero sexual, suggestive, or intimate content       | `[pass/fail]`                | `[role]`       |
| Transformation/evaluation rights confirmed         | `[pass/fail]`                | `[role]`       |
| Calibration rights confirmed for calibration split | `[pass/fail]`                | `[role]`       |
| Human-review rights confirmed where used           | `[pass/fail]`                | `[role]`       |
| Audio rights confirmed where audio remains         | `[pass/fail/not applicable]` | `[role]`       |
| Expiry/deletion dates checked                      | `[pass/fail]`                | `[role]`       |
| Revocation/deletion channel tested                 | `[pass/fail]`                | `[role]`       |

Describe unresolved restrictions without including identities or consent-document
links: `[privacy-safe summary or none]`.

## Privacy and metadata treatment

- Private storage and encryption: `[controls]`
- Allowed access roles: `[roles]`
- EXIF/GPS/device-serial/account-identifier removal method: `[method/tool]`
- Independent metadata inspection result: `[aggregate result]`
- Orientation and colour-profile handling: `[method and limitations]`
- Audio removal/sanitization: `[method]`
- Confirmation that no raw media, private paths, or raw review data is tracked:
  `[pass/fail and review date]`

Do not store names, handles, personal profile/source URLs, GPS, ethnicity, race,
health attributes, face embeddings, or free-form personal descriptions.

## Normalization and alignment

- Raw immutability method: `[method]`
- Normalized derivative process: `[method/version]`
- Image alignment method and acceptance threshold: `[method]`
- Video timeline alignment method and threshold: `[method]`
- Common valid-region/crop policy: `[policy]`
- Rejection reasons and aggregate counts: `[bounded categories and counts]`
- Full-resolution and standard evaluation-resolution policy: `[policy]`

## Split and leakage governance

- Split allocation target: `60% calibration / 20% validation / 20% holdout`
- Grouping unit: `capture_group_id`
- Cross-split capture-group leakage result: `[must be zero]`
- Duplicate SHA-256 result: `[must be zero among eligible media]`
- Perceptual duplicate review: `[method and result]`
- Category coverage by split: `[aggregate summary]`
- Holdout steward and access boundary: `[roles/controls]`
- Date holdout was frozen before candidate selection: `[YYYY-MM-DD]`

## Validation and review evidence

- Validator command/version: `[command and commit]`
- Manifest validation result: `[pass/fail]`
- Media decode/open result: `[pass/fail and counts]`
- Rights audit result: `[pass/fail]`
- Second-review coverage: `[100% holdout; percentage elsewhere]`
- Alignment review result: `[pass/fail and exclusions]`
- Rejected records excluded from benchmark runner: `[pass/fail]`
- Synthetic records excluded from benchmark and holdout: `[pass/fail]`

## Known limitations and biases

- `[collection/source bias]`
- `[device-family and export-pipeline limitations]`
- `[lighting/scene gaps]`
- `[limitations of reviewing complexion outcomes without sensitive labels]`
- `[filter-version drift or unavailable historical effect versions]`
- `[audio/video motion limitations]`
- `[what this dataset cannot establish about exact recovery or identity]`

## Retention, deletion, and incidents

- Retention schedule: `[schedule by media, rights records, raw results, backups]`
- Deletion workflow owner and verifier: `[roles]`
- Last deletion drill by `pair_id`: `[date/result]`
- Last deletion drill by `rights_id`: `[date/result]`
- Backup deletion behaviour: `[method/timing]`
- Holdout invalidation/re-versioning procedure: `[procedure]`
- Incidents or exceptions: `[privacy-safe aggregate summary or none]`

## Change history and approvals

| Version/date | Aggregate change                            | Manifest hash | Holdout impact                   | Approved by role |
| ------------ | ------------------------------------------- | ------------- | -------------------------------- | ---------------- |
| `[v/date]`   | `[description without private identifiers]` | `[hash]`      | `[none/new version/invalidated]` | `[role]`         |

## Release checklist

- [ ] Dataset card contains no private paths, filenames, images, identities, or
      links to consent documents.
- [ ] Manifest validation passes with zero cross-split group leaks and duplicate
      hashes.
- [ ] Rights audit and metadata inspection are complete.
- [ ] No minors or sexual, suggestive, or intimate content is present.
- [ ] Rejected and synthetic records are excluded from eligible counts and
      holdout.
- [ ] Holdout hash was recorded before candidate selection and access is
      restricted.
- [ ] Limitations, exclusions, retention, and deletion are documented.
- [ ] Aggregate report publication has completed privacy review.
