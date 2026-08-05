'use client';

import { useState, type FormEvent } from 'react';
import type { Patient } from '@/types/patient';

export function PatientSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchError('');
    setSelectedPatient(null);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);

    try {
      const response = await fetch(`/api/patients?query=${encodeURIComponent(query.trim())}`);
      const body = await response.json();

      if (!response.ok) {
        throw new Error(typeof body.error === 'string' ? body.error : 'Unable to search patients');
      }

      setResults(body.patients);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Unable to search patients');
    } finally {
      setSearching(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError('');
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
      const body = await response.json();

      if (!response.ok) {
        const message = typeof body.error === 'string' ? body.error : 'Unable to create patient';
        throw new Error(message);
      }

      setSelectedPatient(body.patient);
      setResults((current) => [body.patient, ...current]);
      setShowCreateForm(false);
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
    <section style={{ marginTop: '1.5rem' }}>
      <h2>Patient lookup</h2>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search patient by name"
          style={{ padding: '0.75rem', width: '100%', maxWidth: 360 }}
        />
        <button type="submit" disabled={searching} style={{ padding: '0.75rem 1rem' }}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>

      {searchError ? <div style={{ color: '#b91c1c', marginTop: '0.5rem' }}>{searchError}</div> : null}

      {results.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
          {results.map((patient) => (
            <li key={patient.id} style={{ marginBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSelectedPatient(patient)}
                style={{ padding: '0.5rem 0.75rem', width: '100%', textAlign: 'left' }}
              >
                {patient.fullName} — {patient.dateOfBirth}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {selectedPatient ? (
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #cbd5e1', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>{selectedPatient.fullName}</h3>
          <p>Date of birth: {selectedPatient.dateOfBirth}</p>
          {selectedPatient.phone ? <p>Phone: {selectedPatient.phone}</p> : null}
          {selectedPatient.email ? <p>Email: {selectedPatient.email}</p> : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setShowCreateForm((current) => !current)}
        style={{ marginTop: '1rem', padding: '0.6rem 0.9rem' }}
      >
        {showCreateForm ? 'Cancel' : 'Add new patient'}
      </button>

      {showCreateForm ? (
        <form onSubmit={handleCreate} style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem', maxWidth: 360 }}>
          <label>
            <div>Full name</div>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem' }}
            />
          </label>
          <label>
            <div>Date of birth</div>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem' }}
            />
          </label>
          <label>
            <div>Phone (optional)</div>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              style={{ width: '100%', padding: '0.75rem' }}
            />
          </label>
          <label>
            <div>Email (optional)</div>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={{ width: '100%', padding: '0.75rem' }}
            />
          </label>
          {createError ? <div style={{ color: '#b91c1c' }}>{createError}</div> : null}
          <button type="submit" disabled={creating} style={{ padding: '0.75rem 1rem' }}>
            {creating ? 'Creating…' : 'Create patient'}
          </button>
        </form>
      ) : null}
    </section>
  );
}
