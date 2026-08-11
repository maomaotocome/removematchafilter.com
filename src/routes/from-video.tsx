import { createFileRoute } from '@tanstack/react-router';

import {
  breadcrumbSchema,
  faqSchema,
  jsonLdScript,
  organizationSchema,
  webAppFeatures,
  webApplicationSchema,
  websiteSchema,
} from '@/lib/matcha/schema';
import { pageHead } from '@/lib/matcha/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Examples } from '@/blocks/matcha/examples';
import { RecoveryBoundary } from '@/blocks/matcha/recovery-boundary';
import { MatchaFooter, MatchaHeader } from '@/blocks/matcha/site-chrome';
import { ToolSection } from '@/blocks/matcha/tool-section';
import { InlineCta } from '@/components/matcha/article';
import { FaqList } from '@/components/matcha/faq-list';
import { LinkCards } from '@/components/matcha/link-cards';
import {
  ProseSection,
  StepList,
  TipList,
} from '@/components/matcha/prose-section';

/** Single source for this page's Q&A — rendered list and FAQPage JSON-LD. */
function faqItems(locale?: ReturnType<typeof getLocale>) {
  const o = { locale };
  return [
    { question: m['video.faq_q1']({}, o), answer: m['video.faq_a1']({}, o) },
    { question: m['video.faq_q2']({}, o), answer: m['video.faq_a2']({}, o) },
    { question: m['video.faq_q3']({}, o), answer: m['video.faq_a3']({}, o) },
    { question: m['video.faq_q4']({}, o), answer: m['video.faq_a4']({}, o) },
    { question: m['home.faq_q5']({}, o), answer: m['home.faq_a5']({}, o) },
    { question: m['home.faq_q2']({}, o), answer: m['home.faq_a2']({}, o) },
  ];
}

/**
 * Video-intent page. Same <ToolSection> as `/` and `/from-photo`; only
 * `defaultMode` and the copy differ. Video-specific constraints (realtime
 * recording, audio handling, codec support) get their own explanation layer.
 */
function FromVideoPage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <MatchaHeader />
      <main>
        <ToolSection
          defaultMode="video"
          eyebrow={m['tool.mode_video']()}
          heading={m['video.h1']()}
          subhead={m['video.subhead']()}
          chooseFile={m['tool.cta_video']()}
        />

        <Examples />

        <RecoveryBoundary tone="muted" />

        <ProseSection id="how-it-works" title={m['home.how_title']()}>
          <StepList
            steps={[
              { title: m['home.how_1_title'](), body: m['home.how_1_body']() },
              { title: m['home.how_2_title'](), body: m['home.how_2_body']() },
              { title: m['home.how_3_title'](), body: m['home.how_3_body']() },
            ]}
          />
        </ProseSection>

        <ProseSection
          title={m['video.body_title']()}
          paragraphs={[
            m['video.intent_line'](),
            m['video.body_1'](),
            m['video.body_2'](),
            m['video.body_3'](),
          ]}
          tone="muted"
        />

        <ProseSection
          title={m['video.tiktok_title']()}
          paragraphs={[m['video.tiktok_body_1'](), m['video.tiktok_body_2']()]}
        >
          <InlineCta
            href="/how-to-remove-matcha-filter"
            label={m['video.guide_cta']()}
          />
        </ProseSection>

        <ProseSection title={m['video.export_title']()}>
          <TipList
            tips={[
              m['video.export_1'](),
              m['video.export_2'](),
              m['video.export_3'](),
            ]}
          />
        </ProseSection>

        <ProseSection title={m['video.tips_title']()} tone="muted">
          <TipList
            tips={[
              m['video.tip_1'](),
              m['video.tip_2'](),
              m['video.tip_3'](),
              m['video.tip_4'](),
            ]}
          />
        </ProseSection>

        <FaqList id="faq" title={m['home.faq_title']()} items={faqItems()} />

        <LinkCards
          title={m['home.related_title']()}
          cards={[
            {
              href: '/from-photo',
              title: m['home.paths_photo_title'](),
              body: m['home.paths_photo_body'](),
              cta: m['home.paths_photo_cta'](),
            },
            {
              href: '/matcha-filter-trend',
              title: m['home.trend_card_title'](),
              body: m['home.trend_card_body'](),
              cta: m['home.trend_card_cta'](),
            },
          ]}
        />
      </main>
      <MatchaFooter />
    </div>
  );
}

export const Route = createFileRoute('/from-video')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['video.meta_title']({}, { locale }),
      description: m['video.meta_description']({}, { locale }),
      faq: faqItems(locale),
      crumbs: [
        { name: m['breadcrumb.home']({}, { locale }), path: '/' },
        { name: m['breadcrumb.video']({}, { locale }), path: '/from-video' },
      ],
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          path: '/from-video',
          title: loaderData.title,
          description: loaderData.description,
          locale: loaderData.locale,
          scripts: [
            jsonLdScript([
              organizationSchema(),
              websiteSchema(),
              webApplicationSchema(webAppFeatures),
              breadcrumbSchema(loaderData.crumbs, loaderData.locale),
              faqSchema(loaderData.faq),
            ]),
          ],
        })
      : {},
  component: FromVideoPage,
});
