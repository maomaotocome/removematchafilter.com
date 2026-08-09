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
    { question: m['photo.faq_q1']({}, o), answer: m['photo.faq_a1']({}, o) },
    { question: m['photo.faq_q2']({}, o), answer: m['photo.faq_a2']({}, o) },
    { question: m['photo.faq_q3']({}, o), answer: m['photo.faq_a3']({}, o) },
    { question: m['photo.faq_q4']({}, o), answer: m['photo.faq_a4']({}, o) },
    { question: m['home.faq_q1']({}, o), answer: m['home.faq_a1']({}, o) },
    { question: m['home.faq_q2']({}, o), answer: m['home.faq_a2']({}, o) },
  ];
}

/**
 * Photo-intent page. Renders the same <ToolSection> as `/` and `/from-video`,
 * differing only in `defaultMode` and the surrounding copy.
 */
function FromPhotoPage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <MatchaHeader />
      <main>
        <ToolSection
          defaultMode="photo"
          eyebrow={m['tool.mode_photo']()}
          heading={m['photo.h1']()}
          subhead={m['photo.subhead']()}
          chooseFile={m['tool.cta_photo']()}
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
          title={m['photo.body_title']()}
          paragraphs={[
            m['photo.intent_line'](),
            m['photo.body_1'](),
            m['photo.body_2'](),
            m['photo.body_3'](),
          ]}
          tone="muted"
        />

        <ProseSection title={m['photo.workflow_title']()}>
          <StepList
            steps={[
              {
                title: m['photo.workflow_1_title'](),
                body: m['photo.workflow_1_body'](),
              },
              {
                title: m['photo.workflow_2_title'](),
                body: m['photo.workflow_2_body'](),
              },
              {
                title: m['photo.workflow_3_title'](),
                body: m['photo.workflow_3_body'](),
              },
            ]}
          />
        </ProseSection>

        <ProseSection title={m['photo.tips_title']()}>
          <TipList
            tips={[
              m['photo.tip_1'](),
              m['photo.tip_2'](),
              m['photo.tip_3'](),
              m['photo.tip_4'](),
            ]}
          />
          <InlineCta
            href="/how-to-remove-matcha-filter"
            label={m['photo.guide_cta']()}
          />
        </ProseSection>

        <FaqList id="faq" title={m['home.faq_title']()} items={faqItems()} />

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

export const Route = createFileRoute('/from-photo')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['photo.meta_title']({}, { locale }),
      description: m['photo.meta_description']({}, { locale }),
      faq: faqItems(locale),
      crumbs: [
        { name: m['breadcrumb.home']({}, { locale }), path: '/' },
        { name: m['breadcrumb.photo']({}, { locale }), path: '/from-photo' },
      ],
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          path: '/from-photo',
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
  component: FromPhotoPage,
});
