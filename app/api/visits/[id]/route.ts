import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth/session';
import { saveVisitSummary, validateSaveVisitSummaryInput } from '@/lib/db/visits';
import { errorResponse, unexpectedErrorResponse, validationErrorResponse } from '@/lib/api/errors';
import type { VisitResponse } from '@/types/visit';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = validateSaveVisitSummaryInput(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const visit = await saveVisitSummary(id, parsed.data.summary, parsed.data.followUpInstructions);
    return NextResponse.json<VisitResponse>({ visit });
  } catch (error) {
    return unexpectedErrorResponse(error, 'Unable to save visit summary');
  }
}
