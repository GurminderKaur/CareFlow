import { describe, expect, it } from 'vitest';
import { validateNewPatientInput } from '../lib/db/patients';
import { validateNewVisitInput } from '../lib/db/visits';
import { validateNewAuditEventInput } from '../lib/db/audit-events';

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
