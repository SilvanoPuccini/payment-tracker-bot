import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PricingCard } from "@/components/pricing/PricingCard";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";
import { PLANS, Plan, BillingCycle, PlanId } from "@/types/subscription";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

export default function Pricing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { currentPlan } = useSubscription();

  // Get selected plan from navigation state if available
  const initialPlan = (location.state as { selectedPlan?: PlanId })?.selectedPlan;
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const handlePlanSelect = (plan: Plan) => {
    if (!user) {
      // Redirect to signup/login
      navigate("/register", { state: { selectedPlan: plan.id, billingCycle } });
      return;
    }

    if (plan.id === currentPlan.id) {
      toast.info("Ya tienes este plan activo");
      return;
    }

    if (plan.id === "business") {
      // Open contact form or email
      window.open("mailto:ventas@paytrack.app?subject=Plan Business PayTrack", "_blank");
      return;
    }

    if (plan.id === "free") {
      // Downgrade confirmation
      toast.info("Para bajar de plan, ve a Configuración > Suscripción");
      return;
    }

    // Navigate to checkout
    navigate("/checkout", {
      state: {
        plan: plan.id,
        billingCycle,
        priceId: plan.stripePriceIds?.[billingCycle],
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-xl font-bold text-emerald-600"
            >
              <Zap className="h-6 w-6" />
              PayTrack
            </button>
            <div className="flex items-center gap-4">
              {user ? (
                <Button onClick={() => navigate("/")} variant="outline">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button onClick={() => navigate("/login")} variant="ghost">
                    Iniciar sesión
                  </Button>
                  <Button onClick={() => navigate("/register")} className="bg-emerald-600 hover:bg-emerald-700">
                    Comenzar gratis
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Planes simples,{" "}
            <span className="text-emerald-600">precios transparentes</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tu negocio. Comienza gratis y
            escala cuando lo necesites.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <Label
              htmlFor="billing-toggle"
              className={billingCycle === "monthly" ? "font-semibold" : "text-gray-500"}
            >
              Mensual
            </Label>
            <Switch
              id="billing-toggle"
              checked={billingCycle === "yearly"}
              onCheckedChange={(checked) =>
                setBillingCycle(checked ? "yearly" : "monthly")
              }
            />
            <Label
              htmlFor="billing-toggle"
              className={billingCycle === "yearly" ? "font-semibold" : "text-gray-500"}
            >
              Anual
              <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                Ahorra 17%
              </span>
            </Label>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 items-start">
            {PLANS.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                billingCycle={billingCycle}
                currentPlan={user ? currentPlan.id : null}
                onSelect={handlePlanSelect}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison (simplified) */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Compara los planes
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-4 font-medium">Característica</th>
                  <th className="text-center p-4 font-medium">Free</th>
                  <th className="text-center p-4 font-medium text-emerald-600">Pro</th>
                  <th className="text-center p-4 font-medium">Business</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="p-4">Pagos por mes</td>
                  <td className="p-4 text-center">50</td>
                  <td className="p-4 text-center">500</td>
                  <td className="p-4 text-center">Ilimitados</td>
                </tr>
                <tr>
                  <td className="p-4">Contactos</td>
                  <td className="p-4 text-center">20</td>
                  <td className="p-4 text-center">200</td>
                  <td className="p-4 text-center">Ilimitados</td>
                </tr>
                <tr>
                  <td className="p-4">Usuarios</td>
                  <td className="p-4 text-center">1</td>
                  <td className="p-4 text-center">3</td>
                  <td className="p-4 text-center">Ilimitados</td>
                </tr>
                <tr>
                  <td className="p-4">Mensajes WhatsApp/mes</td>
                  <td className="p-4 text-center">100</td>
                  <td className="p-4 text-center">1,000</td>
                  <td className="p-4 text-center">Ilimitados</td>
                </tr>
                <tr>
                  <td className="p-4">Integración WhatsApp</td>
                  <td className="p-4 text-center">-</td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4">Detección IA</td>
                  <td className="p-4 text-center">-</td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4">Recordatorios automáticos</td>
                  <td className="p-4 text-center">-</td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4">Reportes PDF</td>
                  <td className="p-4 text-center">-</td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4">API Access</td>
                  <td className="p-4 text-center">-</td>
                  <td className="p-4 text-center">-</td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4">Soporte</td>
                  <td className="p-4 text-center">Email</td>
                  <td className="p-4 text-center">Prioritario</td>
                  <td className="p-4 text-center">Dedicado</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <PricingFAQ />
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-emerald-600 dark:bg-emerald-700">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para simplificar tus cobros?
          </h2>
          <p className="text-lg text-emerald-100 mb-8">
            Únete a miles de negocios que ya confían en PayTrack.
            Comienza gratis hoy.
          </p>
          <Button
            size="lg"
            onClick={() => navigate(user ? "/" : "/register")}
            className="bg-white text-emerald-600 hover:bg-emerald-50"
          >
            {user ? "Ir al Dashboard" : "Comenzar gratis"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} PayTrack. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
