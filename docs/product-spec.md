# CareFlow Product Spec

## Product name
CareFlow

## Product goal
Help small clinics reduce administrative work by providing a focused workflow for staff to:
- authenticate securely,
- find or create a patient,
- record visit details,
- generate AI-powered visit summaries and follow-up instructions,
- review and edit the output before saving,
- and keep a record with audit logging.

## Problem statement
Small clinics spend significant time on repetitive administrative work after visits. CareFlow aims to reduce that overhead with a simple workflow that supports staff and improves consistency without replacing an EMR.

## Primary user
Staff member at a small clinic or private practice.

## Core user journey
1. Staff signs in.
2. Staff searches for or creates a patient.
3. Staff captures visit details.
4. The system generates a visit summary and follow-up instructions using AI.
5. Staff reviews and edits the proposed content.
6. The system saves the final content and records an audit event.

## MVP scope
### In scope
- staff authentication
- patient lookup and create
- visit capture
- AI-generated summary and follow-up instructions
- review/edit before save
- audit logging
- Stripe subscription entry point

### Out of scope
- full EMR replacement
- full scheduling/calendar engine
- prescription workflows
- multi-location support
- advanced analytics dashboards
- deep compliance automation beyond basic audit logging

## Functional requirements
### Authentication
- Staff must be able to sign in securely.
- Protected routes must be inaccessible to unauthenticated users.

### Patient workflow
- Staff must be able to search for an existing patient.
- Staff must be able to create a new patient record.

### Visit workflow
- Staff must be able to create a visit record.
- Staff must be able to capture visit notes and relevant details.

### AI workflow
- The system must generate a visit summary and follow-up instructions.
- The staff user must be able to review and edit the AI output before saving.
- If the AI provider fails, the system must surface a clear error message.

### Audit logging
- The system must log major actions such as create, update, and save.
- Audit entries must be stored and attributable to a user.

### Billing
- The system must provide a Stripe subscription entry flow.
- Billing state should be stored and reflected in the app.

## Non-functional requirements
- TypeScript throughout the app
- Secure handling of secrets and sensitive data
- Clear separation between browser and server code
- Basic test coverage for critical flows
- Deployable to Vercel

## Success criteria
The MVP is successful if a staff user can:
- sign in,
- locate or create a patient,
- capture a visit,
- generate and review AI output,
- save the final result,
- and view a basic billing entry point.
