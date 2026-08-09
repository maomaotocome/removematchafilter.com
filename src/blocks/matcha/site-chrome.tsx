import { m } from '@/paraglide/messages.js';
import { SiteFooter, type FooterColumn } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

/**
 * Public nav. Only the three tool pages plus the trust pages — the template's
 * SaaS surfaces (pricing, blog, settings, admin) stay in the codebase but are
 * intentionally not part of the launch user path.
 */
export function MatchaHeader() {
  return (
    <SiteHeader
      showCta={false}
      navLinks={[
        { href: '/from-photo', label: m['landing.nav.photo']() },
        { href: '/from-video', label: m['landing.nav.video']() },
        { href: '/#how-it-works', label: m['landing.nav.how']() },
        { href: '/#faq', label: m['landing.nav.faq']() },
      ]}
    />
  );
}

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
        { label: m['site.footer.how'](), href: '/#how-it-works' },
        { label: m['site.footer.faq'](), href: '/#faq' },
      ],
    },
    {
      title: m['site.footer.company'](),
      links: [
        { label: m['site.footer.contact'](), href: '/contact' },
        { label: m['site.footer.privacy'](), href: '/privacy-policy' },
        { label: m['site.footer.terms'](), href: '/terms-of-service' },
      ],
    },
  ];

  return <SiteFooter tagline={m['site.footer.tagline']()} columns={columns} />;
}
