import { AlertCircle, CheckCircle2, MinusCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface RecoveryRow {
  signal: string;
  outcome: string;
  expectation: string;
  level: 'good' | 'partial' | 'none';
}

const icons = {
  good: CheckCircle2,
  partial: MinusCircle,
  none: AlertCircle,
};

export function RecoveryTable({
  title,
  intro,
  labels,
  rows,
  tone = 'default',
}: {
  title: string;
  intro: string;
  labels: { signal: string; outcome: string; expectation: string };
  rows: RecoveryRow[];
  tone?: 'default' | 'muted';
}) {
  return (
    <section
      className={cn(
        'px-4 py-16 sm:py-24',
        tone === 'muted' && 'paper-grain bg-muted/50'
      )}
    >
      <div className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <h2 className="text-title font-serif font-normal text-balance">
            {title}
          </h2>
          <p className="text-muted-foreground mt-5 text-[16.5px] leading-[1.75] text-pretty">
            {intro}
          </p>
        </div>

        <dl className="mt-9 space-y-3 md:hidden">
          {rows.map((row) => {
            const Icon = icons[row.level];
            return (
              <div
                key={row.signal}
                className="border-border bg-card rounded-2xl border p-5"
              >
                <dt className="font-semibold">{row.signal}</dt>
                <dd className="mt-3 flex items-center gap-2 text-sm font-medium">
                  <Icon className="size-4" aria-hidden="true" />
                  {row.outcome}
                </dd>
                <dd className="text-muted-foreground mt-2 text-[15px] leading-7">
                  {row.expectation}
                </dd>
              </div>
            );
          })}
        </dl>

        <div className="border-border bg-card mt-9 hidden overflow-hidden rounded-2xl border md:block">
          <table className="w-full border-collapse text-left">
            <thead className="bg-muted/70 text-muted-foreground text-xs tracking-wide uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold">{labels.signal}</th>
                <th className="px-6 py-4 font-semibold">{labels.outcome}</th>
                <th className="px-6 py-4 font-semibold">
                  {labels.expectation}
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {rows.map((row) => {
                const Icon = icons[row.level];
                return (
                  <tr key={row.signal}>
                    <th className="px-6 py-5 text-[15px] font-semibold">
                      {row.signal}
                    </th>
                    <td className="px-6 py-5 text-sm">
                      <span className="inline-flex items-center gap-2 font-medium">
                        <Icon className="size-4" aria-hidden="true" />
                        {row.outcome}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-6 py-5 text-[15px] leading-7">
                      {row.expectation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
