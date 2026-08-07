import { describe, expect, it } from 'vitest';
import { validateNewPatientInput } from '../lib/db/patients';
import { validateNewVisitInput, validateSaveVisitSummaryInput } from '../lib/db/visits';
import { validateNewAuditEventInput } from '../lib/db/audit-events';
import { validateNewAiOutputInput } from '../lib/db/ai-outputs';

describe('patient input validation', () => {
  it('accepts a valid patient', () => {
    const result = validateNewPatientInput({
      fullName: 'Jane Doe',
      dateOfBirth: '1990-01-15',
      phone: '555-0100',
      email: 'jane@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a patient with no phone or email', () => {
    const result = validateNewPatientInput({ fullName: 'Jane Doe', dateOfBirth: '1990-01-15' });
    expect(result.success).toBe(true);
  });

  it('rejects a missing full name', () => {
    const result = validateNewPatientInput({ fullName: '', dateOfBirth: '1990-01-15' });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed date of birth', () => {
    const result = validateNewPatientInput({ fullName: 'Jane Doe', dateOfBirth: '01/15/1990' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = validateNewPatientInput({
      fullName: 'Jane Doe',
      dateOfBirth: '1990-01-15',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});

describe('visit input validation', () => {
  it('accepts a valid visit', () => {
    const result = validateNewVisitInput({
      patientId: 'patient-123',
      appointmentDate: '2026-08-04T10:00:00.000Z',
      visitType: 'follow-up',
      notes: 'Patient reports feeling better.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty notes', () => {
    const result = validateNewVisitInput({
      patientId: 'patient-123',
      appointmentDate: '2026-08-04T10:00:00.000Z',
      visitType: 'follow-up',
      notes: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing patient id', () => {
    const result = validateNewVisitInput({
      patientId: '',
      appointmentDate: '2026-08-04T10:00:00.000Z',
      visitType: 'follow-up',
      notes: 'Notes',
    });
    expect(result.success).toBe(false);
  });
});

describe('save visit summary input validation', () => {
  it('accepts a valid summary and follow-up', () => {
    const result = validateSaveVisitSummaryInput({
      summary: 'Patient is recovering well.',
      followUpInstructions: 'Return in two weeks.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty summary', () => {
    const result = validateSaveVisitSummaryInput({
      summary: '',
      followUpInstructions: 'Return in two weeks.',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty follow-up instructions', () => {
    const result = validateSaveVisitSummaryInput({
      summary: 'Patient is recovering well.',
      followUpInstructions: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('audit event input validation', () => {
  it('accepts a valid audit event', () => {
    const result = validateNewAuditEventInput({
      entityType: 'patient',
      entityId: 'patient-123',
      action: 'create',
      performedBy: 'user-123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown entity type', () => {
    const result = validateNewAuditEventInput({
      entityType: 'invoice',
      entityId: 'patient-123',
      action: 'create',
      performedBy: 'user-123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing action', () => {
    const result = validateNewAuditEventInput({
      entityType: 'patient',
      entityId: 'patient-123',
      action: '',
      performedBy: 'user-123',
    });
    expect(result.success).toBe(false);
  });
});

describe('ai output input validation', () => {
  it('accepts a valid completed output', () => {
    const result = validateNewAiOutputInput({
      visitId: 'visit-123',
      modelName: 'claude-sonnet-5',
      status: 'completed',
      summary: 'Visit summary.',
      followUpInstructions: 'Follow up in two weeks.',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid failed output', () => {
    const result = validateNewAiOutputInput({
      visitId: 'visit-123',
      modelName: 'claude-sonnet-5',
      status: 'failed',
      errorMessage: 'The AI provider timed out.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a completed output missing summary', () => {
    const result = validateNewAiOutputInput({
      visitId: 'visit-123',
      modelName: 'claude-sonnet-5',
      status: 'completed',
      followUpInstructions: 'Follow up in two weeks.',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a failed output missing an error message', () => {
    const result = validateNewAiOutputInput({
      visitId: 'visit-123',
      modelName: 'claude-sonnet-5',
      status: 'failed',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown status', () => {
    const result = validateNewAiOutputInput({
      visitId: 'visit-123',
      modelName: 'claude-sonnet-5',
      status: 'pending',
      summary: 'Visit summary.',
      followUpInstructions: 'Follow up in two weeks.',
    });
    expect(result.success).toBe(false);
  });
});
