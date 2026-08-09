import { NextResponse } from 'next/server';
import { getCurrentSessionUser, validateInviteInput } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/auth/supabase';
import { errorResponse, unexpectedErrorResponse, validationErrorResponse } from '@/lib/api/errors';
import type { InviteResponse } from '@/types/auth';

export async function POST(request: Request) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  if (user.role !== 'admin') {
    return errorResponse('Forbidden', 403);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = validateInviteInput(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const serviceClient = createServiceRoleClient();

  try {
    const { data, error } = await serviceClient.auth.admin.inviteUserByEmail(parsed.data.email);

    if (error || !data.user) {
      return errorResponse(error?.message ?? 'Unable to invite user', 502);
    }

    // app_metadata is not user-editable and must be set separately from the invite call itself.
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(data.user.id, {
      app_metadata: { role: 'staff' },
    });

    if (updateError) {
      return errorResponse(updateError.message, 502);
    }

    return NextResponse.json<InviteResponse>({ ok: true, email: parsed.data.email });
  } catch (error) {
    return unexpectedErrorResponse(error, 'Unable to invite user');
  }
}
