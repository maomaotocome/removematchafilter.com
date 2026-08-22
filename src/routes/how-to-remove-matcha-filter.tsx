import { createFileRoute } from '@tanstack/react-router';

import {
  articleSchema,
  breadcrumbSchema,
  editorialTeamSchema,
  faqSchema,
  howToSchema,
  jsonLdScript,
  maintainerSchema,
  organizationSchema,
  websiteSchema,
} from '@/lib/matcha/schema';
import { pageHead } from '@/lib/matcha/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { RecoveryBoundary } from '@/blocks/matcha/recovery-boundary';
import { MatchaFooter, MatchaHeader } from '@/blocks/matcha/site-chrome';
import {
  ArticleHero,
  ArticleSection,
  ExplainedList,
  FactGrid,
  GuideSteps,
  NoteCallout,
} from '@/components/matcha/article';
import { FaqList } from '@/components/matcha/faq-list';
import { LinkCards } from '@/components/matcha/link-cards';

const PUBLISHED_AT = '2026-08-09';
const MODIFIED_AT = '2026-08-22';

function guideSteps(locale?: ReturnType<typeof getLocale>) {
  const o = { locale };
  return [
    {
      title: m['guide.step_1_title']({}, o),
      body: m['guide.step_1_body']({}, o),
    },
    {
      title: m['guide.step_2_title']({}, o),
      body: m['guide.step_2_body']({}, o),
    },
    {
      title: m['guide.step_3_title']({}, o),
      body: m['guide.step_3_body']({}, o),
    },
    {
      title: m['guide.step_4_title']({}, o),
      body: m['guide.step_4_body']({}, o),
    },
    {
      title: m['guide.step_5_title']({}, o),
      body: m['guide.step_5_body']({}, o),
    },
  ];
}

function faqItems(locale?: ReturnType<typeof getLocale>) {
  const o = { locale };
  return [
    { question: m['guide.faq_q1']({}, o), answer: m['guide.faq_a1']({}, o) },
    { question: m['guide.faq_q2']({}, o), answer: m['guide.faq_a2']({}, o) },
    { question: m['guide.faq_q3']({}, o), answer: m['guide.faq_a3']({}, o) },
    { question: m['guide.faq_q4']({}, o), answer: m['guide.faq_a4']({}, o) },
    { question: m['guide.faq_q5']({}, o), answer: m['guide.faq_a5']({}, o) },
  ];
}

function HowToRemoveMatchaFilterPage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <MatchaHeader />
      <main>
        <ArticleHero
          eyebrow={m['guide.eyebrow']()}
          title={m['guide.h1']()}
          lede={m['guide.lede']()}
          byline={m['article.byline']()}
          updatedLabel={m['article.updated']()}
          breadcrumbs={[
            { href: '/', label: m['breadcrumb.home']() },
            {
              href: '/how-to-remove-matcha-filter',
              label: m['breadcrumb.guide'](),
            },
          ]}
        />

        <ArticleSection
          title={m['guide.before_title']()}
          paragraphs={[m['guide.before_body_1'](), m['guide.before_body_2']()]}
        >
          <NoteCallout
            title={m['guide.note_title']()}
            body={m['guide.note_body']()}
          />
        </ArticleSection>

        <ArticleSection title={m['guide.steps_title']()} tone="muted">
          <GuideSteps steps={guideSteps()} />
        </ArticleSection>

        <LinkCards
          title={m['home.related_title']()}
          cards={[
            {
              href: '/from-photo',
              title: m['guide.photo_cta'](),
              body: m['home.paths_photo_body'](),
              cta: m['home.paths_photo_cta'](),
            },
            {
              href: '/from-video',
              title: m['guide.video_cta'](),
              body: m['home.paths_video_body'](),
              cta: m['home.paths_video_cta'](),
            },
          ]}
        />

        <ArticleSection title={m['guide.format_title']()}>
          <FactGrid
            items={[
              {
                label: m['guide.format_1_label'](),
                value: m['guide.format_1_value'](),
              },
              {
                label: m['guide.format_2_label'](),
                value: m['guide.format_2_value'](),
              },
              {
                label: m['guide.format_3_label'](),
                value: m['guide.format_3_value'](),
              },
              {
                label: m['guide.format_4_label'](),
                value: m['guide.format_4_value'](),
              },
            ]}
          />
        </ArticleSection>

        <LinkCards
          title={m['platforms.title']()}
          cards={[
            {
              href: '/remove-matcha-filter-tiktok',
              title: m['platform.tiktok_card_title'](),
              body: m['platform.tiktok_card_body'](),
              cta: m['platform.tiktok_card_cta'](),
            },
            {
              href: '/remove-matcha-filter-capcut',
              title: m['platform.capcut_card_title'](),
              body: m['platform.capcut_card_body'](),
              cta: m['platform.capcut_card_cta'](),
            },
          ]}
        />

        <ArticleSection title={m['guide.problems_title']()} tone="muted">
          <ExplainedList
            items={[
              {
                title: m['guide.problem_1_title'](),
                body: m['guide.problem_1_body'](),
              },
              {
                title: m['guide.problem_2_title'](),
                body: m['guide.problem_2_body'](),
              },
              {
                title: m['guide.problem_3_title'](),
                body: m['guide.problem_3_body'](),
              },
              {
                title: m['guide.problem_4_title'](),
                body: m['guide.problem_4_body'](),
              },
            ]}
          />
        </ArticleSection>

        <RecoveryBoundary />

        <ArticleSection
          title={m['guide.finish_title']()}
          paragraphs={[m['guide.finish_body']()]}
          tone="muted"
        />

        <FaqList title={m['guide.faq_title']()} items={faqItems()} />
      </main>
      <MatchaFooter />
    </div>
  );
}

export const Route = createFileRoute('/how-to-remove-matcha-filter')({
  loader: () => {
    const locale = getLocale();
    const title = m['guide.meta_title']({}, { locale });
    const description = m['guide.meta_description']({}, { locale });
    const steps = guideSteps(locale);
    const tools = [
      m['guide.schema_tool_browser']({}, { locale }),
      m['guide.schema_tool_media']({}, { locale }),
    ];
    const faq = faqItems(locale);
    const crumbs = [
      { name: m['breadcrumb.home']({}, { locale }), path: '/' },
      {
        name: m['breadcrumb.guide']({}, { locale }),
        path: '/how-to-remove-matcha-filter',
      },
    ];
    return { locale, title, description, steps, tools, faq, crumbs };
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          path: '/how-to-remove-matcha-filter',
          title: loaderData.title,
          description: loaderData.description,
          locale: loaderData.locale,
          scripts: [
            jsonLdScript([
              organizationSchema(),
              editorialTeamSchema(),
              maintainerSchema(),
              websiteSchema(),
              articleSchema({
                path: '/how-to-remove-matcha-filter',
                headline: loaderData.title,
                description: loaderData.description,
                locale: loaderData.locale,
                datePublished: PUBLISHED_AT,
                dateModified: MODIFIED_AT,
              }),
              howToSchema({
                path: '/how-to-remove-matcha-filter',
                name: loaderData.title,
                description: loaderData.description,
                steps: loaderData.steps.map((step) => ({
                  name: step.title,
                  text: step.body,
                })),
                tools: loaderData.tools,
                locale: loaderData.locale,
              }),
              breadcrumbSchema(loaderData.crumbs, loaderData.locale),
              faqSchema(loaderData.faq),
            ]),
          ],
        })
      : {},
  component: HowToRemoveMatchaFilterPage,
});
