import { useState, useEffect } from "react";
import { X, AlertTriangle, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { PlanLimits } from "@/types/subscription";

const RESOURCE_LABELS: Record<keyof PlanLimits, string> = {
  paymentsPerMonth: "pagos este mes",
  contacts: "contactos",
  users: "usuarios",
  whatsappMessages: "mensajes WhatsApp",
  storageGB: "almacenamiento",
};

export function PlanLimitBanner() {
  const navigate = useNavigate();
  const { getUsageStatus, isNearAnyLimit, currentPlan, isFree } = useSubscription();
  const [dismissed, setDismissed] = useState(false);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  // Check localStorage for dismissed state
  useEffect(() => {
    const stored = localStorage.getItem("planBannerDismissed");
    if (stored) {
      const timestamp = parseInt(stored, 10);
      const hourAgo = Date.now() - 1000 * 60 * 60; // 1 hour
      if (timestamp > hourAgo) {
        setDismissed(true);
        setDismissedAt(timestamp);
      } else {
        localStorage.removeItem("planBannerDismissed");
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("planBannerDismissed", Date.now().toString());
  };

  // Find the resource that's closest to limit
  const resources: (keyof PlanLimits)[] = [
    "paymentsPerMonth",
    "contacts",
    "whatsappMessages",
  ];

  const usageStatuses = resources.map(r => getUsageStatus(r));
  const nearLimitStatus = usageStatuses.find(s => s.isNearLimit);
  const atLimitStatus = usageStatuses.find(s => s.isAtLimit);

  // Don't show if not near any limit or dismissed
  if ((!nearLimitStatus && !atLimitStatus) || dismissed) {
    return null;
  }

  const status = atLimitStatus || nearLimitStatus!;
  const isAtLimit = !!atLimitStatus;

  return (
    <div
      className={`relative px-4 py-3 mb-4 rounded-lg border ${
        isAtLimit
          ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
          : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
      }`}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <div
          className={`p-2 rounded-full ${
            isAtLimit
              ? "bg-red-100 dark:bg-red-900/50"
              : "bg-amber-100 dark:bg-amber-900/50"
          }`}
        >
          {isAtLimit ? (
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          ) : (
            <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4
            className={`font-medium ${
              isAtLimit
                ? "text-red-800 dark:text-red-200"
                : "text-amber-800 dark:text-amber-200"
            }`}
          >
            {isAtLimit
              ? `Has alcanzado el límite de ${RESOURCE_LABELS[status.resource]}`
              : `Estás cerca del límite de ${RESOURCE_LABELS[status.resource]}`}
          </h4>

          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {status.current} / {status.limit} {RESOURCE_LABELS[status.resource]}
              </span>
              <span
                className={`font-medium ${
                  isAtLimit
                    ? "text-red-600 dark:text-red-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {status.percentage}%
              </span>
            </div>

            <Progress
              value={Math.min(status.percentage, 100)}
              className={`h-2 ${
                isAtLimit
                  ? "[&>div]:bg-red-500"
                  : "[&>div]:bg-amber-500"
              }`}
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => navigate("/pricing")}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Zap className="h-4 w-4 mr-1" />
              Upgrade a {currentPlan.id === "free" ? "Pro" : "Business"}
            </Button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Plan actual: {currentPlan.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
