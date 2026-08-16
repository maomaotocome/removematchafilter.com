import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { baseLocale } from '@/paraglide/runtime.js';
import { getLocalPosts, mergePosts } from '@/content/posts';

const STATIC_PAGES: { path: string; title: string; description: string }[] = [
  {
    path: '',
    title: 'Remove Matcha Filter',
    description: 'Free local photo and video filter correction tool',
  },
  {
    path: '/from-photo',
    title: 'Remove Matcha Filter from a Photo',
    description: 'Photo-specific local correction workflow',
  },
  {
    path: '/from-video',
    title: 'Remove Matcha Filter from a Video',
    description: 'Video-specific local correction and export workflow',
  },
  {
    path: '/matcha-filter-trend',
    title: 'Matcha Filter Trend Explained',
    description: 'What the visual trend is and what can be corrected',
  },
  {
    path: '/how-to-remove-matcha-filter',
    title: 'How to Remove Matcha Filter',
    description: 'Step-by-step guide for photos and videos',
  },
  {
    path: '/about',
    title: 'About Remove Matcha Filter',
    description: 'Team, methodology, primary sources and editorial policy',
  },
];

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: async () => {
        const { app_url, app_name, app_description } = envConfigs;

        let posts = getLocalPosts(baseLocale);
        try {
          const { listPublishedArticles } =
            await import('@/modules/posts/service');
          const rows = await listPublishedArticles().catch(() => []);
          const dbPosts = rows.map((row) => ({
            slug: row.slug,
            title: row.title || row.slug,
            description: row.description || '',
            createdAt: new Date(row.createdAt).toISOString(),
            source: 'db' as const,
          }));
          posts = mergePosts(dbPosts, posts);
        } catch {
          // Database unreachable — local posts still listed.
        }

        const lines: string[] = [
          `# ${app_name}`,
          '',
          `> ${app_description}`,
          '',
          '## Pages',
          '',
          ...STATIC_PAGES.map(
            (p) => `- [${p.title}](${app_url}${p.path}): ${p.description}`
          ),
        ];

        if (posts.length > 0) {
          lines.push('', '## Blog Posts', '');
          for (const post of posts) {
            lines.push(
              `- [${post.title}](${app_url}/blog/${post.slug}): ${post.description}`
            );
          }
        }

        lines.push('');

        return new Response(lines.join('\n'), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      },
    },
  },
});
