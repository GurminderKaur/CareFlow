// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { VisitComposer } from '../features/visits/VisitComposer';
import type { Patient } from '../types/patient';

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

const patient: Patient = {
  id: 'patient-1',
  fullName: 'Jane Doe',
  dateOfBirth: '1990-01-15',
  createdBy: 'user-1',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const visit = {
  id: 'visit-1',
  patientId: patient.id,
  appointmentDate: '2026-08-06T10:00:00.000Z',
  visitType: 'Follow-up',
  notes: 'Patient reports feeling better.',
  createdBy: 'user-1',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('VisitComposer', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('prompts to select a patient when none is selected', () => {
    render(<VisitComposer patient={null} />);

    expect(screen.getByText('Select a patient above to capture a visit.')).toBeInTheDocument();
  });

  it('creates a visit, generates a summary, and saves it', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ visit }))
      .mockResolvedValueOnce(jsonResponse({ summary: 'AI summary.', followUpInstructions: 'AI follow-up.' }))
      .mockResolvedValueOnce(
        jsonResponse({ visit: { ...visit, summary: 'AI summary.', followUpInstructions: 'AI follow-up.' } })
      );

    render(<VisitComposer patient={patient} />);

    fireEvent.change(screen.getByLabelText('Appointment date'), { target: { value: '2026-08-06T10:00' } });
    fireEvent.change(screen.getByLabelText('Visit notes'), { target: { value: 'Patient reports feeling better.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create visit' }));

    await screen.findByRole('button', { name: 'Generate summary' });
    fireEvent.click(screen.getByRole('button', { name: 'Generate summary' }));

    const summaryField = await screen.findByLabelText('Summary');
    expect(summaryField).toHaveValue('AI summary.');
    expect(screen.getByLabelText('Follow-up instructions')).toHaveValue('AI follow-up.');

    fireEvent.click(screen.getByRole('button', { name: 'Save visit' }));

    expect(await screen.findByText('Visit saved successfully.')).toBeInTheDocument();
  });

  it('shows an error when generation fails but keeps the fields editable', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ visit }))
      .mockResolvedValueOnce(jsonResponse({ error: 'The AI provider failed to generate a summary' }, false));

    render(<VisitComposer patient={patient} />);

    fireEvent.change(screen.getByLabelText('Appointment date'), { target: { value: '2026-08-06T10:00' } });
    fireEvent.change(screen.getByLabelText('Visit notes'), { target: { value: 'Patient reports feeling better.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create visit' }));

    await screen.findByRole('button', { name: 'Generate summary' });
    fireEvent.click(screen.getByRole('button', { name: 'Generate summary' }));

    expect(await screen.findByText('The AI provider failed to generate a summary')).toBeInTheDocument();

    const summaryField = screen.getByLabelText('Summary');
    fireEvent.change(summaryField, { target: { value: 'Manually written summary.' } });
    expect(summaryField).toHaveValue('Manually written summary.');
  });
});
