import { describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleStripeEvent } from '../server/billing/handle-stripe-event';

function mockSupabaseClient(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  const builder = {
    upsert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    select: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  };
  const from = vi.fn(() => builder);

  return { client: { from } as unknown as SupabaseClient, builder, from };
}

function fakeEvent(type: string, object: unknown): Stripe.Event {
  return { type, data: { object } } as unknown as Stripe.Event;
}

const subscriptionRow = {
  id: 'sub-row-1',
  user_id: 'user-1',
  stripe_customer_id: 'cus-1',
  stripe_subscription_id: 'sub-1',
  status: 'active',
  current_period_end: null,
  created_at: 't',
  updated_at: 't',
};

describe('handleStripeEvent', () => {
  it('upserts a subscription on checkout.session.completed', async () => {
    const { client, builder, from } = mockSupabaseClient({ data: subscriptionRow, error: null });

    const event = fakeEvent('checkout.session.completed', {
      client_reference_id: 'user-1',
      customer: 'cus-1',
      subscription: 'sub-1',
    });

    await handleStripeEvent(event, client);

    expect(from).toHaveBeenCalledWith('subscriptions');
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        stripe_customer_id: 'cus-1',
        stripe_subscription_id: 'sub-1',
        status: 'active',
      }),
      { onConflict: 'user_id' }
    );
  });

  it('does nothing when checkout.session.completed is missing required fields', async () => {
    const { client, builder } = mockSupabaseClient();

    const event = fakeEvent('checkout.session.completed', {
      client_reference_id: null,
      customer: 'cus-1',
      subscription: 'sub-1',
    });

    await handleStripeEvent(event, client);

    expect(builder.upsert).not.toHaveBeenCalled();
  });

  it('updates status and period end on customer.subscription.updated', async () => {
    const { client, builder } = mockSupabaseClient({ data: { ...subscriptionRow, status: 'past_due' }, error: null });

    const event = fakeEvent('customer.subscription.updated', {
      id: 'sub-1',
      status: 'past_due',
      items: { data: [{ current_period_end: 1893456000 }] },
    });

    await handleStripeEvent(event, client);

    expect(builder.update).toHaveBeenCalledWith({
      status: 'past_due',
      current_period_end: new Date(1893456000 * 1000).toISOString(),
    });
    expect(builder.eq).toHaveBeenCalledWith('stripe_subscription_id', 'sub-1');
  });

  it('marks a subscription canceled on customer.subscription.deleted', async () => {
    const { client, builder } = mockSupabaseClient({ data: { ...subscriptionRow, status: 'canceled' }, error: null });

    const event = fakeEvent('customer.subscription.deleted', {
      id: 'sub-1',
      status: 'canceled',
      items: { data: [] },
    });

    await handleStripeEvent(event, client);

    expect(builder.update).toHaveBeenCalledWith({ status: 'canceled', current_period_end: undefined });
  });

  it('ignores unhandled event types', async () => {
    const { client, from } = mockSupabaseClient();

    const event = fakeEvent('invoice.paid', {});

    await handleStripeEvent(event, client);

    expect(from).not.toHaveBeenCalled();
  });
});
