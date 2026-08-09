import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { handleStripeEvent } from '@/server/billing/handle-stripe-event';
import { createServiceRoleClient } from '@/lib/auth/supabase';
import { errorResponse, unexpectedErrorResponse } from '@/lib/api/errors';

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
    console.error('Invalid Stripe webhook signature', error);
    return errorResponse('Invalid webhook signature', 400);
  }

  try {
    await handleStripeEvent(event, createServiceRoleClient());
  } catch (error) {
    return unexpectedErrorResponse(error, 'Unable to process webhook event');
  }

  return NextResponse.json({ received: true });
}
