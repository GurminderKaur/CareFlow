import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { handleStripeEvent } from '@/server/billing/handle-stripe-event';
import { createServiceRoleClient } from '@/lib/auth/supabase';
import { errorResponse } from '@/lib/api/errors';

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return errorResponse('Webhook is not configured', 400);
  }

  const payload = await request.text();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid webhook signature';
    return errorResponse(message, 400);
  }

  try {
    await handleStripeEvent(event, createServiceRoleClient());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to process webhook event';
    return errorResponse(message, 500);
  }

  return NextResponse.json({ received: true });
}
