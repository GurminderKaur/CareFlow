# Restart State

## Current status
- Milestone 1 (auth boundary) is complete and deployed.
- Milestone 2 (database schema and typed persistence layer) is complete.
- Milestone 3 (patient search and create) is complete: `app/api/patients/route.ts`, a real `PatientSearch` component, re-wired into the dashboard, and a component test — all passing.
- The next step is Milestone 4 — visit workflow (capture visit details, replace the AI summarization stub).

## Files to review first
- [app/api/patients/route.ts](app/api/patients/route.ts)
- [features/patients/PatientSearch.tsx](features/patients/PatientSearch.tsx)
- [app/dashboard/page.tsx](app/dashboard/page.tsx)
- [tests/patient-search.test.tsx](tests/patient-search.test.tsx)
- [lib/db/patients.ts](lib/db/patients.ts)
- [lib/db/visits.ts](lib/db/visits.ts)
- [types/visit.ts](types/visit.ts)

## Immediate next actions
1. Begin Milestone 4: capture visit details against the currently selected patient, replacing the stub `features/visits/VisitComposer.tsx`.
2. Decide how the selected patient from `PatientSearch` is shared with the visit composer (likely lifting selection state into `app/dashboard/page.tsx`).
3. Wire `server/ai/summarize-visit.ts` to a real Anthropic Claude call, with explicit handling for provider failure per `docs/product-spec.md`.

## Notes
- No `public.users` table — FKs reference `auth.users(id)` directly; role stays in Supabase Auth `user_metadata`.
- RLS is "any authenticated user, full access" on every table (single-clinic MVP).
- Patient API routes call `lib/db/patients.ts` directly; no service layer unless real business logic requires one.
- The vitest pool is set to `threads` (not the default `forks`) — needed for the jsdom-environment component test to start reliably on this machine.
