# CareFlow

CareFlow is a workflow tool for small clinic staff: sign in, find or create a patient, capture a visit, generate an AI-assisted summary and follow-up instructions, review/edit, and save with an audit trail. See [docs/product-spec.md](docs/product-spec.md) for the full spec and [docs/EDR.md](docs/EDR.md) for architecture decisions.

## Stack
Next.js (App Router) · TypeScript · Supabase (Auth + Postgres) · Zod · Vitest · Tailwind

## Getting started
1. Copy `.env.example` to `.env.local` and fill in your Supabase project keys (see below).
2. Install dependencies: `npm install`
3. Run the dev server: `npm run dev`, then open [http://localhost:3000](http://localhost:3000)

## Environment variables
See [.env.example](.env.example). At minimum, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) are required for authentication to work locally.

## Scripts
- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run a production build
- `npm run lint` — run ESLint
- `npm test` — run the Vitest suite

## Project status
Milestone 1 (staff authentication and a protected app shell) is implemented. See [docs/milestones/](docs/milestones/) for the milestone plan and [docs/restart-state.md](docs/restart-state.md) for current status.
