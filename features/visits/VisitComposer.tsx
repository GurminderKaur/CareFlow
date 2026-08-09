'use client';

import { useState, type FormEvent } from 'react';
import type { Patient } from '@/types/patient';
import type { VisitRecord, VisitResponse, VisitSummary } from '@/types/visit';
import type { ApiErrorResponse } from '@/types/api';

const VISIT_TYPES = ['Follow-up', 'New patient', 'Annual check-up', 'Urgent'];

interface VisitComposerProps {
  patient: Patient | null;
}

export function VisitComposer({ patient }: VisitComposerProps) {
  const [appointmentDate, setAppointmentDate] = useState('');
  const [visitType, setVisitType] = useState(VISIT_TYPES[0]);
  const [notes, setNotes] = useState('');
  const [creatingVisit, setCreatingVisit] = useState(false);
  const [createVisitError, setCreateVisitError] = useState('');

  const [visit, setVisit] = useState<VisitRecord | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [summary, setSummary] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  async function handleCreateVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patient) return;

    setCreateVisitError('');
    setCreatingVisit(true);

    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          appointmentDate: new Date(appointmentDate).toISOString(),
          visitType,
          notes,
        }),
      });
      const body = (await response.json()) as VisitResponse | ApiErrorResponse;

      if (!response.ok) {
        throw new Error((body as ApiErrorResponse).error);
      }

      setVisit((body as VisitResponse).visit);
    } catch (err) {
      setCreateVisitError(err instanceof Error ? err.message : 'Unable to create visit');
    } finally {
      setCreatingVisit(false);
    }
  }

  async function handleGenerate() {
    if (!visit) return;

    setGenerateError('');
    setGenerating(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitId: visit.id, notes: visit.notes }),
      });
      const body = (await response.json()) as VisitSummary | ApiErrorResponse;

      if (!response.ok) {
        throw new Error((body as ApiErrorResponse).error);
      }

      const result = body as VisitSummary;
      setSummary(result.summary);
      setFollowUpInstructions(result.followUpInstructions);
      setHasGenerated(true);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Unable to generate a summary');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!visit) return;

    setSaveError('');
    setSaveSuccess('');
    setSaving(true);

    try {
      const response = await fetch(`/api/visits/${visit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, followUpInstructions }),
      });
      const body = (await response.json()) as VisitResponse | ApiErrorResponse;

      if (!response.ok) {
        throw new Error((body as ApiErrorResponse).error);
      }

      setVisit((body as VisitResponse).visit);
      setSaveSuccess('Visit saved successfully.');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save visit');
    } finally {
      setSaving(false);
    }
  }

  function handleStartNewVisit() {
    setVisit(null);
    setAppointmentDate('');
    setVisitType(VISIT_TYPES[0]);
    setNotes('');
    setHasGenerated(false);
    setSummary('');
    setFollowUpInstructions('');
    setGenerateError('');
    setSaveError('');
    setSaveSuccess('');
  }

  if (!patient) {
    return (
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Visit</h2>
        <p className="mt-2 text-sm text-slate-500">Select a patient above to capture a visit.</p>
      </section>
    );
  }

  if (!visit) {
    return (
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">New visit for {patient.fullName}</h2>
        <form onSubmit={handleCreateVisit} className="mt-4 flex max-w-lg flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Appointment date</span>
            <input
              type="datetime-local"
              value={appointmentDate}
              onChange={(event) => setAppointmentDate(event.target.value)}
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Visit type</span>
            <select
              value={visitType}
              onChange={(event) => setVisitType(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              {VISIT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Visit notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              required
              rows={6}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>
          {createVisitError ? <div className="text-sm text-red-600">{createVisitError}</div> : null}
          <button
            type="submit"
            disabled={creatingVisit}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {creatingVisit ? 'Creating…' : 'Create visit'}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Visit for {patient.fullName}</h2>
      <p className="mt-1 text-sm text-slate-500">{visit.visitType} — {new Date(visit.appointmentDate).toLocaleString()}</p>
      <p className="mt-3 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-700">{visit.notes}</p>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating}
        className="mt-4 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {generating ? 'Generating…' : hasGenerated ? 'Regenerate summary' : 'Generate summary'}
      </button>

      {generateError ? <div className="mt-3 text-sm text-red-600">{generateError}</div> : null}

      <p className="mt-4 text-xs text-slate-500">
        AI-generated text may be inaccurate or incomplete. Review it against the visit notes above before saving.
      </p>

      <form onSubmit={handleSave} className="mt-2 flex max-w-lg flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Summary</span>
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            required
            rows={4}
            placeholder="Generate a summary, or write one manually."
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Follow-up instructions</span>
          <textarea
            value={followUpInstructions}
            onChange={(event) => setFollowUpInstructions(event.target.value)}
            required
            rows={4}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </label>
        {saveError ? <div className="text-sm text-red-600">{saveError}</div> : null}
        {saveSuccess ? <div className="text-sm text-emerald-600">{saveSuccess}</div> : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save visit'}
          </button>
          <button
            type="button"
            onClick={handleStartNewVisit}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Start new visit
          </button>
        </div>
      </form>
    </section>
  );
}
