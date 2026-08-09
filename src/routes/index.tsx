import { createFileRoute } from '@tanstack/react-router';

import {
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
import { MatchaFooter, MatchaHeader } from '@/blocks/matcha/site-chrome';
import { ToolSection } from '@/blocks/matcha/tool-section';
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

        <Examples />

        <ProseSection
          title={m['home.expect_title']()}
          paragraphs={[m['home.expect_body']()]}
          tone="muted"
        >
          <h3 className="pt-4 text-lg font-medium">
            {m['home.expect_honest_title']()}
          </h3>
          <p className="text-muted-foreground text-[15px] leading-7">
            {m['home.expect_honest_body']()}
          </p>
        </ProseSection>

        <ProseSection
          title={m['home.naming_title']()}
          paragraphs={[m['home.naming_body']()]}
        />

        {/* Two adjacent untinted sections need a divider; tone="muted" blocks
            already separate themselves with their background. */}
        <hr className="rule-fade mx-auto max-w-2xl" />

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

        <hr className="rule-fade mx-auto max-w-5xl" />

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

        <ProseSection
          title={m['home.privacy_title']()}
          paragraphs={[m['home.privacy_body']()]}
          tone="muted"
        />

        <FaqList id="faq" title={m['home.faq_title']()} items={faqItems()} />
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
              websiteSchema(),
              webApplicationSchema(webAppFeatures),
              faqSchema(loaderData.faq),
            ]),
          ],
        })
      : {},
  component: HomePage,
});
