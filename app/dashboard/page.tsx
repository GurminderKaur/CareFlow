import { PageShell } from '@/components/shared/PageShell';
import { PatientSearch } from '@/features/patients/PatientSearch';

export default function DashboardPage() {
  return (
    <PageShell title="CareFlow Dashboard">
      <p className="text-sm text-slate-600">
        Find or create a patient to get started. Visit capture, AI summaries, and billing will appear here in later milestones.
      </p>
      <PatientSearch />
    </PageShell>
  );
}
