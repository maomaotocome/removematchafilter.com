import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { buildLlmsFull } from '@/lib/matcha/llms';

export const Route = createFileRoute('/llms-full.txt')({
  server: {
    handlers: {
      GET: () => {
        const { app_url, app_name, app_description } = envConfigs;
        return new Response(
          buildLlmsFull({
            appName: app_name,
            appDescription: app_description,
            appUrl: app_url,
          }),
          {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'public, max-age=3600',
            },
          }
        );
      },
    },
  },
});
