import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { VisitSummary } from '@/types/visit';

export const AI_MODEL = 'claude-sonnet-5';

const SUMMARY_TOOL_NAME = 'record_visit_summary';

const toolResultSchema = z.object({
  summary: z.string().trim().min(1),
  followUpInstructions: z.string().trim().min(1),
});

export async function summarizeVisit(client: Anthropic, notes: string): Promise<VisitSummary> {
  if (!notes.trim()) {
    throw new Error('Visit notes are required');
  }

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    system:
      'You are a clinical administrative assistant. Summarize the visit notes for the patient record and propose follow-up instructions for staff. Do not invent clinical facts not present in the notes.',
    messages: [{ role: 'user', content: notes }],
    tools: [
      {
        name: SUMMARY_TOOL_NAME,
        description: 'Record the visit summary and follow-up instructions.',
        input_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string', description: 'A concise summary of the visit.' },
            followUpInstructions: { type: 'string', description: 'Follow-up instructions for the patient or staff.' },
          },
          required: ['summary', 'followUpInstructions'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: SUMMARY_TOOL_NAME },
  });

  const toolUseBlock = response.content.find((block) => block.type === 'tool_use');

  if (!toolUseBlock) {
    throw new Error('The AI provider did not return a usable summary');
  }

  const parsed = toolResultSchema.safeParse((toolUseBlock as { input?: unknown }).input);

  if (!parsed.success) {
    throw new Error('The AI provider returned an unusable response');
  }

  return parsed.data;
}
