# Engineering Decision Record (EDR) — CareFlow MVP

## Status
Accepted for MVP implementation.

## Context
We are building CareFlow, a production-minded SaaS for small clinics to reduce administrative work. The MVP must demonstrate strong TypeScript discipline, a real AI integration, secure data handling, and a credible path to billing. The product should not attempt to replace an EMR.

## Decision Summary
We will build the MVP using Next.js, TypeScript, Supabase, PostgreSQL, Anthropic Claude, Stripe, Tailwind, Vitest, Playwright, and Vercel.

## Why we chose Next.js
### Decision
Use Next.js App Router for the product frontend and server-side entry points.

### Why
- It matches the job description directly.
- It provides a modern React-based structure with routing and server capabilities.
- It is a strong and recognizable choice for a production SaaS.
- It allows us to keep the app in one repository while still separating UI and server logic.

### Alternatives considered
- Vite + React SPA
- Remix
- NestJS + React separate frontend

### Trade-offs
- Next.js adds conventions and framework complexity compared to a simple SPA.
- The App Router requires a more deliberate structure, but that is worthwhile for a production-quality app.

## Why we chose Supabase
### Decision
Use Supabase for authentication, Postgres database, and Row-Level Security.

### Why
- It reduces setup time for auth and database access.
- It gives us Postgres, auth, and secure row-based access control without building a custom backend stack first.
- It is credible for a SaaS MVP and aligns with the role’s interest in secure data handling.

### Alternatives considered
- Custom Node/Express backend + Postgres
- Firebase
- AWS Amplify

### Trade-offs
- Supabase is slightly opinionated and may feel less flexible than a fully custom backend.
- We must understand its auth and RLS model carefully to avoid security issues.

## Why we chose PostgreSQL
### Decision
Use PostgreSQL as the primary relational database.

### Why
- It is a strong production database choice.
- It works well with Supabase and supports the data relationships we need.
- It is appropriate for structured records such as patients, visits, audit events, and subscriptions.

### Alternatives considered
- MongoDB
- MySQL
- SQLite for development only

### Trade-offs
- PostgreSQL is more structured and requires deliberate schema design than document databases.
- This is a positive trade-off for a system that needs auditability and clarity.

## Why we chose TypeScript
### Decision
Use TypeScript throughout the project.

### Why
- The job description explicitly requires strong TypeScript.
- It improves confidence, maintainability, and reviewer trust.
- It helps prevent avoidable runtime mistakes in a domain with sensitive data.

### Alternatives considered
- JavaScript only
- Flow

### Trade-offs
- It adds a small amount of upfront overhead.
- The long-term payoff is better maintainability and safer refactoring.

## Why we chose AI integration
### Decision
Use Anthropic Claude for generating visit summaries and follow-up instructions.

### Why
- It is relevant to the job description and a meaningful product feature.
- It demonstrates real LLM integration in a production-like workflow.
- The product story is stronger when AI assists with a labor-intensive task.

### Alternatives considered
- No AI integration
- OpenAI GPT
- Rule-based summarization only

### Trade-offs
- LLM output can be inconsistent and must be validated.
- We need clear error handling, prompt structure, and human review before saving.

## Why we chose Stripe
### Decision
Use Stripe for subscription entry and billing state management.

### Why
- It gives the product a credible path to monetization.
- It is directly aligned with the job posting’s interest in getting a product to the point of taking money.

### Alternatives considered
- No billing in MVP
- Custom billing implementation

### Trade-offs
- Stripe adds integration work and webhook complexity.
- We will keep it lightweight for the MVP to avoid over-scoping.

## Architectural boundaries
### What runs in the browser
- UI rendering
- form state and validation
- user interaction
- client-side navigation
- client-side display of data already loaded from the server

### What runs on the server
- authentication checks
- database operations
- AI requests
- Stripe webhook handling
- business rules and validation
- audit logging

### What talks to the database
- Server-side code only
- Never from browser components directly
- Database access should happen through a server boundary layer

### Where configuration comes from
- Public configuration may be exposed to the browser only when safe
- Secrets must come from environment variables and never be embedded in client code
- Supabase keys and Stripe secrets belong in server-side environment configuration

