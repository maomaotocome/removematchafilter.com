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
import { RecoveryBoundary } from '@/blocks/matcha/recovery-boundary';
import { MatchaFooter, MatchaHeader } from '@/blocks/matcha/site-chrome';
import { ToolSection } from '@/blocks/matcha/tool-section';
import { VideoEvidence } from '@/blocks/matcha/video-evidence';
import { FaqList } from '@/components/matcha/faq-list';
import { LinkCards } from '@/components/matcha/link-cards';
import { ProseSection, StepList } from '@/components/matcha/prose-section';

function workflowSteps(locale?: ReturnType<typeof getLocale>) {
  const o = { locale };
  return [
    {
      title: m['tiktok.step_1_title']({}, o),
      body: m['tiktok.step_1_body']({}, o),
    },
    {
      title: m['tiktok.step_2_title']({}, o),
      body: m['tiktok.step_2_body']({}, o),
    },
    {
      title: m['tiktok.step_3_title']({}, o),
      body: m['tiktok.step_3_body']({}, o),
    },
    {
      title: m['tiktok.step_4_title']({}, o),
      body: m['tiktok.step_4_body']({}, o),
    },
    {
      title: m['tiktok.step_5_title']({}, o),
      body: m['tiktok.step_5_body']({}, o),
    },
  ];
}

function faqItems(locale?: ReturnType<typeof getLocale>) {
  const o = { locale };
  return [
    { question: m['tiktok.faq_q1']({}, o), answer: m['tiktok.faq_a1']({}, o) },
    { question: m['tiktok.faq_q2']({}, o), answer: m['tiktok.faq_a2']({}, o) },
    { question: m['tiktok.faq_q3']({}, o), answer: m['tiktok.faq_a3']({}, o) },
    { question: m['tiktok.faq_q4']({}, o), answer: m['tiktok.faq_a4']({}, o) },
    { question: m['tiktok.faq_q5']({}, o), answer: m['tiktok.faq_a5']({}, o) },
  ];
}

function RemoveMatchaFilterTikTokPage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <MatchaHeader />
      <main>
        <ToolSection
          defaultMode="video"
          eyebrow={m['tiktok.eyebrow']()}
          heading={m['tiktok.h1']()}
          subhead={m['tiktok.subhead']()}
          chooseFile={m['tool.cta_video']()}
        />

        <ProseSection
          title={m['tiktok.source_title']()}
          paragraphs={[
            m['tiktok.source_body_1'](),
            m['tiktok.source_body_2'](),
          ]}
          tone="muted"
        />

        <ProseSection title={m['tiktok.steps_title']()}>
          <StepList steps={workflowSteps()} />
        </ProseSection>

        <ProseSection
          title={m['tiktok.compression_title']()}
          paragraphs={[
            m['tiktok.compression_body_1'](),
            m['tiktok.compression_body_2'](),
          ]}
          tone="muted"
        />

        <RecoveryBoundary />

        <VideoEvidence />

        <FaqList title={m['tiktok.faq_title']()} items={faqItems()} />

        <LinkCards
          title={m['home.related_title']()}
          cards={[
            {
              href: '/from-video',
              title: m['home.paths_video_title'](),
              body: m['home.paths_video_body'](),
              cta: m['home.paths_video_cta'](),
            },
            {
              href: '/remove-matcha-filter-capcut',
              title: m['platform.capcut_card_title'](),
              body: m['platform.capcut_card_body'](),
              cta: m['platform.capcut_card_cta'](),
            },
            {
              href: '/how-to-remove-matcha-filter',
              title: m['home.guide_card_title'](),
              body: m['home.guide_card_body'](),
              cta: m['home.guide_card_cta'](),
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

export const Route = createFileRoute('/remove-matcha-filter-tiktok')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['tiktok.meta_title']({}, { locale }),
      description: m['tiktok.meta_description']({}, { locale }),
      faq: faqItems(locale),
      crumbs: [
        { name: m['breadcrumb.home']({}, { locale }), path: '/' },
        {
          name: m['breadcrumb.tiktok']({}, { locale }),
          path: '/remove-matcha-filter-tiktok',
        },
      ],
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          path: '/remove-matcha-filter-tiktok',
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
  component: RemoveMatchaFilterTikTokPage,
});
