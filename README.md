# Lawyer On Demand

Production-ready MVP scaffold for an urgent legal connection platform.

Lawyer On Demand connects users with available attorneys in 3 clicks. Users select a legal issue, tap an attorney photo, start a video call, then choose to hire or not. The app supports e-sign agreements, retainers or contingency cases, attorney acceptance, case packets, and workflow exports.

Core promise: open app, choose legal issue, tap attorney photo, video call begins.

## What is implemented

- Next.js 14 App Router, React, TypeScript, Tailwind CSS, shadcn-style local UI primitives.
- Mobile-first client app with instant legal category selection and attorney results.
- Attorney photo is the connect-now action; no extra confirmation screen before the call.
- Preliminary guidance call screen with timer, disclaimer, hire path, return-to-attorneys, and post-call options.
- Hire Me Now flow with matter-specific agreement logic.
- Internal electronic signature MVP.
- Retainer versus contingency/no-retainer branching.
- Stripe-ready payment API route with safe demo fallback.
- Attorney acceptance requirement before agreement execution and representation.
- Attorney dashboard with availability, fee setup, incoming call, call notes, acceptance, case management, and Integration Suite.
- Admin dashboard for users, attorneys, categories, cases, payments, subscriptions, and integration health.
- Case packet generation with JSON and minimal PDF export fallback.
- Supabase migration and seed data.
- PWA-ready manifest and app icon.

## Demo routes

- Client app: `/`
- Attorney dashboard: `/attorney`
- Admin dashboard: `/admin`

## GitHub Pages

The repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

On every push to `main`, the workflow builds a static export for:

```text
https://beatviral.github.io/Law-On-Demand/
```

GitHub Pages cannot run Next.js API routes, so the deployed Pages version uses client-side demo workflow logic for video room creation, case creation, e-signature, payment status, attorney acceptance, and packet downloads. The `/api/*` routes remain in the repo for Node/Vercel-style deployments.

## Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

## Environment variables

Copy `.env.example` to `.env.local` and fill values as services become available.

Required for production integrations:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VIDEO_PROVIDER_API_KEY`
- `VIDEO_PROVIDER_DOMAIN`
- `APP_URL`

Optional future integrations are included for DocuSign, Dropbox Sign, Clio, and MyCase.

## Supabase

Apply the schema:

```bash
supabase db push
supabase db seed
```

The migration creates:

- Role, fee model, availability, and license status enums.
- Users, client profiles, attorney profiles, categories, practice areas, availability.
- Calls, call notes, cases, agreements, payments, exports, integrations, subscriptions, admin logs.
- RLS policies for public attorney/category reads, self access, participant case access, and admin operations.

Seed data includes the demo client, demo admin, core categories, and five online attorneys.

## Provider behavior

Video rooms:

- If `VIDEO_PROVIDER_API_KEY` and `VIDEO_PROVIDER_DOMAIN` are set, `/api/video-room` attempts a Daily room.
- Without credentials, it returns a local demo room payload.

Payments:

- If valid Stripe credentials and a non-demo payment method are provided, `/api/payments` creates a Stripe PaymentIntent.
- In demo mode, retainer payments return a succeeded mock payment so the full workflow can be tested.

Exports:

- `/api/exports?caseId=...&format=json` returns a structured case payload.
- `/api/exports?caseId=...&format=pdf` returns a lightweight PDF case packet fallback.

## Legal product rules encoded

- Available attorneys appear instantly after category selection.
- Pre-hire interaction is preliminary guidance only.
- User must tap Hire Me Now to hire.
- Agreement type follows matter type and attorney settings.
- Retainers are required for configured criminal/traffic matters.
- Contingency/no-retainer matters skip upfront payment.
- Attorney acceptance is required before execution.
- Representation starts only after agreement execution.
- Case packet can be exported to selected attorney workflow software.
