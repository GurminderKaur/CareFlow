'use client';

import { useState } from 'react';
import useSWR from 'swr';
import type { SubscriptionResponse, CheckoutSessionResponse } from '@/types/subscription';
import type { ApiErrorResponse } from '@/types/api';

async function fetchSubscription(url: string): Promise<SubscriptionResponse['subscription']> {
  const response = await fetch(url);
  const body = (await response.json()) as SubscriptionResponse | ApiErrorResponse;

  if (!response.ok) {
    throw new Error((body as ApiErrorResponse).error);
  }

  return (body as SubscriptionResponse).subscription;
}

export function BillingCard() {
  const { data: subscription, error, isLoading } = useSWR('/api/subscriptions', fetchSubscription);
  const [redirecting, setRedirecting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  async function handleSubscribe() {
    setCheckoutError('');
    setRedirecting(true);

    try {
      const response = await fetch('/api/stripe/checkout', { method: 'POST' });
      const body = (await response.json()) as CheckoutSessionResponse | ApiErrorResponse;

      if (!response.ok) {
        throw new Error((body as ApiErrorResponse).error);
      }

      window.location.href = (body as CheckoutSessionResponse).url;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Unable to start checkout');
      setRedirecting(false);
    }
  }

  const isActive = subscription?.status === 'active';

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Subscription</h2>

      {isLoading ? <p className="mt-2 text-sm text-slate-500">Loading subscription status…</p> : null}

      {error ? <p className="mt-2 text-sm text-red-600">{error.message}</p> : null}

      {!isLoading && !error ? (
        isActive ? (
          <div className="mt-2">
            <p className="text-sm text-emerald-600">Subscription active.</p>
            {subscription?.currentPeriodEnd ? (
              <p className="mt-1 text-sm text-slate-500">
                Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-sm text-slate-500">No active subscription.</p>
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={redirecting}
              className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {redirecting ? 'Redirecting…' : 'Subscribe'}
            </button>
            {checkoutError ? <p className="mt-2 text-sm text-red-600">{checkoutError}</p> : null}
          </div>
        )
      ) : null}
    </section>
  );
}
