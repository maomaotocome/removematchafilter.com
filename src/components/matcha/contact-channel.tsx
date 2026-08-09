import { envConfigs } from '@/config';

/**
 * Renders the site's real contact address, or an explicit notice when none is
 * configured.
 *
 * Launch brief §3.4 / §5 forbid inventing a contact channel, so an unset
 * VITE_CONTACT_EMAIL surfaces as a visible gap rather than a plausible-looking
 * mailto that bounces. `pnpm check:launch` fails while it is empty.
 */
export function ContactChannel({ purpose }: { purpose?: string }) {
  const email = envConfigs.contact_email.trim();

  if (!email) {
    return (
      <span className="text-muted-foreground">
        (No public contact address is configured for this site yet — it will be
        published here before launch.)
      </span>
    );
  }

  return (
    <a href={`mailto:${email}`} className="underline underline-offset-4">
      {email}
      {purpose ? ` (${purpose})` : ''}
    </a>
  );
}
