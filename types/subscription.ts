export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: string;
  currentPeriodEnd?: string;
  createdAt: string;
  updatedAt: string;
}
