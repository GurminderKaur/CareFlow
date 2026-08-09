import { z } from 'zod';
import { createServerComponentClient } from '@/lib/auth/supabase';
import type { Patient, NewPatientInput } from '@/types/patient';

const newPatientSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
  phone: z.string().trim().min(1).optional(),
  email: z.string().trim().email('Please provide a valid email address').optional(),
});

export function validateNewPatientInput(input: unknown) {
  return newPatientSchema.safeParse(input);
}

interface PatientRow {
  id: string;
  full_name: string;
  date_of_birth: string;
  phone: string | null;
  email: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function toPatient(row: PatientRow): Patient {
  return {
    id: row.id,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createPatient(input: NewPatientInput, createdBy: string): Promise<Patient> {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase
    .from('patients')
    .insert({
      full_name: input.fullName,
      date_of_birth: input.dateOfBirth,
      phone: input.phone,
      email: input.email,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Unable to create patient');
  }

  return toPatient(data);
}

export async function findPatientById(id: string): Promise<Patient | null> {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase.from('patients').select().eq('id', id).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toPatient(data) : null;
}

const MAX_SEARCH_RESULTS = 100;

export async function searchPatientsByName(query: string): Promise<Patient[]> {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase
    .from('patients')
    .select()
    .ilike('full_name', `%${query}%`)
    .order('full_name', { ascending: true })
    .limit(MAX_SEARCH_RESULTS);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(toPatient);
}
