# Law On Demand Review Packet

This file is a reviewer handoff for the current Law On Demand MVP prototype. It collects the live links, flow requirements, generated HTML entry points, source-code map, run/build commands, and review checklist in one place.

## Live Review Links

- Client app: https://beatviral.github.io/Law-On-Demand/
- Attorney portal route: https://beatviral.github.io/Law-On-Demand/attorney/
- Admin console route: https://beatviral.github.io/Law-On-Demand/admin/
- GitHub repository: https://github.com/BeatViral/Law-On-Demand
- Review branch: `main`
- Last app implementation commit before this packet: `6fc4b3d`

## Product Goal

Law On Demand is a mobile-first clickable app prototype for urgent legal help.

Core promise:

> Connect with an available attorney in 3 clicks.

Primary client flow:

1. Open app.
2. Choose legal issue.
3. Tap attorney photo/initials.
4. Video call screen opens.
5. Tap Hire Me Now.
6. Sign the correct agreement.
7. Pay retainer only when required.
8. Wait for attorney acceptance.
9. Representation Started confirmation appears.
10. Case packet can be exported to the Integration Suite.

## Current UX Structure

The app intentionally uses a realistic phone shell:

- Desktop: centered 390x812 app frame.
- Mobile: fills the viewport like a native app.
- The first screen is the app home, not a marketing landing page.
- Attorney and admin views are reachable without breaking the app form:
  - Home screen has a small `Portals` section.
  - `/attorney/` opens the Attorney Portal inside the same phone shell.
  - `/admin/` opens the Admin Console inside the same phone shell.

## Legal Categories

Home screen categories:

- DUI / DWI
- Traffic Stop / Infraction
- Auto Accident
- Personal Injury
- Criminal Defence

Traffic Stop and Traffic Infraction were combined into one user-facing category because they are essentially the same issue for this prototype.

## Fee Logic

Retainer required:

- DUI / DWI
- Traffic Stop / Infraction
- Criminal Defence

No upfront retainer:

- Auto Accident
- Personal Injury

Important wording:

- Use `No upfront retainer`.
- Do not use `No upfront fee`.

## Screens To Review

Client app screens:

- Home: `Tap your legal issue.`
- Available Attorneys
- Full Bio sheet
- Video call screen
- Agreement screen
- Retainer payment screen when required
- Attorney acceptance screen
- Representation Started confirmation
- Case Packet screen
- Integration Suite screen

Attorney portal screens:

- Availability
- Video Room
- Agreement Review
- Case Management
- Integration Suite

Admin console screens:

- Overview
- Manage Attorneys
- Manage Cases

## Static HTML Entry Points

The GitHub Pages deploy output is committed at the repo root. A reviewer can inspect these generated HTML files directly:

- `index.html`
- `attorney/index.html`
- `admin/index.html`
- `404.html`

Generated static assets are under:

- `_next/static/`

The source of truth is still the React/Next.js source files listed below. The root HTML files are generated build output for GitHub Pages.

## Primary Source Files

Review these first:

- `components/client-app.tsx`
  - Main clickable app prototype.
  - Holds client app state, attorney/admin portal state, call flow, agreement flow, payment branching, acceptance, confirmation, packet, and Integration Suite.
- `app/globals.css`
  - Main design system and app-shell styling.
  - Contains the deep navy, amber, green, mist gray visual language.
  - Contains phone shell, attorney cards, call screen, agreement/payment/packet screens, and portal-in-phone-shell styles.
- `lib/data.ts`
  - Demo legal categories, attorneys, practice areas, fee models, and client data.
- `lib/workflows.ts`
  - Mock workflow functions for creating case records, agreements, payments, acceptance, and case packets.
- `lib/types.ts`
  - Shared TypeScript types for attorneys, categories, agreements, payments, calls, and case packets.
- `lib/routing.ts`
  - Handles static-demo and GitHub Pages path behavior.
- `app/page.tsx`
  - Main client app route.
- `app/attorney/page.tsx`
  - Attorney portal route, rendered inside the app shell.
- `app/admin/page.tsx`
  - Admin console route, rendered inside the app shell.

## API And Mock Integration Files

These API routes are present for app structure and future backend wiring:

- `app/api/video-room/route.ts`
- `app/api/cases/route.ts`
- `app/api/agreements/route.ts`
- `app/api/payments/route.ts`
- `app/api/exports/route.ts`
- `app/api/stripe/webhook/route.ts`

Important: for the static GitHub Pages demo, the client falls back to local mock workflow functions when API requests are unavailable.

## UI Requirements Currently Implemented

