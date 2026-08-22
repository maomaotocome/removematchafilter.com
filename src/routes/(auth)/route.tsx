import { createFileRoute, Outlet } from '@tanstack/react-router';

import { GoogleOneTap } from '@/components/google-one-tap';

export const Route = createFileRoute('/(auth)')({
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  }),
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <>
      <Outlet />
      <GoogleOneTap />
    </>
  );
}
