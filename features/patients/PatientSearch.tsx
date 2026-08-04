'use client';

import { useState } from 'react';

export function PatientSearch() {
  const [query, setQuery] = useState('');

  return (
    <section style={{ marginTop: '1.5rem' }}>
      <h2>Patient lookup</h2>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search patient by name"
        style={{ padding: '0.75rem', width: '100%', maxWidth: 360 }}
      />
      <p style={{ color: '#475569' }}>This MVP will support patient search and create flow.</p>
    </section>
  );
}
