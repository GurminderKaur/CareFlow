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

## Current implementation posture
- Milestone 1 (authentication, role-aware access, protected shell) is complete and deployed.
- Milestone 2 (database schema and typed persistence layer) is complete: schema applied, types aligned, repository layer in place, covered by tests.
- Milestone 3 (patient search and create) is complete: API route, UI, and a component test are in place.
- Milestone 4 should wire visit capture to the selected patient and replace the AI summarization stub.
