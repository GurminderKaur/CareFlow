# Core Schema Proposal

## Overview
The MVP uses a simple relational model focused on staff, patients, visits, AI outputs, audit events, and billing state.

## Entities

### users
Represents authenticated staff users.

Fields:
- id (uuid, primary key)
- email (text, unique)
- full_name (text)
- role (text; staff/admin)
- created_at (timestamp)
- updated_at (timestamp)

### patients
Represents a patient record that staff can search or create.

Fields:
- id (uuid, primary key)
- full_name (text)
- date_of_birth (date)
- phone (text, nullable)
- email (text, nullable)
- created_by (uuid, foreign key to users.id)
- created_at (timestamp)
- updated_at (timestamp)

### visits
Represents a visit or appointment record.

Fields:
- id (uuid, primary key)
- patient_id (uuid, foreign key to patients.id)
- appointment_date (timestamp)
- visit_type (text)
- notes (text)
- summary (text, nullable)
- follow_up_instructions (text, nullable)
- created_by (uuid, foreign key to users.id)
- created_at (timestamp)
- updated_at (timestamp)

### ai_outputs
Stores AI-generated suggestions for a visit.

Fields:
- id (uuid, primary key)
- visit_id (uuid, foreign key to visits.id)
- summary (text)
- follow_up_instructions (text)
- model_name (text)
- status (text; completed/failed)
- created_at (timestamp)

### audit_events
Stores important actions for accountability.

Fields:
- id (uuid, primary key)
- entity_type (text; patient/visit/subscription)
- entity_id (uuid)
- action (text)
- performed_by (uuid, foreign key to users.id)
- details (jsonb, nullable)
- created_at (timestamp)

### subscriptions
Stores a lightweight billing state for the MVP.

Fields:
- id (uuid, primary key)
- user_id (uuid, foreign key to users.id)
- stripe_customer_id (text, nullable)
- stripe_subscription_id (text, nullable)
- status (text)
- current_period_end (timestamp, nullable)
- created_at (timestamp)
- updated_at (timestamp)

## Relationships
- one user can create many patients
- one patient can have many visits
- one visit can have one or more AI outputs
- one user can create many audit events
- one user can have one subscription record

## Design principles
- Keep the schema simple and explicit.
- Make auditability a first-class requirement.
- Prefer clear relationships over cleverness.
- Use nullable fields only when necessary.

## Data handling rules
- Sensitive patient data must be stored only in server-managed storage.
- AI output should not be treated as trusted medical advice.
- Audit entries should be append-only in spirit and should not be overwritten.
