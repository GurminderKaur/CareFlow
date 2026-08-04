# Milestone 4 — Visit Workflow and AI Generation

## Objective
Capture visit details and generate AI-based summaries and follow-up instructions.

## Scope
This milestone covers:
- visit form capture,
- AI generation,
- review/edit before save,
- and persistence of the final output.

## Boundary
This milestone does not include billing or full compliance features.

## Includes
- visit form UI
- server-side AI integration
- review/edit step before saving
- saving final summary and follow-up instructions

## Files
- features/visits/VisitComposer.tsx
- server/ai/summarize-visit.ts
- server/visits/...
- app/api/visits/route.ts
- app/api/ai/route.ts
- types/visit.ts

## Acceptance criteria
- A staff user can create a visit record.
- The system can generate a summary and follow-up instructions from notes.
- The staff user can review and edit the generated text before saving.
- The final output is stored.
