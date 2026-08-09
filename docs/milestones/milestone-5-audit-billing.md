# Milestone 5 — Audit Logging and Stripe Entry Point
# Actual keys - TODO
## Objective
Add accountability and a lightweight monetization path.

## Scope
This milestone covers:
- audit events for major lifecycle actions,
- and Stripe subscription entry flow.

## Boundary
This milestone does not include a full billing engine or advanced subscription management.

## Includes
- audit logging on create/update/save actions
- Stripe checkout entry point
- webhook handling and subscription status update

## Files
- features/billing/BillingCard.tsx
- server/audit/...
- app/api/stripe/checkout/route.ts
- app/api/stripe/webhook/route.ts
- types/audit.ts

## Acceptance criteria
- Important actions create audit entries.
- A user can start a Stripe checkout flow.
- Subscription state is reflected in the app.
