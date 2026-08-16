# Remove Matcha Filter

A free browser tool to reduce the Matcha filter's green cast, grain, and flat contrast from photos and videos — no upload, no sign-up, everything happens locally in your browser.

**Live:** [removematchafilter.com](https://removematchafilter.com)

## Overview

This project is built on **ShipAny** — a headless SaaS template engine powered by TanStack Start, React 19, and TypeScript. It provides a complete, production-ready foundation with pre-wired business logic for:

- Authentication (email/password + OAuth via better-auth)
- Payments (Stripe, PayPal, Alipay, WeChat Pay)
- Credits & subscriptions
- RBAC (roles, permissions, admin panel)
- i18n (English + Chinese via Paraglide JS)
- CMS (categories, posts, MDX pages)
- Image uploads (S3/R2 or inline base64)
- Admin panel with full back-office UI

## Quick Start

```bash
pnpm install
cp .env.example .env.development   # fill in the required values
pnpm db:push
pnpm dev
```

Then visit `http://localhost:3000`

### Environment Setup

Only these are required to boot locally:

```env
VITE_APP_URL=http://localhost:3000
VITE_APP_NAME=Remove Matcha Filter
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:data/local.db
AUTH_SECRET=<generate with: openssl rand -base64 32>
```

See `.env.example` for all available options (optional payment providers, storage, AI, etc.). Local development uses `.env.development` (gitignored).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start (Vite 8 + Nitro) |
| Runtime | React 19, TypeScript |
| UI | shadcn/ui v4 (Base Nova style, Tailwind CSS 4) |
| Data | TanStack Query + Table |
| Forms | TanStack Form + Zod |
| Database | Drizzle ORM (SQLite / PostgreSQL / MySQL / Turso) |
| Auth | better-auth |
| i18n | Paraglide JS (compiled, dot-keyed JSON) |
| Image Editing | TipTap, Recharts (for analytics) |
| Email | React Email + Resend |
| Storage | AWS S3 / Cloudflare R2 (with inline fallback) |

## Project Structure

```
src/
├── core/              # Infrastructure
│   ├── db/            # Drizzle schema + migrations
│   ├── auth/          # Authentication (better-auth setup)
│   ├── payment/       # Stripe, PayPal, Alipay, WeChat Pay
│   ├── email/         # Email templates (React Email)
│   ├── storage/       # S3/R2 image upload
│   ├── ai/            # AI integrations (Replicate)
│   └── i18n/          # Locale config + compiled messages
├── modules/           # Business logic modules
│   ├── payment/       # Payment & subscription service
│   ├── credits/       # Credit consumption & expiry
│   ├── rbac/          # Roles & permissions
│   ├── api-keys/      # API key management
│   ├── posts/         # Blog/CMS
│   └── taxonomy/      # Categories
├── config/            # Environment, DB schema
├── routes/            # File-based routes (TanStack Start)
│   ├── *.tsx          # Pages (landing, auth, dashboard, admin)
│   ├── _layout.tsx    # Root layout
│   └── api/           # Server routes (REST endpoints)
├── content/pages/     # MDX static pages (privacy, terms, etc.)
├── components/        # Shared React components
│   ├── app-layout/    # Main layout wrapper
│   ├── app-sidebar/   # Navigation sidebar
│   ├── data-table/    # Server-paginated tables
│   ├── admin/         # Admin-specific components
│   └── shadcn/        # shadcn/ui components
├── hooks/             # Custom React hooks (API calls, queries)
└── lib/               # Utilities (API client, query setup, cache, rate-limit)

messages/             # Translation source (flat dot-keyed JSON)
├── en.json
└── zh.json
project.inlang/       # Inlang project config
src/paraglide/        # Compiled messages (gitignored, generated at build time)
```

## Features

- **Auth** — Email/password signup + Google/GitHub OAuth
- **Payments** — Stripe, PayPal, Alipay, WeChat Pay (one-time, subscriptions, webhooks)
- **Credits** — FIFO consumption, expiration, auto-grant on signup
- **RBAC** — Roles, permissions, wildcard matching, admin assignment
- **API Keys** — Full CRUD + validation
- **Subscriptions** — Manage plans, usage tracking, billing history
- **CMS** — Blog posts, categories with full CRUD
- **Image Upload** — Drag-drop, paste, or click uploader; S3/R2 or fallback to inline base64
- **i18n** — English + Chinese, locale-aware routing (en / zh)
- **Admin Panel** — Complete back-office at `/admin`:
  - **RBAC** — Users, roles, permissions management
  - **Content** — Categories, posts (with draft/published status)
  - **Billing** — Payments, subscriptions, credits (searchable, paginated)
  - **Settings** — Collapsible config groups (General, Auth, Payment, Email, Storage, AI)
  - System switcher (Admin / Dashboard / Landing)
- **Dashboard** — Client-rendered with Tailwind + shadcn sidebar
- **MDX Pages** — Static legal pages (privacy, terms), extensible

## Commands

| Command            | Purpose |
|--------------------|---------|
| `pnpm dev` | Start dev server (port 3000) |
| `pnpm build` | Production build |
| `pnpm start` | Run production server |
| `pnpm db:setup` | Select database provider and generate schema template |
| `pnpm db:push` | Push schema to database (dev) |
| `pnpm db:generate` | Generate migration SQL (production prep) |
| `pnpm db:migrate` | Run pending migrations (production) |
| `pnpm db:studio` | Open Drizzle Studio GUI |
| `pnpm rbac:init` | Create initial roles, permissions, and admin user |
| `pnpm rbac:assign` | Assign role to existing user |
| `pnpm format` | Format code with Prettier |

## Admin Panel Routes

| Section | Path | Features |
|---------|------|----------|
| Dashboard | `/admin` | Stats overview |
| Users | `/admin/users` | Full CRUD, role assignment |
| Roles | `/admin/roles` | Permission management |
| Permissions | `/admin/permissions` | View/edit system permissions |
| Categories | `/admin/categories` | Blog taxonomy CRUD |
| Posts | `/admin/posts` | Create/edit/delete posts, status tabs |
| Payments | `/admin/payments` | Payment history, server-side pagination |
| Subscriptions | `/admin/subscriptions` | Subscription management & usage |
| Credits | `/admin/credits` | Credit ledger, type/status filtering |
| Settings | `/admin/settings` | System config, all providers, i18n |

All tables include:
- Server-side pagination + search
- Dialog-based create/edit/delete forms
- Full English and Chinese translations

## Environment Variables

### Required

```env
# App identity
VITE_APP_URL=http://localhost:3000
VITE_APP_NAME=Remove Matcha Filter
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:data/local.db
AUTH_SECRET=<generate: openssl rand -base64 32>
```

### Optional (App & Customization)

```env
VITE_APP_DESCRIPTION="Reduce the matcha filter look..."
VITE_APP_LOGO=/logo.svg
VITE_DEFAULT_LOCALE=en
VITE_CONTACT_EMAIL=hello@removematchafilter.com
```

### Optional (Advanced Database)

```env
# For PostgreSQL, MySQL, Turso, or D1:
DATABASE_PROVIDER=postgres  # or mysql, turso, d1
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
DATABASE_AUTH_TOKEN=        # Turso only
DB_SCHEMA=public            # Postgres only
DB_SINGLETON_ENABLED=false  # Serverless reuse
```

### Optional (Business Logic Providers)

Credentials can be set here as fallbacks, but are best managed in Admin → Settings:

```env
STRIPE_SECRET_KEY=
RESEND_API_KEY=
REPLICATE_API_TOKEN=
CONFIG_ENCRYPTION_KEY=      # Encrypt admin-set secrets: openssl rand -base64 32
```

### Optional (Storage)

For image uploads (falls back to inline base64 if unset):

```env
STORAGE_ENDPOINT=           # S3/R2 endpoint
STORAGE_REGION=auto
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
STORAGE_PUBLIC_DOMAIN=      # CDN/public URL for uploaded images
INLINE_IMAGE_MAX_KB=2048    # Max inline image size
```

## Deployment

### Vercel / Node.js

```bash
pnpm build
pnpm start
```

### Cloudflare Workers

```bash
pnpm cf:build
pnpm cf:deploy
```

(Requires `wrangler` CLI and `wrangler.toml` configuration)

## License

This project is proprietary. See [LICENSE](./LICENSE) for details.

---

**Built with:** [ShipAny](https://shipany.ai) — Production-ready SaaS template for Claude Code.
