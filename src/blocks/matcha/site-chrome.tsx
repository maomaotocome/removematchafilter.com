import { m } from '@/paraglide/messages.js';
import { SiteFooter, type FooterColumn } from '@/components/site-footer';

export { MatchaHeader } from './public-header';

/**
 * Public header. `showCta={false}` keeps the template's "Get Started" →
 * /settings button out of the launch journey (brief §8: unused SaaS
 * capabilities stay in the codebase but disconnected from the P0 path).
 */
export function MatchaFooter() {
  const columns: FooterColumn[] = [
    {
      title: m['site.footer.tools'](),
      links: [
        { label: m['site.footer.tool_home'](), href: '/' },
        { label: m['site.footer.tool_photo'](), href: '/from-photo' },
        { label: m['site.footer.tool_video'](), href: '/from-video' },
      ],
    },
    {
      title: m['site.footer.learn'](),
      links: [
        {
          label: m['site.footer.guide'](),
          href: '/how-to-remove-matcha-filter',
        },
        {
          label: m['site.footer.trend'](),
          href: '/matcha-filter-trend',
        },
        {
          label: m['site.footer.tiktok'](),
          href: '/remove-matcha-filter-tiktok',
        },
        {
          label: m['site.footer.capcut'](),
          href: '/remove-matcha-filter-capcut',
        },
        { label: m['site.footer.faq'](), href: '/#faq' },
      ],
    },
    {
      title: m['site.footer.company'](),
      links: [
        { label: m['site.footer.about'](), href: '/about' },
        { label: m['site.footer.contact'](), href: '/contact' },
        { label: m['site.footer.privacy'](), href: '/privacy-policy' },
        { label: m['site.footer.terms'](), href: '/terms-of-service' },
      ],
    },
  ];

  return <SiteFooter tagline={m['site.footer.tagline']()} columns={columns} />;
}
