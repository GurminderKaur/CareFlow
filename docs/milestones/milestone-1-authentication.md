# Milestone 1 — Authentication and Protected Shell

## Objective
Create a production-ready staff authentication boundary with role-based access and protected routing.

## Scope
This milestone covers:
- validated sign-in,
- role-aware session handling,
- protected routes,
- and a secure app shell for the first product workflow.

## Boundary
This milestone does not include patient persistence, visit persistence, AI generation, or billing logic beyond the app shell boundary.

## Includes
- validated sign-in experience
- role-aware server-side access checks
- protected dashboard shell
- explicit session handling for future persistence in Supabase Auth

## Files
- app/login/page.tsx
- app/api/auth/login/route.ts
- app/api/auth/logout/route.ts
- app/api/auth/signup/route.ts
- app/api/auth/me/route.ts
- lib/auth/session.ts
- lib/auth/supabase.ts
- src/middleware.ts
- tests/auth.test.ts

## Acceptance criteria
- A user must provide a valid email and password to sign in.
- Protected routes require authentication and a staff-level role.
- The app exposes a clean protected shell for future milestones.
- Auth flow is covered by basic automated tests.

## Implementation notes
- The implementation now uses validation and a role-aware boundary.
- The auth model is designed to support Supabase Auth integration from the start.
- This milestone is intentionally focused on access control and correctness rather than a temporary scaffold.
