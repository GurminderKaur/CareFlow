import { z } from 'zod';
import { createServerComponentClient } from '@/lib/auth/supabase';
import type { AuditEvent, NewAuditEventInput } from '@/types/audit';

const newAuditEventSchema = z.object({
  entityType: z.enum(['patient', 'visit', 'subscription']),
  entityId: z.string().trim().min(1, 'Entity id is required'),
  action: z.string().trim().min(1, 'Action is required'),
  performedBy: z.string().trim().min(1, 'Performed-by user is required'),
  details: z.unknown().optional(),
});

export function validateNewAuditEventInput(input: unknown) {
  return newAuditEventSchema.safeParse(input);
}

interface AuditEventRow {
  id: string;
  entity_type: AuditEvent['entityType'];
  entity_id: string;
  action: string;
  performed_by: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

function toAuditEvent(row: AuditEventRow): AuditEvent {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    performedBy: row.performed_by,
    details: row.details ?? undefined,
    createdAt: row.created_at,
  };
}

export async function recordAuditEvent(input: NewAuditEventInput): Promise<AuditEvent> {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase
    .from('audit_events')
    .insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      action: input.action,
      performed_by: input.performedBy,
      details: input.details,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Unable to record audit event');
  }

  return toAuditEvent(data);
}

export async function recordAuditEventBestEffort(input: NewAuditEventInput): Promise<void> {
  try {
    await recordAuditEvent(input);
  } catch (error) {
    console.error('Failed to record audit event', error);
  }
}

export async function listAuditEventsForEntity(
  entityType: AuditEvent['entityType'],
  entityId: string
): Promise<AuditEvent[]> {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase
    .from('audit_events')
    .select()
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(toAuditEvent);
}
