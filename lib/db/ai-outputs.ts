import { z } from 'zod';
import { createServerComponentClient } from '@/lib/auth/supabase';
import type { AiOutput, NewAiOutputInput } from '@/types/ai-output';

const newAiOutputSchema = z.discriminatedUnion('status', [
  z.object({
    visitId: z.string().trim().min(1, 'A visit is required'),
    modelName: z.string().trim().min(1, 'Model name is required'),
    status: z.literal('completed'),
    summary: z.string().trim().min(1, 'Summary is required'),
    followUpInstructions: z.string().trim().min(1, 'Follow-up instructions are required'),
  }),
  z.object({
    visitId: z.string().trim().min(1, 'A visit is required'),
    modelName: z.string().trim().min(1, 'Model name is required'),
    status: z.literal('failed'),
    errorMessage: z.string().trim().min(1, 'Error message is required'),
  }),
]);

export function validateNewAiOutputInput(input: unknown) {
  return newAiOutputSchema.safeParse(input);
}

interface AiOutputRow {
  id: string;
  visit_id: string;
  summary: string | null;
  follow_up_instructions: string | null;
  error_message: string | null;
  model_name: string;
  status: AiOutput['status'];
  created_at: string;
}

function toAiOutput(row: AiOutputRow): AiOutput {
  return {
    id: row.id,
    visitId: row.visit_id,
    summary: row.summary ?? undefined,
    followUpInstructions: row.follow_up_instructions ?? undefined,
    errorMessage: row.error_message ?? undefined,
    modelName: row.model_name,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function recordAiOutput(input: NewAiOutputInput): Promise<AiOutput> {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase
    .from('ai_outputs')
    .insert({
      visit_id: input.visitId,
      model_name: input.modelName,
      status: input.status,
      summary: input.status === 'completed' ? input.summary : null,
      follow_up_instructions: input.status === 'completed' ? input.followUpInstructions : null,
      error_message: input.status === 'failed' ? input.errorMessage : null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Unable to record AI output');
  }

  return toAiOutput(data);
}

export async function countAiOutputsForVisit(visitId: string): Promise<number> {
  const supabase = await createServerComponentClient();
  const { count, error } = await supabase
    .from('ai_outputs')
    .select('id', { count: 'exact', head: true })
    .eq('visit_id', visitId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
