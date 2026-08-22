import { useEffect } from 'react';

type AnalyticsWindow = Window &
  typeof globalThis & {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  };

function clearGoogleAnalyticsCookies() {
  for (const rawCookie of document.cookie.split(';')) {
    const name = rawCookie.split('=', 1)[0]?.trim();
    if (!name || !/^_(?:ga|gid|gat)(?:_|$)/.test(name)) continue;
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
}

/**
 * Load GA after the page has finished loading and the browser has an idle
 * window. `async` alone still makes gtag compete with the LCP font, CSS and
 * route JavaScript on mobile networks. The root stays mounted across client
 * navigation, so enhanced measurement continues to observe History API moves.
 */
export function GoogleAnalytics({
  measurementId,
  enabled,
}: {
  measurementId: string;
  enabled: boolean;
}) {
  const safeId = /^[A-Z0-9_-]{3,32}$/i.test(measurementId) ? measurementId : '';

  useEffect(() => {
    if (!safeId) return;

    const analyticsWindow = window as AnalyticsWindow;
    const disableKey = `ga-disable-${safeId}` as const;

    if (!enabled) {
      analyticsWindow[disableKey] = true;
      analyticsWindow.gtag?.('consent', 'update', {
        analytics_storage: 'denied',
      });
      document.getElementById('ga-loader')?.remove();
      clearGoogleAnalyticsCookies();
      delete analyticsWindow.gtag;
      analyticsWindow.dataLayer = [];
      return;
    }

    analyticsWindow[disableKey] = false;
    if (document.getElementById('ga-loader')) {
      analyticsWindow.gtag?.('consent', 'update', {
        analytics_storage: 'granted',
      });
      return;
    }

    let cancelled = false;
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const load = () => {
      if (cancelled || document.getElementById('ga-loader')) return;

      analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
      analyticsWindow.gtag = function () {
        analyticsWindow.dataLayer?.push(arguments);
      };
      analyticsWindow.gtag('consent', 'default', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
      analyticsWindow.gtag('js', new Date());
      analyticsWindow.gtag('config', safeId);

      const script = document.createElement('script');
      script.id = 'ga-loader';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(safeId)}`;
      document.head.appendChild(script);
    };

    const schedule = () => {
      if (analyticsWindow.requestIdleCallback) {
        idleId = analyticsWindow.requestIdleCallback(load, { timeout: 2_000 });
      } else {
        timeoutId = window.setTimeout(load, 500);
      }
    };

    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', schedule);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (idleId !== null) analyticsWindow.cancelIdleCallback?.(idleId);
    };
  }, [enabled, safeId]);

  return null;
}
