import { useEffect, useState } from 'react';

import {
  applyAnalyticsConsent,
  readAnalyticsConsent,
  type AnalyticsConsent as ConsentValue,
} from '@/lib/analytics/consent';
import { cn } from '@/lib/utils';

import { GoogleAnalytics } from './google-analytics';
import { Plausible } from './plausible';

export interface AnalyticsConsentCopy {
  regionLabel: string;
  title: string;
  description: string;
  allow: string;
  decline: string;
  privacy: string;
  settings: string;
  statusAllowed: string;
  statusDeclined: string;
}

/**
 * Default-deny analytics choice. Nothing third-party is loaded before a user
 * opts in, and the persisted choice can be changed from the always-available
 * compact settings control.
 */
export function AnalyticsConsent({
  copy,
  privacyHref,
  gaMeasurementId,
  plausibleDomain,
  plausibleSrc,
}: {
  copy: AnalyticsConsentCopy;
  privacyHref: string;
  gaMeasurementId?: string;
  plausibleDomain?: string;
  plausibleSrc?: string;
}) {
  const [consent, setConsent] = useState<ConsentValue>('unknown');
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const stored = readAnalyticsConsent();
    setConsent(stored);
    applyAnalyticsConsent(stored);
    setReady(true);

    const handleStorage = () => {
      const next = readAnalyticsConsent();
      setConsent(next);
      applyAnalyticsConsent(next);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const choose = (next: Exclude<ConsentValue, 'unknown'>) => {
    applyAnalyticsConsent(next);
    setConsent(next);
    setPanelOpen(false);
  };

  const showPanel = ready && (consent === 'unknown' || panelOpen);

  return (
    <>
      <GoogleAnalytics
        measurementId={gaMeasurementId || ''}
        enabled={ready && consent === 'granted'}
      />
      {ready && consent === 'granted' && (plausibleDomain || plausibleSrc) ? (
        <Plausible domain={plausibleDomain || ''} src={plausibleSrc} />
      ) : null}

      {showPanel ? (
        <section
          aria-label={copy.regionLabel}
          className="border-border bg-background/98 fixed right-3 bottom-3 left-3 z-[70] mx-auto max-w-2xl rounded-2xl border p-5 shadow-2xl backdrop-blur sm:right-6 sm:bottom-6 sm:left-6 sm:p-6"
        >
          <h2 className="font-serif text-xl font-semibold tracking-tight">
            {copy.title}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {copy.description}{' '}
            <a
              href={privacyHref}
              className="text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {copy.privacy}
            </a>
          </p>
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => choose('denied')}
              className={cn(
                'border-border hover:bg-muted focus-visible:ring-ring min-h-11 rounded-full border px-5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                consent === 'denied' && 'bg-muted'
              )}
            >
              {copy.decline}
            </button>
            <button
              type="button"
              onClick={() => choose('granted')}
              className={cn(
                'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring min-h-11 rounded-full px-5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                consent === 'granted' && 'ring-ring ring-2 ring-offset-2'
              )}
            >
              {copy.allow}
            </button>
          </div>
        </section>
      ) : ready ? (
        <button
          type="button"
          aria-label={`${copy.settings}: ${
            consent === 'granted' ? copy.statusAllowed : copy.statusDeclined
          }`}
          aria-expanded={false}
          onClick={() => setPanelOpen(true)}
          className="border-border bg-background/95 text-muted-foreground hover:text-foreground focus-visible:ring-ring fixed bottom-3 left-3 z-[60] min-h-10 rounded-full border px-3 text-xs font-medium shadow-sm backdrop-blur transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:bottom-5 sm:left-5"
        >
          {copy.settings}
        </button>
      ) : null}
    </>
  );
}
