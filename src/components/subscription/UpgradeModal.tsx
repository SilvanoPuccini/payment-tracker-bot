import { Check, Zap, X, Crown, Building } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  PLANS,
  Plan,
  PlanId,
  PlanLimits,
  calculateYearlySavingsPercentage,
} from "@/types/subscription";
import { useSubscription } from "@/hooks/useSubscription";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  limitReached: keyof PlanLimits;
  currentUsage?: number;
  limit?: number;
}

const RESOURCE_MESSAGES: Record<keyof PlanLimits, string> = {
  paymentsPerMonth: "Has alcanzado el límite de pagos mensuales",
  contacts: "Has alcanzado el límite de contactos",
  users: "Has alcanzado el límite de usuarios",
  whatsappMessages: "Has alcanzado el límite de mensajes WhatsApp",
  storageGB: "Has alcanzado el límite de almacenamiento",
};

const RESOURCE_UPGRADE_BENEFITS: Record<keyof PlanLimits, { pro: string; business: string }> = {
  paymentsPerMonth: {
    pro: "500 pagos/mes",
    business: "Pagos ilimitados",
  },
  contacts: {
    pro: "200 contactos",
    business: "Contactos ilimitados",
  },
  users: {
    pro: "3 usuarios",
    business: "Usuarios ilimitados",
  },
  whatsappMessages: {
    pro: "1,000 mensajes/mes",
    business: "Mensajes ilimitados",
  },
  storageGB: {
    pro: "5 GB",
    business: "50 GB",
  },
};

const PlanIcon = ({ planId }: { planId: PlanId }) => {
  switch (planId) {
    case "pro":
      return <Zap className="h-5 w-5" />;
    case "business":
      return <Building className="h-5 w-5" />;
    default:
      return null;
  }
};

export function UpgradeModal({
  open,
  onClose,
  limitReached,
  currentUsage,
  limit,
}: UpgradeModalProps) {
  const navigate = useNavigate();
  const { currentPlan } = useSubscription();

  const upgradePlans = PLANS.filter(p => {
    if (currentPlan.id === "free") return p.id === "pro" || p.id === "business";
    if (currentPlan.id === "pro") return p.id === "business";
    return false;
  });

  const handleUpgrade = (plan: Plan) => {
    onClose();
    navigate("/pricing", { state: { selectedPlan: plan.id } });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center mb-4">
            <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-center">
            {RESOURCE_MESSAGES[limitReached]}
          </DialogTitle>
          <DialogDescription className="text-center">
            {currentUsage !== undefined && limit !== undefined && (
              <span className="block mt-1 text-sm">
                Uso actual: {currentUsage} / {limit}
              </span>
            )}
            <span className="block mt-2">
              Actualiza tu plan para continuar sin interrupciones
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {upgradePlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-emerald-500 ${
                plan.highlighted
                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              onClick={() => handleUpgrade(plan)}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-500 text-white text-xs font-medium rounded-full">
                  Más popular
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      plan.id === "pro"
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
                        : "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"
                    }`}
                  >
                    <PlanIcon planId={plan.id} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{plan.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {RESOURCE_UPGRADE_BENEFITS[limitReached][plan.id as "pro" | "business"]}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-lg">
                    ${plan.price.monthly}
                    <span className="text-sm font-normal text-gray-500">/mes</span>
                  </div>
                  {calculateYearlySavingsPercentage(plan) > 0 && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400">
                      Ahorra {calculateYearlySavingsPercentage(plan)}% anual
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {plan.features.slice(0, 4).map((feature, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm">
                    <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-300 truncate">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                className="w-full mt-4"
                variant={plan.highlighted ? "default" : "outline"}
              >
                Actualizar a {plan.name}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Continuar con plan {currentPlan.name}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
