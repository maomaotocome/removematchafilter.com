import { envConfigs } from '@/config';
import { baseLocale, localizeUrl } from '@/paraglide/runtime.js';

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

export const SITE_PUBLISHED_AT = '2026-08-08';
export const SITE_REVIEWED_AT = '2026-08-16';
export const EDITORIAL_TEAM_NAME = 'Matcha Filter Remover Team';
export const MAINTAINER_NAME = 'Jared';
export const OFFICIAL_REPOSITORY_URL =
  'https://github.com/maomaotocome/removematchafilter.com';

const editorialTeamRef = () => ({
  '@type': 'Organization',
  '@id': `${origin()}/#editorial-team`,
  name: EDITORIAL_TEAM_NAME,
  url: `${origin()}/about`,
});

const maintainerRef = () => ({
  '@type': 'Person',
  '@id': `${origin()}/#jared`,
  name: MAINTAINER_NAME,
  url: `${origin()}/about`,
});

export function organizationSchema() {
  const contactEmail = envConfigs.contact_email.trim();
  return {
    '@type': 'Organization',
    '@id': `${origin()}/#organization`,
    name: envConfigs.app_name,
    url: `${origin()}/`,
    logo: `${origin()}/logo.svg`,
    sameAs: [OFFICIAL_REPOSITORY_URL],
    member: { '@id': `${origin()}/#jared` },
    ...(contactEmail
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: contactEmail,
            availableLanguage: ['English', 'Chinese'],
          },
        }
      : {}),
  };
}

/** Public authorship entity shown verbatim on the homepage and About page. */
export function editorialTeamSchema() {
  return {
    '@type': 'Organization',
    '@id': `${origin()}/#editorial-team`,
    name: EDITORIAL_TEAM_NAME,
    url: `${origin()}/about`,
    parentOrganization: { '@id': `${origin()}/#organization` },
    member: { '@id': `${origin()}/#jared` },
  };
}

/** Named maintainer supplied by the site owner; no unsupported profile added. */
export function maintainerSchema() {
  return {
    '@type': 'Person',
    '@id': `${origin()}/#jared`,
    name: MAINTAINER_NAME,
    jobTitle: 'Maintainer',
    url: `${origin()}/about`,
    memberOf: { '@id': `${origin()}/#editorial-team` },
    worksFor: { '@id': `${origin()}/#organization` },
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${origin()}/#website`,
    name: envConfigs.app_name,
    url: `${origin()}/`,
    publisher: { '@id': `${origin()}/#organization` },
    inLanguage: ['en', 'zh'],
  };
}

export function webPageSchema({
  path,
  name,
  description,
  locale = baseLocale,
  datePublished = SITE_PUBLISHED_AT,
  dateModified = SITE_REVIEWED_AT,
}: {
  path: string;
  name: string;
  description: string;
  locale?: string;
  datePublished?: string;
  dateModified?: string;
}) {
  const url = localizeUrl(`${origin()}${path}`, {
    locale: locale as typeof baseLocale,
  }).href;
  return {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: locale,
    datePublished,
    dateModified,
    isPartOf: { '@id': `${origin()}/#website` },
    about: { '@id': `${origin()}/#webapp` },
    mainEntity: { '@id': `${origin()}/#webapp` },
    author: editorialTeamRef(),
    editor: maintainerRef(),
    publisher: { '@id': `${origin()}/#organization` },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${origin()}/imgs/og-cover.png`,
    },
  };
}

export function aboutPageSchema({
  name,
  description,
  locale = baseLocale,
  datePublished = SITE_REVIEWED_AT,
  dateModified = SITE_REVIEWED_AT,
}: {
  name: string;
  description: string;
  locale?: string;
  datePublished?: string;
  dateModified?: string;
}) {
  const url = localizeUrl(`${origin()}/about`, {
    locale: locale as typeof baseLocale,
  }).href;
  return {
    '@type': 'AboutPage',
    '@id': `${url}#about-page`,
    url,
    name,
    description,
    inLanguage: locale,
    datePublished,
    dateModified,
    isPartOf: { '@id': `${origin()}/#website` },
    about: { '@id': `${origin()}/#organization` },
    mainEntity: { '@id': `${origin()}/#organization` },
    author: editorialTeamRef(),
    editor: maintainerRef(),
    publisher: { '@id': `${origin()}/#organization` },
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
    codeRepository: OFFICIAL_REPOSITORY_URL,
    author: editorialTeamRef(),
    publisher: { '@id': `${origin()}/#organization` },
  };
}

export function breadcrumbSchema(
  trail: { name: string; path: string }[],
  locale = baseLocale
) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: localizeUrl(`${origin()}${item.path}`, {
        locale: locale as typeof baseLocale,
      }).href,
    })),
  };
}

export function articleSchema({
  path,
  headline,
  description,
  locale = baseLocale,
  datePublished,
  dateModified = datePublished,
}: {
  path: string;
  headline: string;
  description: string;
  locale?: string;
  datePublished: string;
  dateModified?: string;
}) {
  const url = localizeUrl(`${origin()}${path}`, {
    locale: locale as typeof baseLocale,
  }).href;
  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline,
    description,
    url,
    mainEntityOfPage: url,
    datePublished,
    dateModified,
    inLanguage: locale,
    author: editorialTeamRef(),
    editor: maintainerRef(),
    publisher: { '@id': `${origin()}/#organization` },
    image: `${origin()}/imgs/og-cover.png`,
  };
}

export function howToSchema({
  path,
  name,
  description,
  steps,
  tools,
  locale = baseLocale,
}: {
  path: string;
  name: string;
  description: string;
  steps: { name: string; text: string }[];
  tools: string[];
  locale?: string;
}) {
  const url = localizeUrl(`${origin()}${path}`, {
    locale: locale as typeof baseLocale,
  }).href;
  return {
    '@type': 'HowTo',
    '@id': `${url}#howto`,
    name,
    description,
    url,
    inLanguage: locale,
    tool: tools.map((tool) => ({ '@type': 'HowToTool', name: tool })),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      url: `${url}#step-${index + 1}`,
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
