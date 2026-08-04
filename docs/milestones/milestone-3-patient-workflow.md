# Milestone 3 — Patient Workflow

## Objective
Allow staff to find or create a patient record.

## Scope
This milestone covers:
- patient lookup,
- patient creation,
- and the display of basic patient information.

## Boundary
This milestone does not include visit summarization or billing.

## Includes
- patient search form
- create patient form
- patient detail view
- server endpoint for patient operations

## Files
- features/patients/PatientSearch.tsx
- server/patients/...
- app/api/patients/route.ts
- types/patient.ts

## Acceptance criteria
- A staff user can search for an existing patient.
- A staff user can create a new patient record.
- The created or selected patient can be used in later visit steps.
