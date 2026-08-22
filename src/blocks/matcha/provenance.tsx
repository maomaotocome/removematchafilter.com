import { ExternalLink } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import {
  OFFICIAL_REPOSITORY_URL,
  SITE_PUBLISHED_AT,
  SITE_REVIEWED_AT,
} from '@/lib/matcha/schema';
import { m } from '@/paraglide/messages.js';

const sources = [
  {
    href: 'https://www.w3.org/TR/FileAPI/',
    labelKey: 'home.sources_file_api' as const,
  },
  {
    href: 'https://registry.khronos.org/webgl/specs/latest/',
    labelKey: 'home.sources_webgl' as const,
  },
  {
    href: 'https://www.w3.org/TR/mediastream-recording/',
    labelKey: 'home.sources_media_recorder' as const,
  },
  {
    href: OFFICIAL_REPOSITORY_URL,
    labelKey: 'home.sources_github' as const,
  },
];

/** Visible provenance for the product claims repeated in homepage JSON-LD. */
export function Provenance() {
  const limits = [
    {
      label: m['home.sources_photo_size_label'](),
      value: m['home.sources_photo_size_value'](),
    },
    {
      label: m['home.sources_video_size_label'](),
      value: m['home.sources_video_size_value'](),
    },
    {
      label: m['home.sources_photo_edge_label'](),
      value: m['home.sources_photo_edge_value'](),
    },
    {
      label: m['home.sources_video_edge_label'](),
      value: m['home.sources_video_edge_value'](),
    },
  ];

  return (
    <section
      id="sources"
      aria-labelledby="sources-title"
      className="border-border/70 border-y px-4 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:gap-16">
          <div>
            <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.2em] uppercase">
              {m['home.sources_eyebrow']()}
            </p>
            <h2
              id="sources-title"
              className="text-title mt-3 font-serif font-normal text-balance"
            >
              {m['home.sources_title']()}
            </h2>
            <p className="text-muted-foreground mt-6 max-w-[68ch] text-[16.5px] leading-[1.75] text-pretty">
              {m['home.sources_intro']()}
            </p>
            <p className="text-foreground mt-5 text-sm font-medium">
              {m['home.sources_byline']()}
            </p>
            <p data-nosnippet="" className="text-muted-foreground mt-2 text-xs">
              {m['home.sources_published_label']()}{' '}
              <time dateTime={SITE_PUBLISHED_AT}>
                {m['home.sources_published_date']()}
              </time>{' '}
              · {m['home.sources_reviewed_label']()}{' '}
              <time dateTime={SITE_REVIEWED_AT}>
                {m['home.sources_reviewed_date']()}
              </time>
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">
              {m['home.sources_limits_title']()}
            </h3>
            <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border">
              {limits.map((limit) => (
                <div key={limit.label} className="bg-card p-4 sm:p-5">
                  <dt className="text-muted-foreground text-xs leading-5">
                    {limit.label}
                  </dt>
                  <dd className="mt-1 font-serif text-xl">{limit.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-10 border-t pt-8">
          <h3 className="text-sm font-semibold">
            {m['home.sources_primary_title']()}
          </h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {sources.map((source) => (
              <li key={source.href}>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                >
                  {m[source.labelKey]()}
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
          <Link
            href="/about"
            className="text-foreground mt-5 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
          >
            {m['home.sources_about_link']()}
          </Link>
        </div>
      </div>
    </section>
  );
}
