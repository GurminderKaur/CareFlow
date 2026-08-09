# Restart State

## Current status
- Milestones 1-5 are complete: auth, database schema, patient workflow, visit capture with AI-generated summaries, audit logging, and the Stripe subscription entry point. This closes out the MVP scope in `docs/product-spec.md`.
- CI is set up (`.github/workflows/ci.yml`) running lint/test/build on every push and PR.
- Two external integrations are built with real SDK calls but not yet manually verified end-to-end, because credentials aren't configured yet: Anthropic (`ANTHROPIC_API_KEY`) and Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`).

## Files to review first
- [lib/db/audit-events.ts](lib/db/audit-events.ts) — `recordAuditEventBestEffort`, now called from patient/visit routes
- [lib/db/subscriptions.ts](lib/db/subscriptions.ts)
- [lib/auth/supabase.ts](lib/auth/supabase.ts) — `createServiceRoleClient`
- [app/api/stripe/checkout/route.ts](app/api/stripe/checkout/route.ts)
- [app/api/stripe/webhook/route.ts](app/api/stripe/webhook/route.ts)
- [server/billing/handle-stripe-event.ts](server/billing/handle-stripe-event.ts)
- [features/billing/BillingCard.tsx](features/billing/BillingCard.tsx)
- [tests/handle-stripe-event.test.ts](tests/handle-stripe-event.test.ts)
- [supabase/schema.sql](supabase/schema.sql)

## Immediate next actions
1. Add `ANTHROPIC_API_KEY` to `.env.local` and Vercel, then manually verify visit summary generation end-to-end.
2. Create a product/price in the Stripe dashboard, add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` to `.env.local` and Vercel, register the webhook endpoint in Stripe pointing at `/api/stripe/webhook`, then manually verify checkout → webhook → `BillingCard` reflecting active status.
3. All five milestones from the original plan are now done — next would be deciding what's next with the user (hardening, new scope, or wrapping up for review).

## Notes
- No `public.users` table — FKs reference `auth.users(id)` directly; role stays in Supabase Auth `user_metadata`.
- RLS is "any authenticated user, full access" on every table (single-clinic MVP) — except the Stripe webhook, which uses `createServiceRoleClient()` (bypasses RLS) since it has no user session. That's the only place in the codebase this privileged client is used.
- API routes call `lib/db/*` directly; no service layer unless real business logic requires one. Dependency injection is used in exactly two places, both because a test needed to mock an external call without hitting the real API: `server/ai/summarize-visit.ts` (Anthropic client) and `server/billing/handle-stripe-event.ts` (Supabase client, to test against fake Stripe events).
- AI generation is capped at 5 attempts per visit (checked against `ai_outputs`, not in-memory) to bound cost on Vercel's stateless functions.
- Audit logging (patient/visit create and save) is best-effort — a failed audit write is logged server-side but never blocks the user's actual action.
- `vitest.config.ts` uses `pool: 'threads'`. jsdom component test files have intermittently hit a hardcoded ~60-90s Vitest worker-startup timeout on the primary dev machine (likely antivirus/cloud-sync interference with `node_modules` access) — not a code defect, doesn't affect `next build`, and is expected to behave normally in CI.
