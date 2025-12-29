export type PlanId = 'free' | 'pro' | 'business';
export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing';

export interface PlanLimits {
  paymentsPerMonth: number;      // -1 = unlimited
  contacts: number;
  users: number;
  whatsappMessages: number;
  storageGB: number;
}

export interface Plan {
  id: PlanId;
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  currency: string;
  limits: PlanLimits;
  features: string[];
  highlighted?: boolean;
  stripePriceIds?: {
    monthly: string;
    yearly: string;
  };
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: PlanId;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  payments_count: number;
  contacts_count: number;
  whatsapp_messages_count: number;
  storage_used_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface UsageStatus {
  resource: keyof PlanLimits;
  current: number;
  limit: number;
  percentage: number;
  isUnlimited: boolean;
  isNearLimit: boolean;  // 80%+
  isAtLimit: boolean;    // 100%
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    currency: 'USD',
    limits: {
      paymentsPerMonth: 50,
      contacts: 20,
      users: 1,
      whatsappMessages: 100,
      storageGB: 0.5
    },
    features: [
      'Dashboard básico',
      'Registro manual de pagos',
      'Exportación CSV',
      'Soporte por email',
      'Hasta 50 pagos/mes',
      'Hasta 20 contactos'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 9.99, yearly: 99.99 },
    currency: 'USD',
    limits: {
      paymentsPerMonth: 500,
      contacts: 200,
      users: 3,
      whatsappMessages: 1000,
      storageGB: 5
    },
    features: [
      'Todo de Free',
      'Integración WhatsApp',
      'Detección IA de pagos',
      'Recordatorios automáticos',
      'Reportes PDF',
      'Multi-moneda',
      'Soporte prioritario',
      'Hasta 500 pagos/mes',
      'Hasta 200 contactos'
    ],
    highlighted: true,
    stripePriceIds: {
      monthly: 'price_pro_monthly',
      yearly: 'price_pro_yearly'
    }
  },
  {
    id: 'business',
    name: 'Business',
    price: { monthly: 29.99, yearly: 299.99 },
    currency: 'USD',
    limits: {
      paymentsPerMonth: -1,
      contacts: -1,
      users: -1,
      whatsappMessages: -1,
      storageGB: 50
    },
    features: [
      'Todo de Pro',
      'Usuarios ilimitados',
      'Pagos ilimitados',
      'Contactos ilimitados',
      'API Access',
      'Webhooks personalizados',
      'White-label (próximamente)',
      'Soporte dedicado',
      'SLA 99.9%'
    ],
    stripePriceIds: {
      monthly: 'price_business_monthly',
      yearly: 'price_business_yearly'
    }
  }
];

// Helper functions
export function getPlanById(planId: PlanId): Plan {
  return PLANS.find(p => p.id === planId) || PLANS[0];
}

export function getPlanLimit(planId: PlanId, resource: keyof PlanLimits): number {
  const plan = getPlanById(planId);
  return plan.limits[resource];
}

export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

export function calculateYearlySavings(plan: Plan): number {
  const monthlyTotal = plan.price.monthly * 12;
  const yearlySavings = monthlyTotal - plan.price.yearly;
  return Math.round(yearlySavings);
}

export function calculateYearlySavingsPercentage(plan: Plan): number {
  if (plan.price.monthly === 0) return 0;
  const monthlyTotal = plan.price.monthly * 12;
  return Math.round(((monthlyTotal - plan.price.yearly) / monthlyTotal) * 100);
}
