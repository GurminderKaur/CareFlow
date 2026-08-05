export interface VisitSummary {
  summary: string;
  followUpInstructions: string;
}

export interface VisitRecord {
  id: string;
  patientId: string;
  appointmentDate: string;
  visitType: string;
  notes: string;
  summary?: string;
  followUpInstructions?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewVisitInput {
  patientId: string;
  appointmentDate: string;
  visitType: string;
  notes: string;
}
