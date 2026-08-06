import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/auth/supabase';
import { validateLoginInput } from '@/lib/auth/session';
import { errorResponse, validationErrorResponse } from '@/lib/api/errors';
import type { SignupResponse } from '@/types/auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = validateLoginInput(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const supabase = await createServerComponentClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        role: 'staff',
      },
    },
  });

  if (error || !data.user) {
    return errorResponse(error?.message ?? 'Unable to create account', 400);
  }

  return NextResponse.json<SignupResponse>({
    ok: true,
    user: { id: data.user.id, email: data.user.email ?? parsed.data.email },
  });
}
