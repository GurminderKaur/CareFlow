import { NextResponse } from 'next/server';
import { validateLoginInput, validateStaffCredentials } from '@/lib/auth/session';
import { errorResponse, validationErrorResponse } from '@/lib/api/errors';
import type { LoginResponse } from '@/types/auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = validateLoginInput(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const user = await validateStaffCredentials(parsed.data.email, parsed.data.password);

  if (!user) {
    return errorResponse('Invalid credentials', 401);
  }

  return NextResponse.json<LoginResponse>({ ok: true, user });
}
