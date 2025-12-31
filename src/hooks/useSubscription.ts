// Simplified subscription hook - tables don't exist yet
import { useAuth } from "@/contexts/AuthContext";

// Types
export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  created_at: string;
}

export interface UsageTracking {
  payments_count: number;
  contacts_count: number;
  whatsapp_messages_count: number;
  storage_used_bytes: number;
}

export interface UsageStatus {
  resource: string;
  current: number;
  limit: number;
  percentage: number;
  isUnlimited: boolean;
  isNearLimit: boolean;
  isAtLimit: boolean;
}

// Default free plan limits
const FREE_LIMITS = {
  paymentsPerMonth: 50,
  contacts: 25,
  whatsappMessages: 100,
  storageGB: 1,
};

export function useSubscription() {
  const { user } = useAuth();

  // Default to free plan since tables don't exist
  const subscription: Subscription | null = user ? {
    id: 'default',
    user_id: user.id,
    plan_id: 'free',
    status: 'active',
    created_at: new Date().toISOString(),
  } : null;

  const usage: UsageTracking = {
    payments_count: 0,
    contacts_count: 0,
    whatsapp_messages_count: 0,
    storage_used_bytes: 0,
  };

  const getUsageStatus = (resource: keyof typeof FREE_LIMITS): UsageStatus => {
    const limit = FREE_LIMITS[resource] || 100;
    return {
      resource,
      current: 0,
      limit,
      percentage: 0,
      isUnlimited: false,
      isNearLimit: false,
      isAtLimit: false,
    };
  };

  const canUseResource = () => true;
  const isNearAnyLimit = () => false;
  const isAtAnyLimit = () => false;
  const refreshSubscription = () => {};

  return {
    subscription,
    usage,
    currentPlan: { id: 'free', name: 'Free', price: 0 },
    isLoading: false,
    error: null,
    getUsageStatus,
    canUseResource,
    isNearAnyLimit,
    isAtAnyLimit,
    isPro: false,
    isBusiness: false,
    isFree: true,
    canUpgrade: true,
    refreshSubscription,
  };
}

// Hook para verificar límites
export function useCheckLimit() {
  return {
    canCreatePayment: () => true,
    canCreateContact: () => true,
    canSendWhatsApp: () => true,
    requiresUpgrade: () => false,
    currentPlan: { id: 'free', name: 'Free', price: 0 },
    isFree: true,
  };
}

// Hook para incrementar uso (no-op since tables don't exist)
export function useIncrementUsage() {
  return {
    incrementPayments: async () => {},
    incrementContacts: async () => {},
    incrementWhatsApp: async () => {},
  };
}
