import { envConfigs } from '@/config';

/**
 * JSON-LD builders.
 *
 * Emitted server-side via each route's `head.scripts`, so the markup is in the
 * initial HTML rather than injected after hydration.
 *
 * Honesty rules from the launch brief apply here too: `description` and
 * `featureList` describe reducing the filter look, never restoring originals.
 * FAQ entries mirror the visible page text verbatim — structured data that
 * disagrees with the rendered answer is a spam signal, and per §5 we are not
 * treating rich results as a promised outcome.
 */

const origin = () => envConfigs.app_url.replace(/\/+$/, '');

export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': `${origin()}/#organization`,
    name: envConfigs.app_name,
    url: `${origin()}/`,
    logo: `${origin()}/logo.svg`,
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${origin()}/#website`,
    name: envConfigs.app_name,
    url: `${origin()}/`,
    publisher: { '@id': `${origin()}/#organization` },
    inLanguage: 'en',
  };
}

/**
 * The tool itself. `browserRequirements` states the real dependency measured by
 * the runtime feature checks, and price 0 matches the actual product.
 */
/**
 * Capabilities the shipped tool actually has, each one traceable to a control
 * or state in `<MatchaTool>`. Structured data is machine-facing and only `en`
 * is published, so these stay in English rather than going through Paraglide.
 * Nothing aspirational belongs in this list — if a capability is removed from
 * the tool, remove it here in the same change.
 */
export const webAppFeatures = [
  'Reduce the matcha filter look in photos and videos in the browser',
  'Photo and video modes sharing one adjustment pipeline',
  'Color, noise and detail controls with a safe default preset',
  'Side-by-side original and adjusted preview',
  'Reset to the default preset',
  'PNG export for photos',
  'Browser-checked video export that attaches source audio when supported ' +
    'and refuses silent fallback when detected audio cannot be preserved',
  'Local processing — media is never uploaded',
];

export function webApplicationSchema(featureList: string[]) {
  return {
    '@type': 'WebApplication',
    '@id': `${origin()}/#webapp`,
    name: envConfigs.app_name,
    url: `${origin()}/`,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires WebGL. Video export requires MediaRecorder.',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList,
    publisher: { '@id': `${origin()}/#organization` },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${origin()}${item.path}`,
    })),
  };
}

/** Must be called with the same Q&A pairs the page renders. */
export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/** Wrap graph nodes into a single JSON-LD script payload for `head.scripts`. */
export function jsonLdScript(nodes: object[]) {
  return {
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': nodes,
    }).replace(/</g, '\\u003c'),
  };
}
