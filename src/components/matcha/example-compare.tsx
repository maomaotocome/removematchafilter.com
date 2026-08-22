import { useId, useState } from 'react';
import { ArrowRight } from 'lucide-react';

export interface ExampleItem {
  title: string;
  body: string;
  before: string;
  after: string;
  beforeWebp: string;
  afterWebp: string;
  beforeWebpSmall: string;
  afterWebpSmall: string;
  beforeWebpMedium: string;
  afterWebpMedium: string;
  beforeWebpLarge: string;
  afterWebpLarge: string;
  width: number;
  height: number;
}

/**
 * Before/after slider. Both images are always in the DOM, so the comparison is
 * crawlable and readable without JS — the divider only adds the reveal.
 */
function Compare({
  item,
  beforeLabel,
  afterLabel,
}: {
  item: ExampleItem;
  beforeLabel: string;
  afterLabel: string;
}) {
  const [position, setPosition] = useState(50);
  const id = useId();

  return (
    <figure data-example-compare>
      <div className="border-border/80 bg-muted relative overflow-hidden rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_24px_-14px_rgba(0,0,0,0.15)]">
        <picture>
          <source
            type="image/webp"
            srcSet={`${item.afterWebpSmall} 480w, ${item.afterWebpMedium} 640w, ${item.afterWebpLarge} 1024w, ${item.afterWebp} ${item.width}w`}
            sizes="(min-width: 1024px) 640px, (min-width: 640px) calc(100vw - 64px), calc(100vw - 34px)"
          />
          <img
            src={item.after}
            alt={`${item.title} — ${afterLabel}`}
            width={item.width}
            height={item.height}
            className="block h-auto w-full"
            loading="lazy"
            decoding="async"
          />
        </picture>
        {/* Before image clipped to the divider position. */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${position}%` }}
        >
          <picture>
            <source
              type="image/webp"
              srcSet={`${item.beforeWebpSmall} 480w, ${item.beforeWebpMedium} 640w, ${item.beforeWebpLarge} 1024w, ${item.beforeWebp} ${item.width}w`}
              sizes="(min-width: 1024px) 640px, (min-width: 640px) calc(100vw - 64px), calc(100vw - 34px)"
            />
            <img
              src={item.before}
              alt={`${item.title} — ${beforeLabel}`}
              width={item.width}
              height={item.height}
              className="block h-full w-auto max-w-none object-cover object-left"
              style={{ width: `${(100 / Math.max(position, 1)) * 100}%` }}
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>
        <div
          aria-hidden="true"
          className="bg-background/90 absolute inset-y-0 w-0.5"
          style={{ left: `${position}%` }}
        />
        <span className="bg-background/85 text-foreground absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium tracking-[0.06em] uppercase backdrop-blur-sm">
          {beforeLabel}
        </span>
        <span className="bg-background/85 text-foreground absolute top-2.5 right-2.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium tracking-[0.06em] uppercase backdrop-blur-sm">
          {afterLabel}
        </span>
      </div>
      <label htmlFor={id} className="sr-only">
        {`${item.title}: ${beforeLabel} to ${afterLabel}`}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        className="[&::-moz-range-thumb]:bg-primary [&::-moz-range-track]:bg-secondary [&::-webkit-slider-runnable-track]:bg-secondary [&::-webkit-slider-thumb]:bg-primary mt-2 h-11 w-full cursor-ew-resize appearance-none bg-transparent [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:shadow-sm"
      />
      <figcaption className="mt-5">
        <h3 className="text-[15px] leading-6 font-semibold tracking-[-0.005em]">
          {item.title}
        </h3>
        <p className="text-muted-foreground mt-1.5 text-[15px] leading-[1.7] text-pretty">
          {item.body}
        </p>
      </figcaption>
    </figure>
  );
}

export function ExampleCompare({
  title,
  intro,
  honest,
  sceneLabel,
  ctaLabel,
  beforeLabel,
  afterLabel,
  items,
}: {
  title: string;
  intro: string;
  honest: string;
  sceneLabel: string;
  ctaLabel: string;
  beforeLabel: string;
  afterLabel: string;
  items: ExampleItem[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const panelId = useId();
  const activeItem = items[activeIndex] ?? items[0];

  if (!activeItem) return null;

  return (
    <section data-example-gallery className="paper-grain px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 max-w-2xl sm:mb-10">
          <h2 className="text-title font-serif font-normal text-balance">
            {title}
          </h2>
          <p className="text-muted-foreground mt-5 text-[16.5px] leading-[1.75] text-pretty">
            {intro}
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(16rem,0.8fr)] lg:gap-10">
          <div className="order-first min-w-0 lg:col-start-2 lg:row-start-1">
            <p className="text-muted-foreground mb-3 hidden text-[11px] font-medium tracking-[0.18em] uppercase lg:block">
              {sceneLabel}
            </p>
            <div
              role="group"
              aria-label={sceneLabel}
              className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] lg:block lg:overflow-hidden lg:rounded-xl lg:border lg:pb-0 [&::-webkit-scrollbar]:hidden"
            >
              {items.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  data-example-option
                  aria-label={item.title}
                  aria-pressed={item === activeItem}
                  aria-controls={panelId}
                  onClick={() => setActiveIndex(index)}
                  className="aria-pressed:bg-primary aria-pressed:text-primary-foreground border-border bg-background hover:bg-accent min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors lg:block lg:w-full lg:rounded-none lg:border-0 lg:border-b lg:px-4 lg:py-3.5 lg:text-left lg:last:border-b-0"
                >
                  <span className="block text-[14px] leading-5 font-semibold">
                    {item.title}
                  </span>
                  <span
                    className={`mt-1 hidden text-[12.5px] leading-[1.55] lg:line-clamp-2 ${
                      item === activeItem
                        ? 'text-primary-foreground/75'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.body}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div
            id={panelId}
            aria-live="polite"
            className="min-w-0 lg:col-start-1 lg:row-start-1"
          >
            <Compare
              key={activeItem.title}
              item={activeItem}
              beforeLabel={beforeLabel}
              afterLabel={afterLabel}
            />
          </div>
        </div>

        {/* The caveat is part of the argument, not fine print. Pairing it with
            a return-to-tool action closes the proof loop without pretending
            these synthetic fixtures are customer testimonials. */}
        <div className="border-border mt-10 flex flex-col gap-5 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground max-w-2xl text-[14.5px] leading-[1.7]">
            {honest}
          </p>
          <a
            href="#tool"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full px-5 text-sm font-medium transition-colors sm:self-auto"
          >
            {ctaLabel}
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
