# Restart State

## Current status
- Milestone 1 (auth boundary) is complete and deployed.
- Milestone 2 (database schema and typed persistence layer) is complete.
- Milestone 3 (patient search and create) is complete.
- Milestone 4 (visit capture and AI-generated summaries) is complete: `app/api/visits/route.ts`, `app/api/visits/[id]/route.ts`, `app/api/ai/route.ts`, a real Anthropic integration in `server/ai/summarize-visit.ts`, `VisitComposer`, a per-visit generation rate limit, and tests — all passing.
- CI is set up (`.github/workflows/ci.yml`) running lint/test/build on every push and PR.
- The next step is Milestone 5 — audit logging and the Stripe subscription entry point.

## Files to review first
- [app/api/visits/route.ts](app/api/visits/route.ts)
- [app/api/visits/[id]/route.ts](app/api/visits/[id]/route.ts)
- [app/api/ai/route.ts](app/api/ai/route.ts)
- [server/ai/summarize-visit.ts](server/ai/summarize-visit.ts)
- [features/visits/VisitComposer.tsx](features/visits/VisitComposer.tsx)
- [app/dashboard/page.tsx](app/dashboard/page.tsx)
- [lib/db/ai-outputs.ts](lib/db/ai-outputs.ts)
- [tests/summarize-visit.test.ts](tests/summarize-visit.test.ts)
- [tests/visit-composer.test.tsx](tests/visit-composer.test.tsx)
- [supabase/schema.sql](supabase/schema.sql)

## Immediate next actions
1. Begin Milestone 5: audit logging on create/update/save actions, using the already-built `lib/db/audit-events.ts` (built in Milestone 2, not yet called from anywhere).
2. Add the Stripe subscription entry point (`features/billing/BillingCard.tsx` is still the Milestone 1 stub, not wired to anything).
3. Add `ANTHROPIC_API_KEY` to `.env.local` and Vercel's environment variables to manually verify the AI generation path end-to-end — it hasn't been tested against the real Anthropic API yet.

## Notes
- No `public.users` table — FKs reference `auth.users(id)` directly; role stays in Supabase Auth `user_metadata`.
- RLS is "any authenticated user, full access" on every table (single-clinic MVP).
- API routes call `lib/db/*` directly; no service layer unless real business logic requires one. The one exception to "no DI" is `server/ai/summarize-visit.ts`, which takes its Anthropic client as a parameter so it can be tested without a real API call.
- AI generation is capped at 5 attempts per visit (checked against `ai_outputs`, not in-memory) to bound cost on Vercel's stateless functions.
- `vitest.config.ts` uses `pool: 'threads'`. jsdom component test files have intermittently hit a hardcoded ~60-90s Vitest worker-startup timeout on the primary dev machine (likely antivirus/cloud-sync interference with `node_modules` access) — not a code defect, doesn't affect `next build`, and is expected to behave normally in CI.
