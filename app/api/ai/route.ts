import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { summarizeVisit, AI_MODEL } from '@/server/ai/summarize-visit';
import { countAiOutputsForVisit, recordAiOutput } from '@/lib/db/ai-outputs';
import { errorResponse, unexpectedErrorResponse, validationErrorResponse } from '@/lib/api/errors';
import type { VisitSummary } from '@/types/visit';

const MAX_GENERATIONS_PER_VISIT = 5;

const generateRequestSchema = z.object({
  visitId: z.string().trim().min(1, 'A visit is required'),
  notes: z.string().trim().min(1, 'Visit notes are required'),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = generateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const { visitId, notes } = parsed.data;

  let attempts: number;

  try {
    attempts = await countAiOutputsForVisit(visitId);
  } catch (error) {
    return unexpectedErrorResponse(error, 'Unable to check the generation limit for this visit');
  }

  if (attempts >= MAX_GENERATIONS_PER_VISIT) {
    return errorResponse('This visit has reached its AI generation limit. Edit the summary manually instead.', 429);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let result: VisitSummary;

  try {
    result = await summarizeVisit(client, notes);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The AI provider failed to generate a summary';

    try {
      await recordAiOutput({ visitId, modelName: AI_MODEL, status: 'failed', errorMessage: message });
    } catch {
      // Best-effort: don't let a failure to log the failure hide the original error from the user.
    }

    return errorResponse(message, 502);
  }

  try {
    await recordAiOutput({
      visitId,
      modelName: AI_MODEL,
      status: 'completed',
      summary: result.summary,
      followUpInstructions: result.followUpInstructions,
    });
  } catch (error) {
    return unexpectedErrorResponse(error, 'Unable to save the generated summary');
  }

  return NextResponse.json<VisitSummary>(result);
}
