# Implementation Notes

## Current milestone status
- Milestone 1 is in a stable, reviewable state for the auth boundary.
- The app now uses Supabase-backed auth helpers and server-side role enforcement.
- The work is ready to be validated manually and then promoted to a PR / preview deployment branch.

## Current implementation snapshot
- Login UI: [app/login/page.tsx](app/login/page.tsx)
- Login API: [app/api/auth/login/route.ts](app/api/auth/login/route.ts)
- Logout API: [app/api/auth/logout/route.ts](app/api/auth/logout/route.ts)
- Current-user API: [app/api/auth/me/route.ts](app/api/auth/me/route.ts)
- Signup API: [app/api/auth/signup/route.ts](app/api/auth/signup/route.ts)
- Auth/session helpers: [lib/auth/session.ts](lib/auth/session.ts)
- Supabase client setup: [lib/auth/supabase.ts](lib/auth/supabase.ts)
- Middleware guard: [middleware.ts](middleware.ts)
- Regression tests: [tests/auth.test.ts](tests/auth.test.ts)

## Verified architectural decisions
- Authentication remains server-enforced rather than client-only.
- Protected routes and API routes are guarded by middleware and server-side role checks.
- Supabase Auth is the intended provider for Milestone 1; persistence and database schema are deferred to Milestone 2.
- Secrets remain in environment variables and are not committed to source control.

## Recommended next actions after restart
1. Validate the login/logout flow manually in the browser.
2. Run the automated test suite and production build.
3. Review the diff and prepare a milestone PR.
4. Create a dedicated branch for Milestone 1 and push it for preview deployment.
5. Begin Milestone 2 once the auth boundary is confirmed.

## Risks to watch
- Do not add business logic or persistence into the auth boundary.
- Keep middleware and auth helpers centralized to avoid drift.
- Keep the milestone scope narrow until the auth boundary is fully verified.
