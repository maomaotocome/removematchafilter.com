export interface VideoEvidenceCopy {
  eyebrow: string;
  title: string;
  intro: string;
  beforeLabel: string;
  beforeBody: string;
  afterLabel: string;
  afterBody: string;
  note: string;
}

export function VideoEvidence({ copy }: { copy: VideoEvidenceCopy }) {
  const items = [
    {
      label: copy.beforeLabel,
      body: copy.beforeBody,
      src: '/videos/evidence/synthetic-matcha-before.webm',
      poster: '/videos/evidence/synthetic-matcha-before-poster.png',
    },
    {
      label: copy.afterLabel,
      body: copy.afterBody,
      src: '/videos/evidence/synthetic-matcha-after.webm',
      poster: '/videos/evidence/synthetic-matcha-after-poster.png',
    },
  ];

  return (
    <section className="border-border border-y bg-neutral-950 py-16 text-neutral-100 sm:py-20">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <p className="text-xs font-semibold tracking-[0.18em] text-emerald-300 uppercase">
          {copy.eyebrow}
        </p>
        <h2 className="mt-3 max-w-3xl font-serif text-3xl tracking-tight sm:text-4xl">
          {copy.title}
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-neutral-300 sm:text-base">
          {copy.intro}
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.label}
              className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900"
            >
              <video
                controls
                muted
                playsInline
                preload="none"
                poster={item.poster}
                aria-label={item.label}
                className="aspect-[3/2] w-full bg-black object-cover"
              >
                <source src={item.src} type="video/webm" />
              </video>
              <div className="p-5">
                <h3 className="font-semibold text-neutral-50">{item.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                  {item.body}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-5 max-w-3xl text-xs leading-relaxed text-neutral-400">
          {copy.note}
        </p>
      </div>
    </section>
  );
}
