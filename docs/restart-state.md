# Restart State

## Current status
- Milestone 1 (auth boundary) is complete and deployed.
- Milestone 2 (database schema and typed persistence layer) is complete: `supabase/schema.sql` applied, `types/` aligned to the schema, `lib/db/` repository layer in place, all covered by passing tests.
- The next step is Milestone 3 — patient workflow (search/create UI wired to `lib/db/patients.ts`).

## Files to review first
- [supabase/schema.sql](supabase/schema.sql)
- [lib/db/patients.ts](lib/db/patients.ts)
- [lib/db/visits.ts](lib/db/visits.ts)
- [lib/db/audit-events.ts](lib/db/audit-events.ts)
- [types/patient.ts](types/patient.ts)
- [types/visit.ts](types/visit.ts)
- [types/audit.ts](types/audit.ts)
- [tests/db.test.ts](tests/db.test.ts)
- [lib/auth/session.ts](lib/auth/session.ts)
- [lib/auth/supabase.ts](lib/auth/supabase.ts)
- [middleware.ts](middleware.ts)

## Immediate next actions
1. Begin Milestone 3: wire `features/patients/PatientSearch.tsx` and an `app/api/patients/route.ts` endpoint to the existing `lib/db/patients.ts` functions.
2. Keep the dashboard shell narrow — only add the patient feature back once it does real work, not the stub from Milestone 1.
3. Add tests for the new patient API route alongside the UI work.

## Notes
- No `public.users` table — FKs reference `auth.users(id)` directly; role stays in Supabase Auth `user_metadata`.
- RLS is "any authenticated user, full access" on every table (single-clinic MVP) — do not add per-user ownership restrictions without a product reason.
- No service-role Supabase key is in use yet; the cookie-bound server client is sufficient under the current RLS policy. Service-role is expected to first be needed for Stripe webhooks (Milestone 5).
