import { PageShell } from '@/components/shared/PageShell';
import { PatientSearch } from '@/features/patients/PatientSearch';
import { VisitComposer } from '@/features/visits/VisitComposer';
import { BillingCard } from '@/features/billing/BillingCard';

export default function DashboardPage() {
  return (
    <PageShell title="CareFlow Dashboard">
      <p>Staff can review patient context, capture visit details, and generate summaries here.</p>
      <PatientSearch />
      <VisitComposer />
      <BillingCard />
    </PageShell>
  );
}