### Where to save data
- Patient and visit data: PostgreSQL via Supabase
- AI-generated output: PostgreSQL alongside the visit record
- Audit events: PostgreSQL in a dedicated audit table
- Subscription status: PostgreSQL, updated from Stripe webhooks

## Data flow for MVP
1. Staff signs in.
2. Staff searches or creates a patient.
3. Staff enters visit details.
4. The server sends visit text to Claude.
5. Claude returns a summary and follow-up instructions.
6. The staff user reviews and edits the output.
7. The server saves the final output and writes an audit event.
8. Stripe can be used later for subscription state management.

## Implementation boundaries for MVP
### Must implement
- authenticated staff access
- patient lookup/create
- visit capture
- AI summarize and follow-up generation
- review/edit before save
- audit logging
- Stripe subscription entry flow

### Current implementation note for Milestone 1
- Authentication is implemented with a simple cookie-backed demo session to keep the first milestone lean.
- Browser code handles sign-in form state and navigation.
- Server routes handle credential validation and session creation.
- The app currently uses a demo email/password pair for the MVP while the production auth provider is planned for later.

### Explicitly out of scope for MVP
- EMR replacement
- complex scheduling
- prescription workflows
- advanced reporting
- multi-location support
- full compliance certification

## Milestones for implementation
### Milestone 1 — Foundation and app shell
Objective: get the app structure and environment ready.

Files to touch:
- app/layout.tsx
- app/page.tsx
- app/dashboard/page.tsx
- app/globals.css
- .env.example

Acceptance criteria:
- The app runs locally.
- A dashboard route exists.
- Environment variables are documented.

### Milestone 2 — Authentication and protected routes
Objective: secure the staff experience.

Files to touch:
- app/(auth)/login/page.tsx
- app/(dashboard)/layout.tsx or equivalent protected route structure
- lib/auth/session.ts
- middleware.ts

Acceptance criteria:
- A staff user can sign in.
- Unauthenticated users cannot access protected routes.

### Milestone 3 — Database schema and access layer
Objective: create the base persistence model.

Files to touch:
- lib/db/...
- supabase/schema.sql
- types/patient.ts
- types/visit.ts
- types/audit.ts

Acceptance criteria:
- Patients, visits, audit events, and subscription records can be stored.
- The schema is clear and intentional.

### Milestone 4 — Patient workflow
Objective: allow staff to locate or create a patient.

Files to touch:
- features/patients/PatientSearch.tsx
- server/patients/...
- app/api/patients/route.ts

Acceptance criteria:
- A staff user can search for a patient.
- A staff user can create a new patient.

### Milestone 5 — Visit workflow
Objective: capture visit context and prepare it for AI generation.

Files to touch:
- features/visits/VisitComposer.tsx
- server/visits/...
- app/api/visits/route.ts

Acceptance criteria:
- A visit can be created from the UI.
- The form captures the required details.

### Milestone 6 — AI summarization and review
Objective: generate and review AI output before save.

Files to touch:
- server/ai/summarize-visit.ts
- features/visits/VisitComposer.tsx
- app/api/ai/route.ts

Acceptance criteria:
- AI output is generated from visit notes.
- The user can review and edit the output before saving.

### Milestone 7 — Audit logging
Objective: record important actions.

Files to touch:
- server/audit/...
- app/api/audit/route.ts

Acceptance criteria:
- Major actions create audit entries.
- Audit data is stored separately from the editable record data.

### Milestone 8 — Stripe subscription entry
Objective: demonstrate monetization.

Files to touch:
- features/billing/BillingCard.tsx
- app/api/stripe/checkout/route.ts
- app/api/stripe/webhook/route.ts

Acceptance criteria:
- A user can start a checkout flow.
- The app can reflect subscription state.

### Milestone 9 — Tests and deployment
Objective: make the project credible and launchable.

Files to touch:
- tests/unit/...
- tests/e2e/...
- vercel config if needed

Acceptance criteria:
- Core happy path is covered.
- One end-to-end flow passes.
- The app can be deployed to Vercel.

## Feasibility assessment
This approach is feasible and achievable for a single developer if the scope stays disciplined.

The risk is not the technology stack. The real risk is scope creep. If we keep the MVP focused on the administrative workflow and avoid turning it into an EMR, this plan is realistic.
