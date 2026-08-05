// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PatientSearch } from '../features/patients/PatientSearch';

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe('PatientSearch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('does not search when the query is empty', () => {
    render(<PatientSearch />);
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(fetch).not.toHaveBeenCalled();
  });

  it('renders search results and shows the detail panel on selection', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        patients: [
          {
            id: '1',
            fullName: 'Jane Doe',
            dateOfBirth: '1990-01-15',
            createdBy: 'user-1',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
        ],
      })
    );

    render(<PatientSearch />);
    fireEvent.change(screen.getByPlaceholderText('Search patient by name'), { target: { value: 'Jane' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    const result = await screen.findByRole('button', { name: /Jane Doe/ });
    fireEvent.click(result);

    expect(await screen.findByRole('heading', { name: 'Jane Doe' })).toBeInTheDocument();
    expect(screen.getByText('Date of birth: 1990-01-15')).toBeInTheDocument();
  });

  it('shows a search error message', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: 'Unable to search patients' }, false));

    render(<PatientSearch />);
    fireEvent.change(screen.getByPlaceholderText('Search patient by name'), { target: { value: 'Jane' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('Unable to search patients')).toBeInTheDocument();
  });

  it('creates a patient and selects it', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        patient: {
          id: '2',
          fullName: 'New Patient',
          dateOfBirth: '2000-05-01',
          createdBy: 'user-1',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      })
    );

    render(<PatientSearch />);
    fireEvent.click(screen.getByRole('button', { name: 'Add new patient' }));

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'New Patient' } });
    fireEvent.change(screen.getByLabelText('Date of birth'), { target: { value: '2000-05-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create patient' }));

    expect(await screen.findByRole('heading', { name: 'New Patient' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument();
  });
});
