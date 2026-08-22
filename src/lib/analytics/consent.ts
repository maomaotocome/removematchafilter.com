import { setMatchaAnalyticsConsent } from './matcha-events';

export type AnalyticsConsent = 'unknown' | 'granted' | 'denied';

export const ANALYTICS_CONSENT_STORAGE_KEY =
  'remove-matcha-filter.analytics-consent.v1';

export function readAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === 'undefined') return 'unknown';

  try {
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : 'unknown';
  } catch {
    return 'unknown';
  }
}

export function applyAnalyticsConsent(consent: AnalyticsConsent): void {
  if (typeof window === 'undefined') return;

  try {
    if (consent === 'unknown') {
      window.localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
    } else {
      window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, consent);
    }
  } catch {
    // Storage can be unavailable in hardened/private browser contexts. The
    // current-tab choice still applies through the in-memory event boundary.
  }

  setMatchaAnalyticsConsent(consent);
}
