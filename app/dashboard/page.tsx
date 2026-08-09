'use client';

import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { PatientSearch } from '@/features/patients/PatientSearch';
import { VisitComposer } from '@/features/visits/VisitComposer';
import type { Patient } from '@/types/patient';

export default function DashboardPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  return (
    <PageShell title="CareFlow Dashboard">
      <p className="text-sm text-slate-600">
        Find or create a patient, then capture a visit. AI summaries and billing will appear here in later milestones.
      </p>
      <PatientSearch onSelectPatient={setSelectedPatient} />
      <VisitComposer key={selectedPatient?.id ?? 'none'} patient={selectedPatient} />
    </PageShell>
  );
}
