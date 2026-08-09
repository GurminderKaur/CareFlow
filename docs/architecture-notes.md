# Architecture Notes

## Auth boundary
- Browser handles form state and navigation.
- Server routes validate credentials and control session issuance.
- Middleware enforces access control before rendering protected pages or APIs.
- Role checks remain a server-side boundary and should not be moved to the client.

## Middleware placement
- The middleware is now centralized through [middleware.ts](middleware.ts) and re-exported from [src/middleware.ts](src/middleware.ts) to avoid drift.
- This keeps the auth guard consistent across the app and avoids conflicting middleware entry points.

## HTTPS and production URLs
- Production redirects should use the request origin or a configured app URL rather than hardcoded localhost.
- In production, redirects and callback URLs should always be HTTPS.
- Local development may continue to use http, but production should be configured consistently.

## Data layer
- Schema lives in [supabase/schema.sql](supabase/schema.sql): `patients`, `visits`, `ai_outputs`, `audit_events`, `subscriptions`.
- There is no `public.users` table. `created_by` / `performed_by` / `user_id` columns reference `auth.users(id)` directly; role lives in Supabase Auth `app_metadata` (server-trusted, not user-editable — see "Security hardening" below), read via `lib/auth/session.ts`.
- RLS on `patients`/`visits`/`ai_outputs`/`audit_events` checks role via a shared `is_staff()` SQL function reading the JWT's `app_metadata`. `subscriptions` is row-owned (`auth.uid() = user_id`). Staff-vs-admin gating also happens at the app layer (`middleware.ts`), but the database no longer just trusts "authenticated" blindly.
- The schema is applied by hand in the Supabase SQL editor; there is no migration tool yet. Future schema changes require a manual `ALTER` reflected back into `supabase/schema.sql`.
- `lib/db/` holds the typed repository layer (`patients.ts`, `visits.ts`, `audit-events.ts`, `ai-outputs.ts`, `subscriptions.ts`). Most functions use the cookie-bound `createServerComponentClient()` internally, so reads/writes run as the logged-in user under RLS. The exception is `subscriptions.ts`'s two write functions (`upsertSubscriptionForUser`, `updateSubscriptionByStripeSubscriptionId`), which take a `SupabaseClient` as a parameter instead — the Stripe webhook that calls them has no user session, so it passes in `lib/auth/supabase.ts`'s `createServiceRoleClient()`, which bypasses RLS and is scoped to that one route. Reads return `null`/`[]` on failure; writes throw.
- Each repository file also exports a zod input validator (`validateNewPatientInput`, etc.), same pattern as `lib/auth/session.ts`'s `validateLoginInput`.

## Patient workflow
- `app/api/patients/route.ts` calls `lib/db/patients.ts` directly — no separate service layer. A service module is only worth adding once patient-related logic involves more than validation plus a single DB call; nothing in Milestone 3 does.
- `GET /api/patients?query=` (empty query) returns all patients, capped at `MAX_SEARCH_RESULTS` (100) — reversed from the original "empty query returns nothing" MVP choice after user feedback that staff need to browse, not just search. The cap was added later during the security pass to bound bulk-export risk; this isn't full pagination, just a ceiling.
- `features/patients/PatientSearch.tsx` holds search results, the selected patient, and the create-patient form as local component state. The detail view is an inline panel, not a routed page, matching the single-dashboard-shell approach. Selected-patient state is not yet lifted to a parent — Milestone 4 will need to do that when visit capture requires knowing which patient is active.

## Visit and AI workflow
- `ai_outputs.summary` / `follow_up_instructions` are nullable, with a new `error_message` column and a `CHECK` constraint enforcing "completed rows have content, failed rows have an error message." This was a Milestone 2 schema gap — the original columns were `NOT NULL`, which didn't allow recording failed generation attempts. `supabase/schema.sql` has an idempotent migration block for databases provisioned before this change.
- `server/ai/summarize-visit.ts` takes the Anthropic client as a parameter instead of constructing it internally. This is the one place dependency injection was introduced — it exists specifically so `tests/summarize-visit.test.ts` can inject a mock client and test success/malformed-response/provider-failure paths without a real API call. `lib/db/*` still has no DI; no test yet needs to mock the DB layer.
- `app/api/ai/route.ts` constructs the real Anthropic client from `ANTHROPIC_API_KEY` and is the only place that reads it. It records an `ai_outputs` row on every attempt, success or failure.
- Generation is capped at 5 attempts per visit (`MAX_GENERATIONS_PER_VISIT` in `app/api/ai/route.ts`), checked via `countAiOutputsForVisit` against the `ai_outputs` table rather than in-memory state — required because Vercel serverless functions don't share memory across invocations.
- `VisitComposer`'s summary/follow-up fields are always editable, independent of whether generation succeeded. If Claude fails, the error is shown but the feature isn't blocked — staff can save a manually written summary.
- `selectedPatient` is lifted from `PatientSearch` into `app/dashboard/page.tsx` (via an `onSelectPatient` callback prop) and passed to `VisitComposer`, which is keyed by patient id so switching patients remounts it cleanly. No Context/store — still just two components sharing one value.

