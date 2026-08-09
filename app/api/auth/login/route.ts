import { NextResponse } from 'next/server';
import { validateLoginInput, validateStaffCredentials } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/auth/supabase';
import { countRecentLoginAttempts, recordLoginAttempt } from '@/lib/db/login-attempts';
import { errorResponse, unexpectedErrorResponse, validationErrorResponse } from '@/lib/api/errors';
import type { LoginResponse } from '@/types/auth';

const MAX_LOGIN_ATTEMPTS = 5;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = validateLoginInput(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const serviceClient = createServiceRoleClient();

  try {
    const attempts = await countRecentLoginAttempts(serviceClient, parsed.data.email);

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      return errorResponse('Too many login attempts. Please try again later.', 429);
    }

    await recordLoginAttempt(serviceClient, parsed.data.email);
  } catch (error) {
    return unexpectedErrorResponse(error, 'Unable to process login');
  }

  const user = await validateStaffCredentials(parsed.data.email, parsed.data.password);

  if (!user) {
    return errorResponse('Invalid credentials', 401);
  }

  return NextResponse.json<LoginResponse>({ ok: true, user });
}
