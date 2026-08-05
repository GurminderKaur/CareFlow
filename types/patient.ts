export interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  phone?: string;
  email?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewPatientInput {
  fullName: string;
  dateOfBirth: string;
  phone?: string;
  email?: string;
}
