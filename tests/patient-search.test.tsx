// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { PatientSearch } from '../features/patients/PatientSearch';

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

function renderPatientSearch() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <PatientSearch />
    </SWRConfig>
  );
}

describe('PatientSearch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('loads all patients on mount', async () => {
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

    renderPatientSearch();

    expect(await screen.findByRole('button', { name: /Jane Doe/ })).toBeInTheDocument();
  });

  it('shows a message when there are no patients', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ patients: [] }));

    renderPatientSearch();

    expect(await screen.findByText('No patients found.')).toBeInTheDocument();
  });

  it('searches, shows the detail panel on selection, and clears the search box', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ patients: [] }))
      .mockResolvedValueOnce(
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

    renderPatientSearch();
    await screen.findByText('No patients found.');

    const input = screen.getByPlaceholderText('Search patient by name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Jane' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    const result = await screen.findByRole('button', { name: /Jane Doe/ });
    expect(input.value).toBe('');

    fireEvent.click(result);

    expect(await screen.findByRole('heading', { name: 'Jane Doe' })).toBeInTheDocument();
  });

  it('shows a search error message', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ patients: [] }))
      .mockResolvedValueOnce(jsonResponse({ error: 'Unable to load patients' }, false));

    renderPatientSearch();
    await screen.findByText('No patients found.');

    fireEvent.change(screen.getByPlaceholderText('Search patient by name'), { target: { value: 'Jane' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('Unable to load patients')).toBeInTheDocument();
  });

  it('creates a patient and shows a success message', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ patients: [] }))
      .mockResolvedValueOnce(
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
      )
      .mockResolvedValueOnce(
        jsonResponse({
          patients: [
            {
              id: '2',
              fullName: 'New Patient',
              dateOfBirth: '2000-05-01',
              createdBy: 'user-1',
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
            },
          ],
        })
      );

    renderPatientSearch();
    await screen.findByText('No patients found.');

    fireEvent.click(screen.getByRole('button', { name: 'Add new patient' }));
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'New Patient' } });
    fireEvent.change(screen.getByLabelText('Date of birth'), { target: { value: '2000-05-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create patient' }));

    expect(await screen.findByRole('heading', { name: 'New Patient' })).toBeInTheDocument();
    expect(screen.getByText('New Patient was created successfully.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument();
  });
});
