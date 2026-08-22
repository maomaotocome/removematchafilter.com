import { createFileRoute } from '@tanstack/react-router';

import {
  editorialTeamSchema,
  faqSchema,
  jsonLdScript,
  maintainerSchema,
  organizationSchema,
  webAppFeatures,
  webApplicationSchema,
  webPageSchema,
  websiteSchema,
} from '@/lib/matcha/schema';
import { pageHead } from '@/lib/matcha/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Examples } from '@/blocks/matcha/examples';
import { Provenance } from '@/blocks/matcha/provenance';
import { RecoveryBoundary } from '@/blocks/matcha/recovery-boundary';
import { MatchaFooter, MatchaHeader } from '@/blocks/matcha/site-chrome';
import { ToolSection } from '@/blocks/matcha/tool-section';
import { InlineCta } from '@/components/matcha/article';
import { FaqList } from '@/components/matcha/faq-list';
import { LinkCards } from '@/components/matcha/link-cards';
import { ProseSection, StepList } from '@/components/matcha/prose-section';

/**
 * The single source for the homepage Q&A. Both `<FaqList>` and the FAQPage
 * JSON-LD read from here, so the structured data cannot drift from the visible
 * answers. `locale` is passed explicitly because the loader resolves it
 * server-side.
 */
function faqItems(locale?: ReturnType<typeof getLocale>) {
  const o = { locale };
  return [
    { question: m['home.faq_q1']({}, o), answer: m['home.faq_a1']({}, o) },
    { question: m['home.faq_q2']({}, o), answer: m['home.faq_a2']({}, o) },
    { question: m['home.faq_q3']({}, o), answer: m['home.faq_a3']({}, o) },
    { question: m['home.faq_q4']({}, o), answer: m['home.faq_a4']({}, o) },
    { question: m['home.faq_q5']({}, o), answer: m['home.faq_a5']({}, o) },
    { question: m['home.faq_q6']({}, o), answer: m['home.faq_a6']({}, o) },
    { question: m['home.faq_q7']({}, o), answer: m['home.faq_a7']({}, o) },
  ];
}

function HomePage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <MatchaHeader />
      <main>
        <ToolSection
          defaultMode="photo"
          heading={m['home.h1']()}
          subhead={m['home.subhead']()}
          chooseFile={m['tool.cta_file']()}
        />

        {/* Show the outcome immediately after the working tool. Visitors can
            validate the result before reading the method or background. */}
        <Examples />

        <RecoveryBoundary tone="muted" />

        <ProseSection id="how-it-works" title={m['home.how_title']()}>
          <StepList
            steps={[
              {
                title: m['home.how_1_title'](),
                body: m['home.how_1_body'](),
              },
              {
                title: m['home.how_2_title'](),
                body: m['home.how_2_body'](),
              },
              {
                title: m['home.how_3_title'](),
                body: m['home.how_3_body'](),
              },
            ]}
          />
        </ProseSection>

        <ProseSection
          title={m['home.privacy_title']()}
          paragraphs={[m['home.privacy_body']()]}
          tone="muted"
        />

        <LinkCards
          title={m['home.paths_title']()}
          cards={[
            {
              href: '/from-photo',
              title: m['home.paths_photo_title'](),
              body: m['home.paths_photo_body'](),
              cta: m['home.paths_photo_cta'](),
            },
            {
              href: '/from-video',
              title: m['home.paths_video_title'](),
              body: m['home.paths_video_body'](),
              cta: m['home.paths_video_cta'](),
            },
          ]}
        />

        <LinkCards
          title={m['platforms.title']()}
          cards={[
            {
              href: '/remove-matcha-filter-tiktok',
              title: m['platform.tiktok_card_title'](),
              body: m['platform.tiktok_card_body'](),
              cta: m['platform.tiktok_card_cta'](),
            },
          ]}
        />

        <FaqList id="faq" title={m['home.faq_title']()} items={faqItems()} />

        <ProseSection
          title={m['home.trend_title']()}
          paragraphs={[m['home.trend_body_1'](), m['home.trend_body_2']()]}
        >
          <InlineCta
            href="/matcha-filter-trend"
            label={m['home.trend_link']()}
          />
        </ProseSection>

        <ProseSection
          title={m['home.naming_title']()}
          paragraphs={[m['home.naming_body'](), m['home.naming_body_2']()]}
          tone="muted"
        />

        <Provenance />

        <hr className="rule-fade mx-auto max-w-5xl" />

        <LinkCards
          title={m['home.learn_title']()}
          cards={[
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

export const Route = createFileRoute('/')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['home.meta_title']({}, { locale }),
      description: m['home.meta_description']({}, { locale }),
      // Built in the loader so the JSON-LD ships in the server HTML. The FAQ
      // nodes come from the same faqItems() the page renders, so question and
      // answer text match the visible <dl> verbatim.
      faq: faqItems(locale),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          path: '/',
          title: loaderData.title,
          description: loaderData.description,
          locale: loaderData.locale,
          scripts: [
            jsonLdScript([
              organizationSchema(),
              editorialTeamSchema(),
              maintainerSchema(),
              websiteSchema(),
              webPageSchema({
                path: '/',
                name: loaderData.title,
                description: loaderData.description,
                locale: loaderData.locale,
              }),
              webApplicationSchema(webAppFeatures),
              faqSchema(loaderData.faq),
            ]),
          ],
        })
      : {},
  component: HomePage,
});
