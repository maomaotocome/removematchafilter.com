import { createFileRoute } from '@tanstack/react-router';

import {
  articleSchema,
  breadcrumbSchema,
  editorialTeamSchema,
  faqSchema,
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
  GuideSteps,
  InlineCta,
  NoteCallout,
} from '@/components/matcha/article';
import { FaqList } from '@/components/matcha/faq-list';
import { LinkCards } from '@/components/matcha/link-cards';

const PUBLISHED_AT = '2026-08-22';
const MODIFIED_AT = '2026-08-22';

function projectSteps(locale?: ReturnType<typeof getLocale>) {
  const o = { locale };
  return [
    {
      title: m['capcut.step_1_title']({}, o),
      body: m['capcut.step_1_body']({}, o),
    },
    {
      title: m['capcut.step_2_title']({}, o),
      body: m['capcut.step_2_body']({}, o),
    },
    {
      title: m['capcut.step_3_title']({}, o),
      body: m['capcut.step_3_body']({}, o),
    },
  ];
}

function faqItems(locale?: ReturnType<typeof getLocale>) {
  const o = { locale };
  return [
    { question: m['capcut.faq_q1']({}, o), answer: m['capcut.faq_a1']({}, o) },
    { question: m['capcut.faq_q2']({}, o), answer: m['capcut.faq_a2']({}, o) },
    { question: m['capcut.faq_q3']({}, o), answer: m['capcut.faq_a3']({}, o) },
    { question: m['capcut.faq_q4']({}, o), answer: m['capcut.faq_a4']({}, o) },
    { question: m['capcut.faq_q5']({}, o), answer: m['capcut.faq_a5']({}, o) },
  ];
}

function RemoveMatchaFilterCapCutPage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <MatchaHeader />
      <main>
        <ArticleHero
          eyebrow={m['capcut.eyebrow']()}
          title={m['capcut.h1']()}
          lede={m['capcut.lede']()}
          byline={m['article.byline']()}
          updatedLabel={m['platform.updated']()}
          breadcrumbs={[
            { href: '/', label: m['breadcrumb.home']() },
            {
              href: '/remove-matcha-filter-capcut',
              label: m['breadcrumb.capcut'](),
            },
          ]}
        />

        <ArticleSection title={m['capcut.decision_title']()}>
          <ExplainedList
            items={[
              {
                title: m['capcut.decision_project_title'](),
                body: m['capcut.decision_project_body'](),
              },
              {
                title: m['capcut.decision_export_title'](),
                body: m['capcut.decision_export_body'](),
              },
            ]}
          />
        </ArticleSection>

        <ArticleSection
          title={m['capcut.project_title']()}
          paragraphs={[
            m['capcut.project_body_1'](),
            m['capcut.project_body_2'](),
          ]}
          tone="muted"
        >
          <GuideSteps steps={projectSteps()} />
        </ArticleSection>

        <ArticleSection
          title={m['capcut.export_title']()}
          paragraphs={[
            m['capcut.export_body_1'](),
            m['capcut.export_body_2'](),
          ]}
        >
          <InlineCta href="/from-video#tool" label={m['capcut.export_cta']()} />
        </ArticleSection>

        <RecoveryBoundary tone="muted" />

        <ArticleSection title={m['capcut.limits_title']()}>
          <NoteCallout
            title={m['capcut.limits_title']()}
            body={m['capcut.limits_body']()}
          />
        </ArticleSection>

        <ArticleSection
          title={m['capcut.sources_title']()}
          paragraphs={[m['capcut.sources_intro']()]}
          tone="muted"
        >
          <ul className="border-border bg-card overflow-hidden rounded-2xl border">
            <li className="border-border border-b p-5 sm:px-6">
              <a
                href="https://www.capcut.com/resource/capcut-filter"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline decoration-1 underline-offset-4"
              >
                {m['capcut.source_filters']()}
              </a>
            </li>
            <li className="border-border border-b p-5 sm:px-6">
              <a
                href="https://www.capcut.com/help/effectss-not-applying-in-capcut"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline decoration-1 underline-offset-4"
              >
                {m['capcut.source_effects']()}
              </a>
            </li>
            <li className="p-5 sm:px-6">
              <a
                href="https://www.capcut.com/help/how-to-remove-pro-features"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline decoration-1 underline-offset-4"
              >
                {m['capcut.source_remove']()}
              </a>
            </li>
          </ul>
        </ArticleSection>

        <FaqList title={m['capcut.faq_title']()} items={faqItems()} />

        <LinkCards
          title={m['home.related_title']()}
          cards={[
            {
              href: '/remove-matcha-filter-tiktok',
              title: m['platform.tiktok_card_title'](),
              body: m['platform.tiktok_card_body'](),
              cta: m['platform.tiktok_card_cta'](),
            },
            {
              href: '/from-video',
              title: m['home.paths_video_title'](),
              body: m['home.paths_video_body'](),
              cta: m['home.paths_video_cta'](),
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

export const Route = createFileRoute('/remove-matcha-filter-capcut')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['capcut.meta_title']({}, { locale }),
      description: m['capcut.meta_description']({}, { locale }),
      headline: m['capcut.h1']({}, { locale }),
      faq: faqItems(locale),
      crumbs: [
        { name: m['breadcrumb.home']({}, { locale }), path: '/' },
        {
          name: m['breadcrumb.capcut']({}, { locale }),
          path: '/remove-matcha-filter-capcut',
        },
      ],
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          path: '/remove-matcha-filter-capcut',
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
                path: '/remove-matcha-filter-capcut',
                headline: loaderData.headline,
                description: loaderData.description,
                locale: loaderData.locale,
                datePublished: PUBLISHED_AT,
                dateModified: MODIFIED_AT,
              }),
              breadcrumbSchema(loaderData.crumbs, loaderData.locale),
              faqSchema(loaderData.faq),
            ]),
          ],
        })
      : {},
  component: RemoveMatchaFilterCapCutPage,
});
