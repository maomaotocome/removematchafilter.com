import { createFileRoute } from '@tanstack/react-router';

import {
  articleSchema,
  breadcrumbSchema,
  faqSchema,
  jsonLdScript,
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
  InlineCta,
} from '@/components/matcha/article';
import { FaqList } from '@/components/matcha/faq-list';
import { LinkCards } from '@/components/matcha/link-cards';
import { StepList } from '@/components/matcha/prose-section';

const PUBLISHED_AT = '2026-08-09';

function faqItems(locale?: ReturnType<typeof getLocale>) {
  const o = { locale };
  return [
    { question: m['trend.faq_q1']({}, o), answer: m['trend.faq_a1']({}, o) },
    { question: m['trend.faq_q2']({}, o), answer: m['trend.faq_a2']({}, o) },
    { question: m['trend.faq_q3']({}, o), answer: m['trend.faq_a3']({}, o) },
    { question: m['trend.faq_q4']({}, o), answer: m['trend.faq_a4']({}, o) },
    { question: m['trend.faq_q5']({}, o), answer: m['trend.faq_a5']({}, o) },
  ];
}

function MatchaFilterTrendPage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <MatchaHeader />
      <main>
        <ArticleHero
          eyebrow={m['trend.eyebrow']()}
          title={m['trend.h1']()}
          lede={m['trend.lede']()}
          updatedLabel={m['article.updated']()}
          breadcrumbs={[
            { href: '/', label: m['breadcrumb.home']() },
            {
              href: '/matcha-filter-trend',
              label: m['breadcrumb.trend'](),
            },
          ]}
        />

        <ArticleSection
          title={m['trend.what_title']()}
          paragraphs={[m['trend.what_body_1'](), m['trend.what_body_2']()]}
        >
          <FactGrid
            items={[
              {
                label: m['trend.fact_1_label'](),
                value: m['trend.fact_1_value'](),
              },
              {
                label: m['trend.fact_2_label'](),
                value: m['trend.fact_2_value'](),
              },
              {
                label: m['trend.fact_3_label'](),
                value: m['trend.fact_3_value'](),
              },
              {
                label: m['trend.fact_4_label'](),
                value: m['trend.fact_4_value'](),
              },
            ]}
          />
        </ArticleSection>

        <ArticleSection
          title={m['trend.layers_title']()}
          paragraphs={[m['trend.layers_intro']()]}
          tone="muted"
        >
          <ExplainedList
            items={[
              {
                title: m['trend.layer_1_title'](),
                body: m['trend.layer_1_body'](),
              },
              {
                title: m['trend.layer_2_title'](),
                body: m['trend.layer_2_body'](),
              },
              {
                title: m['trend.layer_3_title'](),
                body: m['trend.layer_3_body'](),
              },
              {
                title: m['trend.layer_4_title'](),
                body: m['trend.layer_4_body'](),
              },
              {
                title: m['trend.layer_5_title'](),
                body: m['trend.layer_5_body'](),
              },
            ]}
          />
        </ArticleSection>

        <ArticleSection
          title={m['trend.spread_title']()}
          paragraphs={[m['trend.spread_body_1'](), m['trend.spread_body_2']()]}
        />

        <ArticleSection
          title={m['trend.adult_title']()}
          paragraphs={[m['trend.adult_body_1'](), m['trend.adult_body_2']()]}
          tone="muted"
        />

        <ArticleSection
          title={m['trend.official_title']()}
          paragraphs={[
            m['trend.official_body_1'](),
            m['trend.official_body_2'](),
          ]}
        />

        <RecoveryBoundary tone="muted" />

        <ArticleSection
          title={m['trend.remove_title']()}
          paragraphs={[m['trend.remove_body_1']()]}
        >
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
          <InlineCta href="/#tool" label={m['trend.remove_cta']()} />
        </ArticleSection>

        <ArticleSection
          title={m['trend.callout_title']()}
          paragraphs={[m['trend.callout_body']()]}
          tone="muted"
        />

        <FaqList title={m['trend.faq_title']()} items={faqItems()} />

        <LinkCards
          title={m['home.related_title']()}
          cards={[
            {
              href: '/how-to-remove-matcha-filter',
              title: m['home.guide_card_title'](),
              body: m['home.guide_card_body'](),
              cta: m['home.guide_card_cta'](),
            },
            {
              href: '/from-video',
              title: m['home.paths_video_title'](),
              body: m['home.paths_video_body'](),
              cta: m['home.paths_video_cta'](),
            },
          ]}
        />
      </main>
      <MatchaFooter />
    </div>
  );
}

export const Route = createFileRoute('/matcha-filter-trend')({
  loader: () => {
    const locale = getLocale();
    const title = m['trend.meta_title']({}, { locale });
    const description = m['trend.meta_description']({}, { locale });
    const faq = faqItems(locale);
    const crumbs = [
      { name: m['breadcrumb.home']({}, { locale }), path: '/' },
      {
        name: m['breadcrumb.trend']({}, { locale }),
        path: '/matcha-filter-trend',
      },
    ];
    return { locale, title, description, faq, crumbs };
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          path: '/matcha-filter-trend',
          title: loaderData.title,
          description: loaderData.description,
          locale: loaderData.locale,
          scripts: [
            jsonLdScript([
              organizationSchema(),
              websiteSchema(),
              articleSchema({
                path: '/matcha-filter-trend',
                headline: loaderData.title,
                description: loaderData.description,
                locale: loaderData.locale,
                datePublished: PUBLISHED_AT,
              }),
              breadcrumbSchema(loaderData.crumbs, loaderData.locale),
              faqSchema(loaderData.faq),
            ]),
          ],
        })
      : {},
  component: MatchaFilterTrendPage,
});
