import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';

export function ArticleHero({
  eyebrow,
  title,
  lede,
  updatedLabel,
  breadcrumbs,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  updatedLabel: string;
  breadcrumbs: { href: string; label: string }[];
}) {
  return (
    <header className="paper-grain border-border/70 border-b px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <li key={item.href} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true">/</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span aria-current="page">{item.label}</span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.2em] uppercase">
          {eyebrow}
        </p>
        <h1 className="text-display mt-4 max-w-[18ch] font-serif font-normal text-balance">
          {title}
        </h1>
        <p className="text-muted-foreground text-lede mt-5 max-w-2xl text-pretty">
          {lede}
        </p>
        <p className="text-muted-foreground mt-6 text-xs">{updatedLabel}</p>
      </div>
    </header>
  );
}

export function ArticleSection({
  id,
  title,
  paragraphs,
  children,
  tone = 'default',
}: {
  id?: string;
  title: string;
  paragraphs?: string[];
  children?: ReactNode;
  tone?: 'default' | 'muted';
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-24 px-4 py-14 sm:py-20',
        tone === 'muted' && 'paper-grain bg-muted/50'
      )}
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="text-title max-w-2xl font-serif font-normal text-balance">
          {title}
        </h2>
        <div className="mt-6 space-y-5">
          {paragraphs?.map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className="text-muted-foreground max-w-[70ch] text-[16.5px] leading-[1.8] text-pretty"
            >
              {paragraph}
            </p>
          ))}
          {children}
        </div>
      </div>
    </section>
  );
}

export function FactGrid({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <dl className="grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="bg-card p-5 sm:p-6">
          <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {item.label}
          </dt>
          <dd className="mt-2 text-[15.5px] leading-7">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ExplainedList({
  items,
}: {
  items: { title: string; body: string }[];
}) {
  return (
    <ol className="mt-8 grid gap-4 sm:grid-cols-2">
      {items.map((item, index) => (
        <li
          key={item.title}
          className="border-border bg-card rounded-2xl border p-5"
        >
          <span className="text-muted-foreground font-serif text-sm">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className="mt-3 text-base font-semibold">{item.title}</h3>
          <p className="text-muted-foreground mt-2 text-[15.5px] leading-7">
            {item.body}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function GuideSteps({
  steps,
}: {
  steps: { title: string; body: string }[];
}) {
  return (
    <ol className="border-border/70 mt-8 space-y-10 border-l pl-8">
      {steps.map((step, index) => (
        <li
          id={`step-${index + 1}`}
          key={step.title}
          className="relative scroll-mt-24"
        >
          <span
            aria-hidden="true"
            className="border-border bg-background absolute top-0 -left-[2.65rem] inline-flex size-8 items-center justify-center rounded-full border font-serif text-sm"
          >
            {index + 1}
          </span>
          <h3 className="text-lg font-semibold">{step.title}</h3>
          <p className="text-muted-foreground mt-2 max-w-[66ch] text-[16.5px] leading-[1.8] text-pretty">
            {step.body}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function NoteCallout({ title, body }: { title: string; body: string }) {
  return (
    <aside className="border-border bg-card rounded-2xl border p-6 sm:p-7">
      <h3 className="font-serif text-xl">{title}</h3>
      <p className="text-muted-foreground mt-3 text-[15.5px] leading-7">
        {body}
      </p>
    </aside>
  );
}

export function InlineCta({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors"
    >
      {label}
      <ArrowRight className="size-4" />
    </Link>
  );
}
