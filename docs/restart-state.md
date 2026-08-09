# Restart State

## Current status
- Milestones 1-5 are complete: auth, database schema, patient workflow, visit capture with AI-generated summaries, audit logging, and the Stripe subscription entry point. This closes out the MVP scope in `docs/product-spec.md`.
- A security hardening pass followed: public self-signup removed, role moved to server-trusted `app_metadata`, RLS tightened to check role and (for billing) row ownership. See `docs/architecture-notes.md`'s "Security hardening" section for the full reasoning.
- CI is set up (`.github/workflows/ci.yml`) running lint/test/build on every push and PR.
- Two external integrations are built with real SDK calls but not yet manually verified end-to-end, because credentials aren't configured yet: Anthropic (`ANTHROPIC_API_KEY`) and Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`).

## Action required before this works again
Existing accounts (created before the security pass) have role in `user_metadata`, not `app_metadata`, and will be denied access until fixed. In the Supabase SQL editor, run once:
```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', raw_user_meta_data->>'role')
where raw_user_meta_data->>'role' is not null;
```
Then re-run the full `supabase/schema.sql` (idempotent, safe to run in full) to pick up the RLS policy changes.

## Files to review first
- [middleware.ts](middleware.ts) and [lib/auth/session.ts](lib/auth/session.ts) — role now read from `app_metadata`, missing role denies access
- [app/api/auth/invite/route.ts](app/api/auth/invite/route.ts) — admin-only staff provisioning, replaces public signup
- [supabase/schema.sql](supabase/schema.sql) — `is_staff()` function, tightened RLS policies
- [lib/db/audit-events.ts](lib/db/audit-events.ts) — `recordAuditEventBestEffort`, called from patient/visit routes
- [lib/db/subscriptions.ts](lib/db/subscriptions.ts)
- [lib/auth/supabase.ts](lib/auth/supabase.ts) — `createServiceRoleClient`
- [app/api/stripe/checkout/route.ts](app/api/stripe/checkout/route.ts)
- [app/api/stripe/webhook/route.ts](app/api/stripe/webhook/route.ts)
- [server/billing/handle-stripe-event.ts](server/billing/handle-stripe-event.ts)
- [features/billing/BillingCard.tsx](features/billing/BillingCard.tsx)

## Immediate next actions
1. Run the one-time SQL fix above, then re-run `supabase/schema.sql` in full (adds `login_attempts` too), before testing anything else.
2. Add `ANTHROPIC_API_KEY` to `.env.local` and Vercel, then manually verify visit summary generation end-to-end.
3. Create a product/price in the Stripe dashboard, add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` to `.env.local` and Vercel, register the webhook endpoint in Stripe pointing at `/api/stripe/webhook`, then manually verify checkout → webhook → `BillingCard` reflecting active status.
4. No UI exists yet for the admin-invite endpoint — it's callable but nothing in the dashboard triggers it. Worth adding if ongoing staff onboarding is needed.
5. To run the full authenticated Playwright test (`tests/e2e/auth.spec.ts`), set `PLAYWRIGHT_TEST_EMAIL`/`PLAYWRIGHT_TEST_PASSWORD` in `.env.local` to an existing staff account. Without them, that one test is skipped automatically; the redirect and login-page accessibility tests always run.
6. Manually click through the app after deploying the new CSP/security headers (`next.config.ts`) — not browser-tested this session, and a CSP violation can silently break rendering without an obvious server error.
7. The full security-audit punch list from this session is now closed out: signup/RLS/role chain, error-message leakage, security headers, Playwright + accessibility, login rate limiting, patient-list cap, AI prompt-injection UI warning. Nothing outstanding from that audit unless a new pass turns up more.

## Notes
- No `public.users` table — FKs reference `auth.users(id)` directly; role lives in Supabase Auth `app_metadata` (server-trusted — see above), not `user_metadata`.
- RLS: `patients`/`visits`/`ai_outputs`/`audit_events` require `is_staff()` (role check via JWT `app_metadata`). `subscriptions` is row-owned (`auth.uid() = user_id`). The Stripe webhook uses `createServiceRoleClient()` (bypasses RLS) since it has no user session — the only place in the codebase this privileged client is used.
- API routes call `lib/db/*` directly; no service layer unless real business logic requires one. Dependency injection is used in exactly two places, both because a test needed to mock an external call without hitting the real API: `server/ai/summarize-visit.ts` (Anthropic client) and `server/billing/handle-stripe-event.ts` (Supabase client, to test against fake Stripe events).
- AI generation is capped at 5 attempts per visit (checked against `ai_outputs`, not in-memory) to bound cost on Vercel's stateless functions.
- Audit logging (patient/visit create and save) is best-effort — a failed audit write is logged server-side but never blocks the user's actual action.
- `vitest.config.ts` uses `pool: 'threads'` and excludes `tests/e2e/**` (Playwright tests, run separately via `pnpm run test:e2e`). jsdom component test files have intermittently hit a hardcoded ~60-90s Vitest worker-startup timeout on the primary dev machine (likely antivirus/cloud-sync interference with `node_modules` access) — not a code defect, doesn't affect `next build`, and is expected to behave normally in CI.
- Login is rate-limited (5 attempts / 15 minutes / email) via `login_attempts`, checked with the service-role client since login happens pre-session.
- `GET /api/patients` (empty query = browse all) is capped at 100 results — a ceiling, not full pagination.
