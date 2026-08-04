export interface VisitSummary {
  summary: string;
  followUpInstructions: string;
}

export interface VisitRecord {
  id: string;
  patientId: string;
  appointmentDate: string;
  notes: string;
  summary?: VisitSummary;
  createdAt: string;
  updatedAt: string;
}
