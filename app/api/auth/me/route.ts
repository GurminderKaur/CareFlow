import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth/session';
import { errorResponse } from '@/lib/api/errors';
import type { MeResponse } from '@/types/auth';

export async function GET() {
  const user = await getCurrentSessionUser();

  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  return NextResponse.json<MeResponse>({ user });
}
