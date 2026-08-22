export interface LlmsContext {
  appName: string;
  appDescription: string;
  appUrl: string;
}

export const LLMS_PAGES = [
  {
    path: '',
    title: 'Remove Matcha Filter',
    description: 'Free local photo and video filter-correction tool.',
  },
  {
    path: '/from-photo',
    title: 'Remove Matcha Filter from a Photo',
    description: 'Photo formats, local preview, adjustment and export.',
  },
  {
    path: '/from-video',
    title: 'Remove Matcha Filter from a Video',
    description: 'Frame-by-frame local correction, audio and export limits.',
  },
  {
    path: '/how-to-remove-matcha-filter',
    title: 'How to Remove Matcha Filter',
    description: 'Step-by-step workflow and realistic recovery boundary.',
  },
  {
    path: '/matcha-filter-trend',
    title: 'Matcha Filter Trend Explained',
    description: 'Definition, naming, visual traits and correction limits.',
  },
  {
    path: '/remove-matcha-filter-tiktok',
    title: 'Remove Matcha Filter from a TikTok Video',
    description: 'Source-aware workflow for a local video file you can edit.',
  },
  {
    path: '/remove-matcha-filter-capcut',
    title: 'Remove Matcha Filter in CapCut',
    description: 'Source-first options for editable projects and exports.',
  },
  {
    path: '/about',
    title: 'About Remove Matcha Filter',
    description: 'Maintainer, methodology, sources and editorial policy.',
  },
  {
    path: '/contact',
    title: 'Contact',
    description: 'Support, corrections and privacy requests.',
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy',
    description: 'Local media handling, logs and consent-gated analytics.',
  },
  {
    path: '/terms-of-service',
    title: 'Terms of Service',
    description: 'Usage terms, limitations and user responsibilities.',
  },
] as const;

function normalizedContext(context: LlmsContext) {
  return { ...context, appUrl: context.appUrl.replace(/\/+$/, '') };
}

function pageLines(context: LlmsContext): string[] {
  const { appUrl } = normalizedContext(context);
  return LLMS_PAGES.map(
    (page) =>
      `- [${page.title}](${appUrl}${page.path || '/'}): ${page.description}`
  );
}

export function buildLlmsIndex(context: LlmsContext): string {
  const { appName, appDescription, appUrl } = normalizedContext(context);
  return [
    `# ${appName}`,
    '',
    `> ${appDescription}`,
    '',
    'A free, no-account tool that processes selected photos and videos locally in the browser. It reduces visible matcha-style colour, grain and contrast treatment; it cannot reconstruct original pixels or hidden content.',
    '',
    '## Canonical pages',
    '',
    ...pageLines(context),
    '',
    '## Detailed product context',
    '',
    `- [Full factual reference](${appUrl}/llms-full.txt)`,
    '',
  ].join('\n');
}

export function buildLlmsFull(context: LlmsContext): string {
  const { appName, appDescription, appUrl } = normalizedContext(context);
  return [
    `# ${appName}: factual product reference`,
    '',
    `> ${appDescription}`,
    '',
    '## Product status',
    '',
    '- The public tool is free to use and does not require an account, subscription, credits or payment.',
    '- There is no public API, batch-processing plan, paid HD export or watermark-removal product.',
    '- The site is independent and is not affiliated with TikTok, CapCut or another filter provider.',
    '',
    '## Media-processing model',
    '',
    '- A user chooses a local photo or video file. The site does not accept a social-media URL and does not download media from another platform.',
    '- The browser decodes the file through a temporary object URL. WebGL applies deterministic colour, noise and detail adjustments on the user’s device.',
    '- Photos export from the local canvas. Videos are processed frame by frame and recorded in real time when the browser supports canvas recording.',
    '- Media files, filenames, pixels, captions and adjustment values are not uploaded to this site or sent to an AI service.',
    '',
    '## What the tool can and cannot do',
    '',
    '- It can reduce a visible green cast, flattening, added grain and some loss of edge contrast when the underlying scene remains present.',
    '- It cannot recover exact source pixels discarded by a filter, recreate a missing face or object, reverse platform compression, or reveal an unfiltered original that the user does not possess.',
    '- Output is an adjustment, not a forensic reconstruction. Results vary with the source file and browser capabilities.',
    '',
    '## Video-specific facts',
    '',
    '- Supported input labels are MP4, MOV and WebM, subject to the browser’s installed codecs. HEVC files may require conversion to H.264 outside Safari.',
    '- Video export runs for approximately the clip’s real duration. The tab should remain visible during recording.',
    '- The tool attaches source audio only when the browser can read and verify it; otherwise it blocks export instead of silently claiming sound was preserved.',
    '',
    '## Examples and evidence',
    '',
    '- Public photo comparisons use owned AI test images and outputs generated by the current deterministic renderer. They are demonstrations, not customer cases.',
    '- Synthetic QA media is used for browser export and audio checks. Synthetic fixtures demonstrate the processing path, not exact recovery of a real proprietary filter.',
    `- Method, authorship, primary sources and correction policy: ${appUrl}/about`,
    '',
    '## Privacy and analytics',
    '',
    '- Ordinary hosting logs can include an IP address, request time, path, referrer and user agent. They do not contain media contents.',
    '- Google Analytics and coarse, allowlisted tool events load only after the visitor explicitly allows analytics. A visitor can decline or withdraw that choice from the on-page analytics settings.',
    '- Analytics events never include media, filenames, pixels, captions, slider values or other file contents.',
    `- Full policy: ${appUrl}/privacy-policy`,
    '',
    '## Canonical pages',
    '',
    ...pageLines(context),
    '',
    '## Citation guidance',
    '',
    '- Prefer the most specific canonical page for a claim.',
    '- Preserve the recovery limitation when describing the product: it reduces a visible treatment; it does not restore an exact original.',
    '- Do not infer paid features, accounts, an API, a downloadable app, cloud media processing or affiliation with third-party brands.',
    '',
  ].join('\n');
}
