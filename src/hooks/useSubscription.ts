import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Subscription,
  UsageTracking,
  UsageStatus,
  PlanId,
  Plan,
  PLANS,
  getPlanById,
  getPlanLimit,
  isUnlimited,
  PlanLimits
} from "@/types/subscription";

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  usage: UsageTracking | null;
  currentPlan: Plan;
  isLoading: boolean;
  error: Error | null;

  // Usage status
  getUsageStatus: (resource: keyof PlanLimits) => UsageStatus;
  canUseResource: (resource: keyof PlanLimits, increment?: number) => boolean;
  isNearAnyLimit: () => boolean;
  isAtAnyLimit: () => boolean;

  // Plan management
  isPro: boolean;
  isBusiness: boolean;
  isFree: boolean;
  canUpgrade: boolean;

  // Actions
  refreshSubscription: () => void;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch subscription
  const {
    data: subscription,
    isLoading: loadingSubscription,
    error: subscriptionError
  } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data as Subscription | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch usage
  const {
    data: usage,
    isLoading: loadingUsage,
    error: usageError
  } = useQuery({
    queryKey: ["usage", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];

      const { data, error } = await supabase
        .from("usage_tracking")
        .select("*")
        .eq("user_id", user.id)
        .eq("period_start", periodStart)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      // Return default usage if not found
      if (!data) {
        return {
          id: "",
          user_id: user.id,
          period_start: periodStart,
          period_end: periodStart,
          payments_count: 0,
          contacts_count: 0,
          whatsapp_messages_count: 0,
          storage_used_bytes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UsageTracking;
      }

      return data as UsageTracking;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute
  });

  const planId = (subscription?.plan_id || "free") as PlanId;
  const currentPlan = getPlanById(planId);

  const getUsageStatus = (resource: keyof PlanLimits): UsageStatus => {
    const limit = getPlanLimit(planId, resource);
    const unlimited = isUnlimited(limit);

    let current = 0;
    if (usage) {
      switch (resource) {
        case "paymentsPerMonth":
          current = usage.payments_count;
          break;
        case "contacts":
          current = usage.contacts_count;
          break;
        case "whatsappMessages":
          current = usage.whatsapp_messages_count;
          break;
        case "storageGB":
          current = usage.storage_used_bytes / (1024 * 1024 * 1024);
          break;
        default:
          current = 0;
      }
    }

    const percentage = unlimited ? 0 : Math.round((current / limit) * 100);

    return {
      resource,
      current,
      limit,
      percentage,
      isUnlimited: unlimited,
      isNearLimit: !unlimited && percentage >= 80,
      isAtLimit: !unlimited && percentage >= 100,
    };
  };

  const canUseResource = (resource: keyof PlanLimits, increment = 1): boolean => {
    const status = getUsageStatus(resource);
    if (status.isUnlimited) return true;
    return (status.current + increment) <= status.limit;
  };

  const isNearAnyLimit = (): boolean => {
    const resources: (keyof PlanLimits)[] = [
      "paymentsPerMonth",
      "contacts",
      "whatsappMessages"
    ];
    return resources.some(r => getUsageStatus(r).isNearLimit);
  };

  const isAtAnyLimit = (): boolean => {
    const resources: (keyof PlanLimits)[] = [
      "paymentsPerMonth",
      "contacts",
      "whatsappMessages"
    ];
    return resources.some(r => getUsageStatus(r).isAtLimit);
  };

  const refreshSubscription = () => {
    queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["usage", user?.id] });
  };

  return {
    subscription,
    usage,
    currentPlan,
    isLoading: loadingSubscription || loadingUsage,
    error: subscriptionError || usageError,

    getUsageStatus,
    canUseResource,
    isNearAnyLimit,
    isAtAnyLimit,

    isPro: planId === "pro",
    isBusiness: planId === "business",
    isFree: planId === "free",
    canUpgrade: planId !== "business",

    refreshSubscription,
  };
}

// Hook para verificar límites antes de crear recursos
export function useCheckLimit() {
  const { canUseResource, currentPlan, isFree } = useSubscription();

  return {
    canCreatePayment: () => canUseResource("paymentsPerMonth"),
    canCreateContact: () => canUseResource("contacts"),
    canSendWhatsApp: () => canUseResource("whatsappMessages"),
    requiresUpgrade: (resource: keyof PlanLimits) => !canUseResource(resource),
    currentPlan,
    isFree,
  };
}

// Hook para incrementar uso
export function useIncrementUsage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const incrementPayments = async () => {
    if (!user?.id) return;
    await supabase.rpc("increment_usage", {
      p_user_id: user.id,
      p_resource: "payments",
      p_increment: 1
    });
    queryClient.invalidateQueries({ queryKey: ["usage", user.id] });
  };

  const incrementContacts = async () => {
    if (!user?.id) return;
    await supabase.rpc("increment_usage", {
      p_user_id: user.id,
      p_resource: "contacts",
      p_increment: 1
    });
    queryClient.invalidateQueries({ queryKey: ["usage", user.id] });
  };

  const incrementWhatsApp = async () => {
    if (!user?.id) return;
    await supabase.rpc("increment_usage", {
      p_user_id: user.id,
      p_resource: "whatsapp",
      p_increment: 1
    });
    queryClient.invalidateQueries({ queryKey: ["usage", user.id] });
  };

  return {
    incrementPayments,
    incrementContacts,
    incrementWhatsApp,
  };
}
