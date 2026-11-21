# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev         # next dev
npm run build       # next build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
```

There is no test runner. Tests are standalone scripts in `scripts/` run directly, e.g. `node scripts/test-terms.mjs` or `npx tsx scripts/test-multi-batch-e2e.ts`. Many of them hit a real Supabase/WhatsApp/Razorpay environment or a disposable Postgres (`@electric-sql/pglite`, see `scripts/test-disposable-postgres.mjs`), so check what a script touches before running it. Copy `.env.example` to `.env.local` for required env vars (Supabase, Razorpay, Resend, WhatsApp Meta Cloud API, Cloudinary).

## Architecture

Art & Soul Studio (Renuka) — a Next.js 16 App Router site (React 19, Tailwind v4, GSAP) for selling art-course cohorts. It has a public landing page, per-course pages, booking and payment flows, and an admin dashboard. Supabase (Postgres + Auth) is the backend. `prompt.md` is the original backend build spec and gives product context.

- **`proxy.ts`** is Next 16's replacement for `middleware.ts`. It refreshes the Supabase session and redirects unauthenticated `/admin/*` requests (except `/admin/login`) to login. Role checks happen separately in `lib/auth/admin.ts`.
- **`app/`** holds the routes. Public: `/`, `/course/[slug]`, `/booking/[bookingReference]`, `/pay/[token]` (payment links), `/terms-and-conditions`. Admin UI is under `app/admin/*`. `app/api/` has `admin`, `bookings`, `cohort-batches`, `payments` (create-order/verify/webhook for Razorpay), `webhooks/whatsapp`, `gallery`, `testimonials`, `auth` and `health`.
- **`lib/<domain>/service.ts`** is where the business logic lives (booking, payment, payment-links, course-credit, batches-admin, bookings-admin, students, broadcast, messages-admin, notifications, whatsapp, gallery, cloudinary, settings, dashboard). Route handlers and server components should stay thin and call these services. Services use `import "server-only"`.
- **`lib/validations/*`** holds Zod schemas for request and form input. **`lib/types/`** holds the database types.
- **Supabase clients** in `lib/supabase/`: `client.ts` (browser), `server.ts` (cookie-bound, for the user's session), `admin.ts` (service-role, bypasses RLS). Use the admin client only for server-side mutations, webhooks and jobs.
- **Migrations** are in `supabase/migrations/` (timestamped SQL); `supabase/seed.sql` is the seed.
- **WhatsApp** (`lib/whatsapp/`): `client.ts` picks a transport, either `meta-adapter.ts` (Meta Cloud API) or `mock-adapter.ts`. `template-management.ts` and `templates.ts` handle Meta message templates. Booking confirmations and class reminders are sent through `service.ts`.
- **Landing content** comes from two sources: static defaults in `data/content.ts` and CMS overrides loaded by `lib/cms/public-loader.ts`, delivered to client components via `components/LandingContentProvider.tsx`. The landing sections are in `components/*.tsx`, and admin UI pieces are in `components/admin`.
- **PWA**: `app/manifest.ts`, `PWAProvider`, `InstallPrompt`, a service worker at `/sw.js` (served with no-cache headers in `next.config.ts`), and an `app/offline` route.

Path alias: `@/*` maps to the repo root (no `src/` directory).
