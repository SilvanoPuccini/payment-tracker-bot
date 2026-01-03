import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!key) {
      console.warn('Stripe public key not configured');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

export interface CheckoutSessionParams {
  priceId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export async function createCheckoutSession(
  params: CheckoutSessionParams
): Promise<CheckoutSessionResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      priceId: params.priceId,
      planId: params.planId,
      billingCycle: params.billingCycle,
      successUrl: params.successUrl || `${window.location.origin}/checkout?success=true`,
      cancelUrl: params.cancelUrl || `${window.location.origin}/pricing?cancelled=true`,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to create checkout session');
  }

  return data as CheckoutSessionResponse;
}

export async function createPortalSession(): Promise<{ url: string }> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('create-portal-session', {
    body: {
      returnUrl: `${window.location.origin}/settings`,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to create portal session');
  }

  return data as { url: string };
}

export async function redirectToCheckout(params: CheckoutSessionParams): Promise<void> {
  const stripe = await getStripe();
  if (!stripe) {
    throw new Error('Stripe not initialized');
  }

  const { sessionId, url } = await createCheckoutSession(params);

  // If we have a URL, redirect directly (Stripe Checkout hosted page)
  if (url) {
    window.location.href = url;
    return;
  }

  // Otherwise use Stripe.js redirect
  const { error } = await stripe.redirectToCheckout({ sessionId });

  if (error) {
    throw new Error(error.message || 'Failed to redirect to checkout');
  }
}

export async function redirectToPortal(): Promise<void> {
  const { url } = await createPortalSession();
  window.location.href = url;
}

// Price IDs for Stripe products
// These should be replaced with actual Stripe price IDs when configured
export const STRIPE_PRICE_IDS = {
  pro: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    yearly: import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  },
  business: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_BUSINESS_MONTHLY || 'price_business_monthly',
    yearly: import.meta.env.VITE_STRIPE_PRICE_BUSINESS_YEARLY || 'price_business_yearly',
  },
};

export function getPriceId(planId: 'pro' | 'business', billingCycle: 'monthly' | 'yearly'): string {
  return STRIPE_PRICE_IDS[planId][billingCycle];
}
