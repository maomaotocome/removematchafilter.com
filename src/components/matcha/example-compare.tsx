import { useId, useState } from 'react';

export interface ExampleItem {
  title: string;
  body: string;
  before: string;
  after: string;
  beforeWebp: string;
  afterWebp: string;
  beforeWebpSmall: string;
  afterWebpSmall: string;
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
    <figure>
      <div className="border-border/80 bg-muted relative overflow-hidden rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_24px_-14px_rgba(0,0,0,0.15)]">
        <picture>
          <source
            type="image/webp"
            srcSet={`${item.afterWebpSmall} 480w, ${item.afterWebp} ${item.width}w`}
            sizes="(min-width: 640px) 494px, calc(100vw - 34px)"
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
              srcSet={`${item.beforeWebpSmall} 480w, ${item.beforeWebp} ${item.width}w`}
              sizes="(min-width: 640px) 494px, calc(100vw - 34px)"
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
  beforeLabel,
  afterLabel,
  items,
}: {
  title: string;
  intro: string;
  honest: string;
  beforeLabel: string;
  afterLabel: string;
  items: ExampleItem[];
}) {
  return (
    <section className="px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-title font-serif font-normal text-balance">
            {title}
          </h2>
          <p className="text-muted-foreground mt-5 text-[16.5px] leading-[1.75] text-pretty">
            {intro}
          </p>
        </div>
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-8">
          {items.map((item) => (
            <Compare
              key={item.title}
              item={item}
              beforeLabel={beforeLabel}
              afterLabel={afterLabel}
            />
          ))}
        </div>
        {/* The caveat is part of the argument, not fine print — but it stays
            visually subordinate to the comparisons themselves. */}
        <p className="text-muted-foreground mt-12 max-w-2xl text-[14.5px] leading-[1.7]">
          <span
            aria-hidden="true"
            className="bg-border mr-3 inline-block h-px w-6 align-middle"
          />
          {honest}
        </p>
      </div>
    </section>
  );
}
