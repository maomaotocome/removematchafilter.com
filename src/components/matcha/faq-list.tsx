/**
 * Server-rendered Q&A. Plain <dl> markup — always in the HTML, no JS needed to
 * read it, and no structured-data claim attached.
 */
export function FaqList({
  id,
  title,
  items,
}: {
  id?: string;
  title: string;
  items: { question: string; answer: string }[];
}) {
  return (
    <section
      id={id}
      className="paper-grain bg-muted/50 relative overflow-hidden px-4 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-2xl">
        <h2 className="text-title mb-10 font-serif font-normal text-balance">
          {title}
        </h2>
        <dl className="divide-border/70 divide-y">
          {items.map((item) => (
            <div key={item.question} className="py-7 first:pt-0 last:pb-0">
              <dt className="text-[16.5px] leading-[1.5] font-semibold tracking-[-0.005em]">
                {item.question}
              </dt>
              <dd className="text-muted-foreground mt-2.5 text-[16.5px] leading-[1.75] text-pretty">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
