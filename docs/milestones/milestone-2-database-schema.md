# Milestone 2 — Database Schema and Persistence Layer

## Objective
Create the persistence layer and schema needed for core business records.

## Scope
This milestone covers:
- database table definitions,
- typed data access boundaries,
- and initial persistence hooks for patients, visits, and audit events.

## Boundary
This milestone does not include the full UI flow for patients or visits. It focuses on the storage contract.

## Includes
- schema definition for users, patients, visits, AI outputs, audit events, and subscriptions
- typed repository or service layer
- environment configuration for database access

## Files
- lib/db/...
- supabase/schema.sql
- types/patient.ts
- types/visit.ts
- types/audit.ts
- .env.example

## Acceptance criteria
- The core schema can be created and understood.
- The app has a typed persistence layer for future CRUD milestones.
- Sensitive configuration is stored in environment variables.
