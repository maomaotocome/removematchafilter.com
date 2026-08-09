'use client';

import { useEffect, useRef } from 'react';

import { getAuthClient, useSession } from '@/core/auth/client';
import { currentPathWithQuery } from '@/lib/redirect';
import { usePublicConfig, type PublicConfig } from '@/hooks/use-public-config';

/**
 * Mounts the Google One Tap prompt for signed-out visitors when the admin has
 * enabled it. Self-contained: pulls config from /api/config/public, gates on
 * session, and triggers at most once per page load.
 *
 * Split in two so the session fetch is not unconditional. This outer component
 * is mounted on every page from __root, and it reads only the public config
 * endpoint. The inner component — which calls `useSession()` — mounts only once
 * One Tap is actually enabled and configured, so a site that does not use One
 * Tap never requests `/api/auth/get-session` from a public page.
 */
export function GoogleOneTap() {
  const { data: configs } = usePublicConfig();

  if (!configs) return null;
  if (configs.google_one_tap_enabled !== 'true' || !configs.google_client_id) {
    return null;
  }

  return <OneTapPrompt configs={configs} />;
}

function OneTapPrompt({ configs }: { configs: PublicConfig }) {
  const { data: session, isPending } = useSession();
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    if (isPending) return;
    if (session?.user) return;

    triggered.current = true;
    const client = getAuthClient(configs);
    (client as any)
      .oneTap?.({
        // Stay put: One Tap fires on whatever page the visitor is reading.
        callbackURL: currentPathWithQuery('/'),
        onPromptNotification: () => {
          // Silently ignore dismissals / FedCM hiccups — the user can still
          // sign in via the normal /sign-in page.
        },
      })
      .catch(() => {
        // Same — One Tap cancellations throw NetworkError/AbortError that
        // aren't actionable.
      });
  }, [configs, session, isPending]);

  return null;
}
