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

## Current implementation posture
- Milestone 1 is focused on authentication, role-aware access, and a protected shell.
- Milestone 2 should introduce database schema, persistence, and real patient/visit workflows.
