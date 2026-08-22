import handler from '@tanstack/react-start/server-entry';

import { getCookieFromHeader } from './lib/cookie';
import { paraglideMiddleware } from './paraglide/server.js';

// On Cloudflare Workers, stash the binding env (D1, ASSETS, …) on globalThis
// so synchronous code paths (e.g. the db() singleton with DATABASE_PROVIDER=d1)
// can reach bindings without threading the request context through every call.
// The specifier is kept non-literal so bundlers leave the import to runtime;
// outside workerd the import rejects and we just move on.
const CF_WORKERS_MODULE = 'cloudflare:workers';
let cfEnvPromise: Promise<void> | null = null;

const CANONICAL_PUBLIC_PATHS = new Set(
  [
    '/',
    '/from-photo',
    '/from-video',
    '/matcha-filter-trend',
    '/how-to-remove-matcha-filter',
    '/contact',
    '/privacy-policy',
    '/terms-of-service',
  ].flatMap((path) => (path === '/' ? ['/', '/zh'] : [path, `/zh${path}`]))
);

const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
} as const;

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function ensureCloudflareEnv(): Promise<void> {
  if (!cfEnvPromise) {
    cfEnvPromise = import(/* @vite-ignore */ CF_WORKERS_MODULE)
      .then((mod) => {
        (globalThis as any).__CF_ENV__ = mod.env;
      })
      .catch(() => {
        // Not running on Cloudflare Workers — nothing to stash.
      });
  }
  return cfEnvPromise;
}

// Custom server entry — wraps every request in Paraglide's middleware so
// getLocale() resolves per-request (AsyncLocalStorage) during SSR.
export default {
  async fetch(req: Request): Promise<Response> {
    await ensureCloudflareEnv();
    const requestUrl = new URL(req.url);
    const lowercasePath = requestUrl.pathname.toLowerCase();
    const canonicalPath =
      lowercasePath.length > 1
        ? lowercasePath.replace(/\/+$/, '')
        : lowercasePath;
    if (
      CANONICAL_PUBLIC_PATHS.has(canonicalPath) &&
      requestUrl.pathname !== canonicalPath
    ) {
      requestUrl.pathname = canonicalPath;
      return withSecurityHeaders(Response.redirect(requestUrl, 308));
    }
    if (
      /^\/zh\/(?:api(?:\/|$)|ads\.txt$|robots\.txt$|sitemap\.xml$|llms(?:-full)?\.txt$)/i.test(
        requestUrl.pathname
      )
    ) {
      requestUrl.pathname = requestUrl.pathname.replace(/^\/zh/i, '');
      return withSecurityHeaders(Response.redirect(requestUrl, 308));
    }
    const response = withSecurityHeaders(
      await paraglideMiddleware(req, () => handler.fetch(req))
    );
    const utmSource = requestUrl.searchParams.get('utm_source');
    const existing = getCookieFromHeader(
      req.headers.get('cookie'),
      'utm_source'
    );
    if (utmSource && !existing) {
      const sanitized = utmSource.replace(/[^\w.\-]/g, '').slice(0, 100);
      if (sanitized) {
        response.headers.append(
          'Set-Cookie',
          `utm_source=${sanitized}; Max-Age=2592000; Path=/; SameSite=Lax`
        );
      }
    }
    return response;
  },
};
