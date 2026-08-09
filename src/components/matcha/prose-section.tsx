import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** Server-rendered prose block. Content via props; no i18n reads here. */
export function ProseSection({
  id,
  title,
  paragraphs,
  children,
  className,
  tone = 'default',
}: {
  id?: string;
  title: string;
  paragraphs?: string[];
  children?: ReactNode;
  className?: string;
  tone?: 'default' | 'muted';
}) {
  return (
    <section
      id={id}
      className={cn(
        'relative px-4 py-16 sm:py-24',
        tone === 'muted' && 'paper-grain bg-muted/50 overflow-hidden',
        className
      )}
    >
      <div className="mx-auto max-w-2xl">
        <h2 className="text-title font-serif font-normal text-balance">
          {title}
        </h2>
        {/* Measure is capped near 68ch — comfortable for long-form reading and
            narrower than the heading, which gives the block a shape. */}
        <div className="mt-6 space-y-5">
          {paragraphs?.map((paragraph) => (
            <p
              key={paragraph.slice(0, 40)}
              className="text-muted-foreground text-[16.5px] leading-[1.75] text-pretty"
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

/** Numbered steps, rendered as an ordered list so it reads without CSS. */
export function StepList({
  steps,
}: {
  steps: { title: string; body: string }[];
}) {
  return (
    // A hairline runs down the left edge so the three steps read as one
    // sequence; each numeral sits on the line, in the serif face to tie the
    // list back to the headings.
    <ol className="border-border/70 mt-8 space-y-9 border-l pl-7">
      {steps.map((step, index) => (
        <li key={step.title} className="relative">
          <span
            aria-hidden="true"
            className="border-border/70 bg-background text-foreground absolute top-0 -left-[2.3rem] inline-flex size-[1.9rem] items-center justify-center rounded-full border font-serif text-[13px]"
          >
            {index + 1}
          </span>
          <h3 className="text-[15.5px] leading-6 font-semibold tracking-[-0.005em]">
            {step.title}
          </h3>
          <p className="text-muted-foreground mt-2 text-[16.5px] leading-[1.75] text-pretty">
            {step.body}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Plain bulleted tips. */
export function TipList({ tips }: { tips: string[] }) {
  return (
    <ul className="mt-6 space-y-4">
      {tips.map((tip) => (
        <li
          key={tip.slice(0, 40)}
          className="text-muted-foreground relative pl-5 text-[16.5px] leading-[1.75] text-pretty"
        >
          <span
            aria-hidden="true"
            className="bg-border absolute top-[0.7em] left-0 h-px w-2.5"
          />
          {tip}
        </li>
      ))}
    </ul>
  );
}
