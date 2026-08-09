import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth/session';
import { errorResponse, unexpectedErrorResponse } from '@/lib/api/errors';
import type { CheckoutSessionResponse } from '@/types/subscription';

export async function POST(request: Request) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  const priceId = process.env.STRIPE_PRICE_ID;

  if (!priceId) {
    return errorResponse('Billing is not configured yet', 503);
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');
  const origin = new URL(request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: user.id,
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancelled`,
    });

    if (!session.url) {
      return errorResponse('Unable to start checkout', 502);
    }

    return NextResponse.json<CheckoutSessionResponse>({ url: session.url });
  } catch (error) {
    return unexpectedErrorResponse(error, 'Unable to start checkout');
  }
}