## Audit logging and billing
- `lib/db/audit-events.ts` (built in Milestone 2) is now called from patient create, visit create, and visit save, via `recordAuditEventBestEffort` — errors are logged server-side (`console.error`) but never fail the underlying request. A clinic shouldn't be unable to create a patient because an audit write hiccupped; accountability is best-effort, not a hard guarantee.
- `subscriptions.user_id` is now `unique` (a Milestone 2 schema gap — the table existed but nothing enforced "one subscription per user," which `core-schema.md` had always documented as the intended relationship). Needed for `upsertSubscriptionForUser`'s `onConflict: 'user_id'`.
- `app/api/stripe/webhook/route.ts` reads the raw request body (`request.text()`, not `request.json()`) because Stripe's signature verification (`stripe.webhooks.constructEvent`) requires the exact unparsed payload bytes. It's listed in `middleware.ts`'s `publicApiPaths` — Stripe calls it with no Supabase session at all, so its security comes entirely from the signature check inside the route, not from auth middleware.
- `server/billing/handle-stripe-event.ts` takes the parsed Stripe event and a `SupabaseClient` as parameters — same DI reasoning as `summarize-visit.ts`, and what let `tests/handle-stripe-event.test.ts` cover the upsert/update paths against a mocked client instead of real Stripe events.
- Stripe's `current_period_end` is not a field on the top-level `Subscription` object in the installed SDK version — it moved to each subscription item (`subscription.items.data[0].current_period_end`) in a recent Stripe API version. Confirmed by reading the installed package's type files directly rather than assuming.
- `features/billing/BillingCard.tsx` fetches `GET /api/subscriptions` via SWR (same pattern as `PatientSearch`) and posts to `/api/stripe/checkout` to start a subscription; the client-side redirect uses `window.location.href`, not `router.push`, since it's leaving the app for Stripe's hosted checkout page.

## Security hardening (post-Milestone-5)
- Public self-signup was removed (`/api/auth/signup` deleted). Small-clinic staff accounts are now provisioned only by an admin, via `POST /api/auth/invite` (checks `user.role === 'admin'` explicitly inside the route — middleware's default "staff-or-admin" gate is too permissive for an admin-only action). This closed the most serious gap in the app: previously, anyone who found the login page could self-register and immediately get full patient-data access, since RLS granted any authenticated user full access.
- Role moved from `user_metadata` to `app_metadata`. `user_metadata` is end-user-editable via the Supabase client SDK (`supabase.auth.updateUser`); `app_metadata` can only be set by the service-role key. Storing role in `user_metadata` meant any signed-in user could self-promote to `admin`. `app/api/auth/invite/route.ts` sets it via `updateUserById` after inviting; `lib/auth/session.ts` and `middleware.ts` both read `app_metadata` now.
- Both `lib/auth/session.ts` (`getCurrentSessionUser`, `validateStaffCredentials`) and `middleware.ts` now treat a missing/invalid role as **unauthenticated**, not as a default `'staff'`. The old fallback (`role ?? 'staff'`) meant an account with no role assigned at all was still let in.
- RLS was tightened to match: `is_staff()` checks the JWT's `app_metadata.role` for clinical tables, and `subscriptions` moved from blanket access to row ownership (a staff member could previously read/write any other staff member's billing record via a direct Supabase REST call, even though the app's own routes always scoped queries correctly — RLS is the real boundary, not app-layer query scoping).
- Existing accounts created before this change need a one-time manual fix (role copied from `raw_user_meta_data` to `raw_app_meta_data` in the Supabase SQL editor) — see `docs/restart-state.md`.
- `unexpectedErrorResponse` (`lib/api/errors.ts`) no longer returns `error.message` to the client — it logs the real error server-side and returns only the generic fallback message. Previously every 500 across the API leaked raw Postgres/Supabase error text. The webhook route and invite route had two more direct leaks outside this helper, fixed the same way.
- `next.config.ts` sets standard security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, `Content-Security-Policy`) on every route. `connect-src` in the CSP is just `'self'` — verified no client component talks to Supabase/Stripe/Anthropic directly (all external calls are server-side), so nothing broader was needed.
- Login attempts are rate-limited (5 per 15 minutes per email) via a new `login_attempts` table, checked and written through `createServiceRoleClient()` since login happens before any session exists — same reasoning as the webhook. In-memory limiting wasn't an option, same as the AI generation cap (Vercel functions don't share memory).
- `tests/e2e/` holds Playwright tests, run via `pnpm run test:e2e`, excluded from Vitest's file discovery (`vitest.config.ts`'s `exclude`) since Vitest would otherwise try to run them with the wrong test runner. One test (unauthenticated redirect) and one accessibility scan (`@axe-core/playwright` on the login page) always run with no setup; the full authenticated flow test is skipped unless `PLAYWRIGHT_TEST_EMAIL`/`PLAYWRIGHT_TEST_PASSWORD` are set to a real staff account.
- `VisitComposer` shows a short warning below the generate button that AI output may be inaccurate and should be checked against the visit notes — the actual mitigation (mandatory human review before save) already existed, this just makes it explicit in the UI.

## Tooling
- CI runs on every push/PR via `.github/workflows/ci.yml`: lint, test, build, on Node 22 / pnpm 9.
- Vitest's `forks`/`threads` pool has a hardcoded ~60-90s worker-startup timeout that isn't exposed via any config option. jsdom-environment component tests have intermittently exceeded it on the primary dev machine, most likely due to antivirus or cloud-sync scanning slowing access to `node_modules` — this does not affect `next build` (Vitest never runs during it) and is expected not to reproduce on CI's clean runners.

## Current implementation posture
- Milestone 1 (authentication, role-aware access, protected shell) is complete and deployed.
- Milestone 2 (database schema and typed persistence layer) is complete: schema applied, types aligned, repository layer in place, covered by tests.
- Milestone 3 (patient search and create) is complete: API route, UI, and a component test are in place.
- Milestone 4 (visit capture and AI-generated summaries) is complete: real Anthropic integration, review/edit/save flow, generation rate limit, and tests are in place.
- Milestone 5 (audit logging and Stripe subscription entry point) is complete: audit events wired into patient/visit routes, Stripe checkout and webhook routes, `BillingCard` showing real subscription state, and tests are in place. This closes out the MVP scope defined in `docs/product-spec.md`.
