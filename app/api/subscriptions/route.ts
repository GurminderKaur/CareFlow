import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth/session';
import { findSubscriptionByUserId } from '@/lib/db/subscriptions';
import { errorResponse, unexpectedErrorResponse } from '@/lib/api/errors';
import type { SubscriptionResponse } from '@/types/subscription';

export async function GET() {
  const user = await getCurrentSessionUser();

  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const subscription = await findSubscriptionByUserId(user.id);
    return NextResponse.json<SubscriptionResponse>({ subscription });
  } catch (error) {
    return unexpectedErrorResponse(error, 'Unable to load subscription status');
  }
}
