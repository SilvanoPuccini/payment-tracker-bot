import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSubscription, currentPlan } = useSubscription();

  const success = searchParams.get("success") === "true";
  const cancelled = searchParams.get("cancelled") === "true";
  const sessionId = searchParams.get("session_id");

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (success) {
      // Refresh subscription data
      refreshSubscription();

      // Countdown and redirect
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [success, navigate, refreshSubscription]);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white dark:from-gray-950 dark:to-gray-900 p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Pago exitoso!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Tu suscripción ha sido activada correctamente.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-emerald-500" />
              <span className="font-semibold text-lg">Plan {currentPlan.name}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ahora tienes acceso a todas las funcionalidades de tu plan.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Ir al Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirigiendo en {countdown} segundos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-10 w-10 text-gray-500 dark:text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Pago cancelado
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              No se realizó ningún cargo. Puedes intentarlo de nuevo cuando quieras.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate("/pricing")}
              className="w-full"
              variant="outline"
            >
              Ver planes
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              className="w-full"
            >
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
        <p className="text-gray-600 dark:text-gray-400">Procesando...</p>
      </div>
    </div>
  );
}
