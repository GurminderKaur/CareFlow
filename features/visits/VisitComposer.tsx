'use client';

import { useState } from 'react';
import { summarizeVisit } from '@/server/ai/summarize-visit';

export function VisitComposer() {
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await summarizeVisit(notes);
      setSummary(`${result.summary}\n\n${result.followUpInstructions}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ marginTop: '1.5rem' }}>
      <h2>Visit notes</h2>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Enter visit notes"
        rows={8}
        style={{ width: '100%', padding: '0.75rem' }}
      />
      <button onClick={handleGenerate} disabled={loading} style={{ marginTop: '0.75rem', padding: '0.75rem 1rem' }}>
        {loading ? 'Generating…' : 'Generate summary'}
      </button>
      {summary ? <pre style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>{summary}</pre> : null}
    </section>
  );
}
