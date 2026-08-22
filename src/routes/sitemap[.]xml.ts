import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { baseLocale, locales, localizeUrl } from '@/paraglide/runtime.js';

// Canonical public pages only. The template's /pricing and /blog surfaces
// still exist in the codebase but are not part of the launch user path, so
// they stay out of the sitemap until they carry real content.
const STATIC_PATHS = [
  '',
  '/from-photo',
  '/from-video',
  '/matcha-filter-trend',
  '/how-to-remove-matcha-filter',
  '/remove-matcha-filter-tiktok',
  '/remove-matcha-filter-capcut',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms-of-service',
];

type Entry = {
  path: string;
  lastModified?: string;
  changeFrequency: string;
  priority: number;
};

type Locale = (typeof locales)[number];

function urlFor(path: string, locale: Locale): string {
  return localizeUrl(`${envConfigs.app_url}${path || '/'}`, {
    locale,
  }).href;
}

function entryXml(e: Entry, locale: Locale): string {
  const alternates = [
    ...locales.map(
      (alternateLocale) =>
        `    <xhtml:link rel="alternate" hreflang="${alternateLocale}" href="${urlFor(e.path, alternateLocale)}"/>`
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(e.path, baseLocale)}"/>`,
  ].join('\n');
  return [
    '  <url>',
    `    <loc>${urlFor(e.path, locale)}</loc>`,
    alternates,
    e.lastModified ? `    <lastmod>${e.lastModified}</lastmod>` : null,
    `    <changefreq>${e.changeFrequency}</changefreq>`,
    `    <priority>${e.priority}</priority>`,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () => {
        // Only canonical pages are listed. Blog entries are intentionally
        // omitted while /blog is not part of the launch path — re-add the
        // post loop here when real articles ship.
        const entries: Entry[] = STATIC_PATHS.map((path) => ({
          path,
          changeFrequency: 'weekly',
          priority:
            path === ''
              ? 1
              : path.startsWith('/from-')
                ? 0.9
                : path === '/matcha-filter-trend' ||
                    path === '/how-to-remove-matcha-filter' ||
                    path === '/remove-matcha-filter-tiktok' ||
                    path === '/remove-matcha-filter-capcut'
                  ? 0.8
                  : 0.5,
        }));

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
          // Google expects every localized URL to have its own <url> entry,
          // with the complete reciprocal alternate set repeated on each one.
          ...entries.flatMap((entry) =>
            locales.map((locale) => entryXml(entry, locale))
          ),
          '</urlset>',
          '',
        ].join('\n');

        return new Response(xml, {
          headers: { 'Content-Type': 'application/xml' },
        });
      },
    },
  },
});
