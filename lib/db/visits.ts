import { z } from 'zod';
import { createServerComponentClient } from '@/lib/auth/supabase';
import type { VisitRecord, NewVisitInput } from '@/types/visit';

const newVisitSchema = z.object({
  patientId: z.string().trim().min(1, 'A patient is required'),
  appointmentDate: z.string().trim().min(1, 'Appointment date is required'),
  visitType: z.string().trim().min(1, 'Visit type is required'),
  notes: z.string().trim().min(1, 'Visit notes are required'),
});

export function validateNewVisitInput(input: unknown) {
  return newVisitSchema.safeParse(input);
}

const saveVisitSummarySchema = z.object({
  summary: z.string().trim().min(1, 'Summary is required'),
  followUpInstructions: z.string().trim().min(1, 'Follow-up instructions are required'),
});

export function validateSaveVisitSummaryInput(input: unknown) {
  return saveVisitSummarySchema.safeParse(input);
}

interface VisitRow {
  id: string;
  patient_id: string;
  appointment_date: string;
  visit_type: string;
  notes: string;
  summary: string | null;
  follow_up_instructions: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function toVisit(row: VisitRow): VisitRecord {
  return {
    id: row.id,
    patientId: row.patient_id,
    appointmentDate: row.appointment_date,
    visitType: row.visit_type,
    notes: row.notes,
    summary: row.summary ?? undefined,
    followUpInstructions: row.follow_up_instructions ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createVisit(input: NewVisitInput, createdBy: string): Promise<VisitRecord> {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase
    .from('visits')
    .insert({
      patient_id: input.patientId,
      appointment_date: input.appointmentDate,
      visit_type: input.visitType,
      notes: input.notes,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Unable to create visit');
  }

  return toVisit(data);
}

export async function findVisitById(id: string): Promise<VisitRecord | null> {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase.from('visits').select().eq('id', id).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toVisit(data) : null;
}

export async function listVisitsByPatient(patientId: string): Promise<VisitRecord[]> {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase
    .from('visits')
    .select()
    .eq('patient_id', patientId)
    .order('appointment_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(toVisit);
}

export async function saveVisitSummary(
  id: string,
  summary: string,
  followUpInstructions: string
): Promise<VisitRecord> {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase
    .from('visits')
    .update({ summary, follow_up_instructions: followUpInstructions })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Unable to save visit summary');
  }

  return toVisit(data);
}
