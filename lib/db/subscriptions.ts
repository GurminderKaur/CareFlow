import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/auth/supabase';
import type { Subscription, UpsertSubscriptionInput } from '@/types/subscription';

interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

function toSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id ?? undefined,
    stripeSubscriptionId: row.stripe_subscription_id ?? undefined,
    status: row.status,
    currentPeriodEnd: row.current_period_end ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase.from('subscriptions').select().eq('user_id', userId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toSubscription(data) : null;
}

export async function upsertSubscriptionForUser(
  client: SupabaseClient,
  input: UpsertSubscriptionInput
): Promise<Subscription> {
  const { data, error } = await client
    .from('subscriptions')
    .upsert(
      {
        user_id: input.userId,
        stripe_customer_id: input.stripeCustomerId,
        stripe_subscription_id: input.stripeSubscriptionId,
        status: input.status,
        current_period_end: input.currentPeriodEnd,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Unable to save subscription');
  }

  return toSubscription(data);
}

export async function updateSubscriptionByStripeSubscriptionId(
  client: SupabaseClient,
  stripeSubscriptionId: string,
  updates: { status: string; currentPeriodEnd?: string }
): Promise<Subscription | null> {
  const { data, error } = await client
    .from('subscriptions')
    .update({ status: updates.status, current_period_end: updates.currentPeriodEnd })
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toSubscription(data) : null;
}