- Header copy: `Law On Demand`
- Subtext: `Connect with an available attorney in 3 clicks.`
- App-first mobile shell.
- Legal issue tiles are large and tappable.
- Available attorneys appear instantly after selecting an issue.
- Attorney cards show:
  - Initials/photo circle
  - Online green dot
  - Attorney name
  - Firm
  - Specialty/category tag
  - Fee type
  - Jurisdiction tag
  - Short bio
  - Full Bio link
  - Connect Now button
  - Tap photo to call instruction
- Tapping attorney photo opens the video-call screen.
- Video-call screen includes:
  - Attorney name
  - Selected legal issue
  - Preliminary Guidance Period label and timer
  - Disclaimer
  - Hire Me Now
  - Choose Another Attorney
  - End Call
- Hire Me Now opens correct agreement flow.
- Retainer matters go to payment.
- No-upfront-retainer matters skip payment.
- Attorney acceptance screen includes demo `Attorney Accepts` control.
- Confirmation says `Representation Started`.
- Case packet includes client, attorney, matter, agreement, payment, and acceptance status.
- Integration Suite includes Clio, MyCase, PracticePanther, Filevine, Lawmatics, Smokeball, CASEpeer, Zapier, Make, PDF Export, and Email Export.

## Demo Limitations

This is a polished clickable MVP prototype, not a fully connected production backend.

Currently mocked or placeholder:

- Real attorney authentication.
- Real client authentication.
- Real video-call provider.
- Real Stripe payment collection.
- Real attorney acceptance event stream.
- Real Clio/MyCase/PracticePanther/Filevine/Lawmatics/Smokeball/CASEpeer/Zapier/Make integrations.
- Real PDF generation in the static demo.
- Real legal conflict checks.
- Real jurisdiction and bar-license validation.
- Real attorney-client privilege handling and compliance workflow.

These are intentionally represented as prototype flows so reviewers can evaluate UX, logic, and product structure before backend integration.

## Run Locally

From the repo root:

```powershell
pnpm install
pnpm dev
```

Local app:

```text
http://localhost:3000
```

Static GitHub Pages style build:

```powershell
$env:STATIC_EXPORT='true'
$env:GITHUB_PAGES='true'
pnpm build
```

The static export is generated into:

```text
out/
```

The repo currently commits copied static output at the root for GitHub Pages.

## Review Checklist

Product and UX:

- Does the app feel like a real mobile app instead of a landing page?
- Is the 3-click path obvious?
- Are legal categories clear and urgent?
- Are attorney cards understandable and trustworthy?
- Is `Tap photo to call` clear enough?
- Does the call screen feel like a real call interface?
- Does the Hire Me Now flow feel serious and legally appropriate?

Legal and compliance:

- Is the Preliminary Guidance Period disclaimer strong enough?
- Is the transition from preliminary guidance to representation clear?
- Is full representation gated behind signature, required payment, and attorney acceptance?
- Should additional jurisdiction, conflict, or bar-license disclaimers be added?
- Should the term `Criminal Defence` be localized or changed to `Criminal Defense` for US users?

Technical:

- Is the client-side flow state clear and maintainable?
- Should the large `components/client-app.tsx` file be split before backend work?
- Are fee models represented correctly in `lib/data.ts` and `lib/workflows.ts`?
- Are API route shapes reasonable for future backend wiring?
- Does the static GitHub Pages build behave correctly?
- Are generated files separated clearly enough from source files?

Production readiness next steps:

- Add real auth.
- Add attorney onboarding and verification.
- Add jurisdiction-aware issue intake.
- Add real video provider.
- Add Stripe Checkout or Payment Element.
- Add real e-signature audit trail.
- Add database persistence.
- Add integration webhooks and exports.
- Add logging, monitoring, and error states.
- Add automated tests for the main flow and fee branching.

## Source File Inventory

App:

- `app/layout.tsx`
- `app/page.tsx`
- `app/attorney/page.tsx`
- `app/admin/page.tsx`
- `app/globals.css`

Components:

- `components/client-app.tsx`
- `components/attorney-dashboard.tsx`
- `components/admin-dashboard.tsx`
- `components/ui/badge.tsx`
- `components/ui/button.tsx`
- `components/ui/panel.tsx`

Library:

- `lib/data.ts`
- `lib/types.ts`
- `lib/workflows.ts`
- `lib/routing.ts`
- `lib/supabase.ts`
- `lib/utils.ts`

API routes:

- `app/api/video-room/route.ts`
- `app/api/cases/route.ts`
- `app/api/agreements/route.ts`
- `app/api/payments/route.ts`
- `app/api/exports/route.ts`
- `app/api/stripe/webhook/route.ts`

Configuration:

- `package.json`
- `next.config.mjs`
- `tailwind.config.ts`
- `postcss.config.js`
- `tsconfig.json`
- `manifest.webmanifest`

