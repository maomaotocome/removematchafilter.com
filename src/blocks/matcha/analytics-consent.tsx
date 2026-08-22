import { m } from '@/paraglide/messages.js';
import { localizeHref } from '@/paraglide/runtime.js';
import { AnalyticsConsent } from '@/components/analytics/analytics-consent';

export function AnalyticsConsentBlock({
  gaMeasurementId,
  plausibleDomain,
  plausibleSrc,
}: {
  gaMeasurementId?: string;
  plausibleDomain?: string;
  plausibleSrc?: string;
}) {
  return (
    <AnalyticsConsent
      gaMeasurementId={gaMeasurementId}
      plausibleDomain={plausibleDomain}
      plausibleSrc={plausibleSrc}
      privacyHref={localizeHref('/privacy-policy')}
      copy={{
        regionLabel: m['analytics.consent.region_label'](),
        title: m['analytics.consent.title'](),
        description: m['analytics.consent.description'](),
        allow: m['analytics.consent.allow'](),
        decline: m['analytics.consent.decline'](),
        privacy: m['analytics.consent.privacy'](),
        settings: m['analytics.consent.settings'](),
        statusAllowed: m['analytics.consent.status_allowed'](),
        statusDeclined: m['analytics.consent.status_declined'](),
      }}
    />
  );
}
