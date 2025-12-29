import { Check, Zap, Building, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plan,
  PlanId,
  BillingCycle,
  calculateYearlySavings,
  calculateYearlySavingsPercentage,
} from "@/types/subscription";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  plan: Plan;
  billingCycle: BillingCycle;
  currentPlan?: PlanId | null;
  onSelect: (plan: Plan) => void;
  isLoggedIn?: boolean;
}

const PlanIcon = ({ planId, className }: { planId: PlanId; className?: string }) => {
  switch (planId) {
    case "pro":
      return <Zap className={cn("h-6 w-6", className)} />;
    case "business":
      return <Building className={cn("h-6 w-6", className)} />;
    default:
      return <Sparkles className={cn("h-6 w-6", className)} />;
  }
};

export function PricingCard({
  plan,
  billingCycle,
  currentPlan,
  onSelect,
  isLoggedIn = false,
}: PricingCardProps) {
  const isCurrentPlan = currentPlan === plan.id;
  const price = billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;
  const monthlyEquivalent = billingCycle === "yearly" ? plan.price.yearly / 12 : plan.price.monthly;
  const yearlySavings = calculateYearlySavings(plan);
  const savingsPercentage = calculateYearlySavingsPercentage(plan);

  const getButtonText = () => {
    if (isCurrentPlan) return "Plan actual";
    if (!isLoggedIn && plan.id === "free") return "Comenzar gratis";
    if (!isLoggedIn) return "Comenzar prueba gratis";
    if (plan.id === "business") return "Contactar ventas";
    return "Upgrade";
  };

  const getButtonVariant = () => {
    if (isCurrentPlan) return "outline" as const;
    if (plan.highlighted) return "default" as const;
    return "outline" as const;
  };

  return (
    <div
      className={cn(
        "relative flex flex-col p-6 bg-white dark:bg-gray-900 rounded-2xl border-2 transition-all duration-300",
        plan.highlighted
          ? "border-emerald-500 shadow-xl shadow-emerald-500/10 scale-105 z-10"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      )}
    >
      {/* Popular Badge */}
      {plan.highlighted && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 hover:bg-emerald-500 text-white px-4 py-1">
          Más popular
        </Badge>
      )}

      {/* Plan Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            "p-2 rounded-lg",
            plan.id === "free" && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
            plan.id === "pro" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
            plan.id === "business" && "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"
          )}
        >
          <PlanIcon planId={plan.id} />
        </div>
        <div>
          <h3 className="text-xl font-bold">{plan.name}</h3>
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">
            ${monthlyEquivalent.toFixed(2)}
          </span>
          <span className="text-gray-500 dark:text-gray-400">/mes</span>
        </div>
        {billingCycle === "yearly" && plan.price.monthly > 0 && (
          <div className="mt-1 space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Facturado ${price.toFixed(2)}/año
            </p>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
              Ahorra ${yearlySavings} ({savingsPercentage}%)
            </Badge>
          </div>
        )}
        {plan.price.monthly === 0 && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gratis para siempre
          </p>
        )}
      </div>

      {/* CTA Button */}
      <Button
        onClick={() => onSelect(plan)}
        variant={getButtonVariant()}
        disabled={isCurrentPlan}
        className={cn(
          "w-full mb-6",
          plan.highlighted && !isCurrentPlan && "bg-emerald-600 hover:bg-emerald-700"
        )}
      >
        {getButtonText()}
      </Button>

      {/* Features List */}
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
          {plan.id === "free" ? "Incluye:" : `Todo de ${plan.id === "pro" ? "Free" : "Pro"}, más:`}
        </p>
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
