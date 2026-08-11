import { ArrowRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';

export interface LinkCard {
  href: string;
  title: string;
  body: string;
  cta: string;
}

/** Internal cross-links between the three tool pages. */
export function LinkCards({
  title,
  cards,
}: {
  title: string;
  cards: LinkCard[];
}) {
  return (
    <section className="px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-title mb-10 font-serif font-normal text-balance">
          {title}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group border-border/80 bg-card hover:border-foreground/20 relative flex flex-col rounded-2xl border p-7 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-12px_rgba(0,0,0,0.12)]"
            >
              <h3 className="font-serif text-[1.3rem] leading-tight font-normal tracking-[-0.01em]">
                {card.title}
              </h3>
              <p className="text-muted-foreground mt-3 text-[15.5px] leading-[1.7] text-pretty">
                {card.body}
              </p>
              <span className="text-foreground mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium">
                {card.cta}
                <ArrowRight
                  className="size-3.5 transition-transform duration-200 group-hover:translate-x-1"
                  strokeWidth={2.25}
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
