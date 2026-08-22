import { useState } from 'react';
import { Languages, Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { localeNames } from '@/config/locale';
import { m } from '@/paraglide/messages.js';
import { getLocale, setLocale } from '@/paraglide/runtime.js';

/**
 * Lightweight public header for the Matcha tool cluster. It intentionally has
 * no session, avatar, dropdown-menu or account dependencies; those belong to
 * the authenticated SaaS header, not a mobile-first public utility.
 */
export function MatchaHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const locale = getLocale();
  const nextLocale = locale === 'zh' ? 'en' : 'zh';
  const navLinks = [
    { href: '/from-photo', label: m['landing.nav.photo']() },
    { href: '/from-video', label: m['landing.nav.video']() },
    {
      href: '/how-to-remove-matcha-filter',
      label: m['landing.nav.guide'](),
    },
    {
      href: '/matcha-filter-trend',
      label: m['landing.nav.trend'](),
    },
  ];

  const switchLanguage = () => setLocale(nextLocale);
  const toggleTheme = () =>
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  const themeLabel = m['site.header.toggle_theme']();

  return (
    <header className="bg-background/80 sticky top-0 z-50 w-full backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2.5 font-serif text-lg italic"
        >
          <span className="ring-border/80 inline-flex size-8 shrink-0 overflow-hidden rounded-lg ring-1">
            <img
              src="/favicon.svg"
              alt=""
              width={32}
              height={32}
              aria-hidden="true"
              className="size-full"
            />
          </span>
          <span>{envConfigs.app_name}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <button
            type="button"
            onClick={switchLanguage}
            aria-label={m['site.header.switch_language']({
              language: localeNames[nextLocale],
            })}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm transition-colors"
          >
            <Languages className="size-4" />
            <span>{localeNames[nextLocale]}</span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={themeLabel}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex size-11 items-center justify-center rounded-md transition-colors"
          >
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
          </button>
        </div>

        <button
          type="button"
          className="hover:bg-accent inline-flex size-11 items-center justify-center rounded-md md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={
            mobileOpen
              ? m['site.header.close_menu']()
              : m['site.header.open_menu']()
          }
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-border border-t px-4 pt-2 pb-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:bg-accent hover:text-foreground inline-flex min-h-11 items-center rounded-md px-3 text-sm transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="border-border mt-3 flex items-center gap-2 border-t pt-3">
            <button
              type="button"
              onClick={switchLanguage}
              aria-label={m['site.header.switch_language']({
                language: localeNames[nextLocale],
              })}
              className="border-border inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm"
            >
              <Languages className="size-4" />
              {localeNames[nextLocale]}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={themeLabel}
              className="border-border inline-flex size-11 items-center justify-center rounded-full border"
            >
              <Sun className="size-4 dark:hidden" />
              <Moon className="hidden size-4 dark:block" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
