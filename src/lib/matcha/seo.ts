import { envConfigs } from '@/config';
import { baseLocale, locales, localizeUrl } from '@/paraglide/runtime.js';

/**
 * Build per-page metadata: title, description, self-referencing canonical, and
 * Open Graph / Twitter tags. Locale comes from the route loader so the values
 * are resolved server-side and land in the crawlable HTML.
 */
/** Social card built from real before/after output (`pnpm qa:og`). */
const OG_IMAGE = '/imgs/og-cover.png';
const OG_IMAGE_WIDTH = '1200';
const OG_IMAGE_HEIGHT = '630';

export function pageHead({
  path,
  title,
  description,
  locale = baseLocale,
  scripts,
}: {
  /** Locale-free path with a leading slash; '/' for the home page. */
  path: string;
  title: string;
  description: string;
  locale?: string;
  /** JSON-LD payloads from `@/lib/matcha/schema`, rendered server-side. */
  scripts?: { type: string; children: string }[];
}) {
  const canonical = localizeUrl(`${envConfigs.app_url}${path}`, {
    locale: locale as typeof baseLocale,
  }).href;
  const imageUrl = `${envConfigs.app_url.replace(/\/+$/, '')}${OG_IMAGE}`;
  const alternates = locales.map((alternateLocale) => ({
    rel: 'alternate',
    hrefLang: alternateLocale,
    href: localizeUrl(`${envConfigs.app_url}${path}`, {
      locale: alternateLocale,
    }).href,
  }));
  const defaultHref = localizeUrl(`${envConfigs.app_url}${path}`, {
    locale: baseLocale,
  }).href;

  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: envConfigs.app_name },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonical },
      { property: 'og:locale', content: locale },
      { property: 'og:image', content: imageUrl },
      { property: 'og:image:width', content: OG_IMAGE_WIDTH },
      { property: 'og:image:height', content: OG_IMAGE_HEIGHT },
      {
        property: 'og:image:alt',
        content: 'A matcha-filtered frame beside the adjusted result.',
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: imageUrl },
    ],
    links: [
      { rel: 'canonical', href: canonical },
      ...alternates,
      { rel: 'alternate', hrefLang: 'x-default', href: defaultHref },
    ],
    ...(scripts ? { scripts } : {}),
  };
}
