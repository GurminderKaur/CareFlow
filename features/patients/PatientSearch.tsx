'use client';

import { useState, type FormEvent } from 'react';
import useSWR from 'swr';
import type { Patient, PatientListResponse, PatientResponse } from '@/types/patient';
import type { ApiErrorResponse } from '@/types/api';

async function fetchPatients(url: string): Promise<Patient[]> {
  const response = await fetch(url);
  const body = (await response.json()) as PatientListResponse | ApiErrorResponse;

  if (!response.ok) {
    throw new Error((body as ApiErrorResponse).error);
  }

  return (body as PatientListResponse).patients;
}

interface PatientSearchProps {
  onSelectPatient?: (patient: Patient | null) => void;
}

export function PatientSearch({ onSelectPatient }: PatientSearchProps) {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const {
    data: results = [],
    error: searchError,
    isLoading: searching,
    mutate,
  } = useSWR(`/api/patients?query=${encodeURIComponent(searchTerm)}`, fetchPatients, {
    shouldRetryOnError: false,
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  function selectPatient(patient: Patient | null) {
    setSelectedPatient(patient);
    onSelectPatient?.(patient);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    selectPatient(null);
    setSearchTerm(query.trim());
    setQuery('');
  }

  function openCreateForm() {
    setCreateError('');
    setCreateSuccess('');
    setShowCreateForm((current) => !current);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreating(true);

    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          dateOfBirth,
          phone: phone || undefined,
          email: email || undefined,
        }),
      });
      const body = (await response.json()) as PatientResponse | ApiErrorResponse;

      if (!response.ok) {
        throw new Error((body as ApiErrorResponse).error);
      }

      const { patient } = body as PatientResponse;
      selectPatient(patient);
      await mutate();
      setShowCreateForm(false);
      setCreateSuccess(`${patient.fullName} was created successfully.`);
      setFullName('');
      setDateOfBirth('');
      setPhone('');
      setEmail('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Unable to create patient');
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Patients</h2>

      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search patient by name"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={searching}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>

      {searchError ? <div className="mt-3 text-sm text-red-600">{searchError.message}</div> : null}

      {!searchError && searching ? <div className="mt-4 text-sm text-slate-500">Loading patients…</div> : null}

      {!searchError && !searching && results.length === 0 ? (
        <div className="mt-4 text-sm text-slate-500">No patients found.</div>
      ) : null}

      {results.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-100">
          {results.map((patient) => (
            <li key={patient.id}>
              <button
                type="button"
                onClick={() => selectPatient(patient)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="font-medium text-slate-900">{patient.fullName}</span>
                <span className="text-slate-500">{patient.dateOfBirth}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {selectedPatient ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-900">{selectedPatient.fullName}</h3>
          <p className="mt-1 text-sm text-slate-600">Date of birth: {selectedPatient.dateOfBirth}</p>
          {selectedPatient.phone ? <p className="text-sm text-slate-600">Phone: {selectedPatient.phone}</p> : null}
          {selectedPatient.email ? <p className="text-sm text-slate-600">Email: {selectedPatient.email}</p> : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={openCreateForm}
        className="mt-4 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        {showCreateForm ? 'Cancel' : 'Add new patient'}
      </button>

      {createSuccess ? <div className="mt-3 text-sm text-emerald-600">{createSuccess}</div> : null}

      {showCreateForm ? (
        <form onSubmit={handleCreate} className="mt-4 flex max-w-sm flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Full name</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Date of birth</span>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Phone (optional)</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Email (optional)</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>
          {createError ? <div className="text-sm text-red-600">{createError}</div> : null}
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {creating ? 'Creating…' : 'Create patient'}
          </button>
        </form>
      ) : null}
    </section>
  );
}
