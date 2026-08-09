import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth/session';
import { createVisit, validateNewVisitInput } from '@/lib/db/visits';
import { recordAuditEventBestEffort } from '@/lib/db/audit-events';
import { errorResponse, unexpectedErrorResponse, validationErrorResponse } from '@/lib/api/errors';
import type { VisitResponse } from '@/types/visit';

export async function POST(request: Request) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = validateNewVisitInput(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const visit = await createVisit(parsed.data, user.id);
    await recordAuditEventBestEffort({
      entityType: 'visit',
      entityId: visit.id,
      action: 'create',
      performedBy: user.id,
    });
    return NextResponse.json<VisitResponse>({ visit }, { status: 201 });
  } catch (error) {
    return unexpectedErrorResponse(error, 'Unable to create visit');
  }
}
