import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { upsertSubscriptionForUser, updateSubscriptionByStripeSubscriptionId } from '@/lib/db/subscriptions';

export async function handleStripeEvent(event: Stripe.Event, client: SupabaseClient): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      if (!userId || typeof customerId !== 'string' || typeof subscriptionId !== 'string') {
        return;
      }

      await upsertSubscriptionForUser(client, {
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: 'active',
      });
      return;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const periodEnd = subscription.items.data[0]?.current_period_end;

      await updateSubscriptionByStripeSubscriptionId(client, subscription.id, {
        status: subscription.status,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : undefined,
      });
      return;
    }

    default:
      return;
  }
}
