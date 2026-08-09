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
- There is no `public.users` table. `created_by` / `performed_by` / `user_id` columns reference `auth.users(id)` directly; role continues to live in Supabase Auth `user_metadata`, read via `lib/auth/session.ts`.
- RLS is enabled on every table with a single "authenticated full access" policy (`TO authenticated`, never `public`/anon). This matches the single-clinic MVP scope — no per-user row ownership. Staff-vs-admin gating stays an app-layer concern (`middleware.ts`), not RLS.
- The schema is applied by hand in the Supabase SQL editor; there is no migration tool yet. Future schema changes require a manual `ALTER` reflected back into `supabase/schema.sql`.
- `lib/db/` holds the typed repository layer (`patients.ts`, `visits.ts`, `audit-events.ts`). Each function uses the same cookie-bound `createServerComponentClient()` from auth, so all reads/writes run as the logged-in user under RLS — no service-role key is used or needed yet. Reads return `null`/`[]` on failure; writes throw.
- Each repository file also exports a zod input validator (`validateNewPatientInput`, etc.), same pattern as `lib/auth/session.ts`'s `validateLoginInput`.

## Patient workflow
- `app/api/patients/route.ts` calls `lib/db/patients.ts` directly — no separate service layer. A service module is only worth adding once patient-related logic involves more than validation plus a single DB call; nothing in Milestone 3 does.
- `GET /api/patients?query=` requires a non-empty query and returns an empty list otherwise, rather than listing every patient. This is a deliberate MVP choice, not a missing feature.
- `features/patients/PatientSearch.tsx` holds search results, the selected patient, and the create-patient form as local component state. The detail view is an inline panel, not a routed page, matching the single-dashboard-shell approach. Selected-patient state is not yet lifted to a parent — Milestone 4 will need to do that when visit capture requires knowing which patient is active.

## Visit and AI workflow
- `ai_outputs.summary` / `follow_up_instructions` are nullable, with a new `error_message` column and a `CHECK` constraint enforcing "completed rows have content, failed rows have an error message." This was a Milestone 2 schema gap — the original columns were `NOT NULL`, which didn't allow recording failed generation attempts. `supabase/schema.sql` has an idempotent migration block for databases provisioned before this change.
- `server/ai/summarize-visit.ts` takes the Anthropic client as a parameter instead of constructing it internally. This is the one place dependency injection was introduced — it exists specifically so `tests/summarize-visit.test.ts` can inject a mock client and test success/malformed-response/provider-failure paths without a real API call. `lib/db/*` still has no DI; no test yet needs to mock the DB layer.
- `app/api/ai/route.ts` constructs the real Anthropic client from `ANTHROPIC_API_KEY` and is the only place that reads it. It records an `ai_outputs` row on every attempt, success or failure.
- Generation is capped at 5 attempts per visit (`MAX_GENERATIONS_PER_VISIT` in `app/api/ai/route.ts`), checked via `countAiOutputsForVisit` against the `ai_outputs` table rather than in-memory state — required because Vercel serverless functions don't share memory across invocations.
- `VisitComposer`'s summary/follow-up fields are always editable, independent of whether generation succeeded. If Claude fails, the error is shown but the feature isn't blocked — staff can save a manually written summary.
- `selectedPatient` is lifted from `PatientSearch` into `app/dashboard/page.tsx` (via an `onSelectPatient` callback prop) and passed to `VisitComposer`, which is keyed by patient id so switching patients remounts it cleanly. No Context/store — still just two components sharing one value.
- No audit logging on visit create/save yet — that's Milestone 5, deliberately not pulled forward.

## Tooling
- CI runs on every push/PR via `.github/workflows/ci.yml`: lint, test, build, on Node 22 / pnpm 9.
- Vitest's `forks`/`threads` pool has a hardcoded ~60-90s worker-startup timeout that isn't exposed via any config option. jsdom-environment component tests have intermittently exceeded it on the primary dev machine, most likely due to antivirus or cloud-sync scanning slowing access to `node_modules` — this does not affect `next build` (Vitest never runs during it) and is expected not to reproduce on CI's clean runners.

## Current implementation posture
- Milestone 1 (authentication, role-aware access, protected shell) is complete and deployed.
- Milestone 2 (database schema and typed persistence layer) is complete: schema applied, types aligned, repository layer in place, covered by tests.
- Milestone 3 (patient search and create) is complete: API route, UI, and a component test are in place.
- Milestone 4 (visit capture and AI-generated summaries) is complete: real Anthropic integration, review/edit/save flow, generation rate limit, and tests are in place.
- Milestone 5 should add audit logging on create/update/save actions and the Stripe subscription entry point.
