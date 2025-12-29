import { useState, useCallback } from "react";
import { useSubscription, useIncrementUsage } from "./useSubscription";
import { PlanLimits } from "@/types/subscription";

interface UseLimitedActionsReturn {
  // State
  showUpgradeModal: boolean;
  limitReached: keyof PlanLimits | null;
  currentUsage: number;
  limit: number;

  // Actions
  checkAndExecute: <T>(
    resource: keyof PlanLimits,
    action: () => Promise<T>
  ) => Promise<T | null>;
  closeUpgradeModal: () => void;

  // Helpers
  canCreate: (resource: keyof PlanLimits) => boolean;
}

export function useLimitedActions(): UseLimitedActionsReturn {
  const { getUsageStatus, canUseResource } = useSubscription();
  const { incrementPayments, incrementContacts, incrementWhatsApp } = useIncrementUsage();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [limitReached, setLimitReached] = useState<keyof PlanLimits | null>(null);
  const [currentUsage, setCurrentUsage] = useState(0);
  const [limit, setLimit] = useState(0);

  const closeUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false);
    setLimitReached(null);
  }, []);

  const checkAndExecute = useCallback(
    async <T>(
      resource: keyof PlanLimits,
      action: () => Promise<T>
    ): Promise<T | null> => {
      // Check if can use resource
      if (!canUseResource(resource)) {
        const status = getUsageStatus(resource);
        setLimitReached(resource);
        setCurrentUsage(status.current);
        setLimit(status.limit);
        setShowUpgradeModal(true);
        return null;
      }

      // Execute action
      const result = await action();

      // Increment usage after successful action
      if (result !== null && result !== undefined) {
        switch (resource) {
          case "paymentsPerMonth":
            await incrementPayments();
            break;
          case "contacts":
            await incrementContacts();
            break;
          case "whatsappMessages":
            await incrementWhatsApp();
            break;
        }
      }

      return result;
    },
    [canUseResource, getUsageStatus, incrementPayments, incrementContacts, incrementWhatsApp]
  );

  const canCreate = useCallback(
    (resource: keyof PlanLimits) => canUseResource(resource),
    [canUseResource]
  );

  return {
    showUpgradeModal,
    limitReached,
    currentUsage,
    limit,
    checkAndExecute,
    closeUpgradeModal,
    canCreate,
  };
}

// Simpler hook for just checking limits without the modal state
export function useCanCreate() {
  const { canUseResource, getUsageStatus, currentPlan } = useSubscription();

  return {
    canCreatePayment: () => canUseResource("paymentsPerMonth"),
    canCreateContact: () => canUseResource("contacts"),
    canSendWhatsApp: () => canUseResource("whatsappMessages"),
    getPaymentUsage: () => getUsageStatus("paymentsPerMonth"),
    getContactUsage: () => getUsageStatus("contacts"),
    getWhatsAppUsage: () => getUsageStatus("whatsappMessages"),
    currentPlan,
  };
}
