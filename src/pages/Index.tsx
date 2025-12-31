import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PendingPayments } from "@/components/dashboard/PendingPayments";
import { CreditCard, DollarSign, Clock, CheckCircle2, Plus, Wallet } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { usePayments } from "@/hooks/usePayments";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: payments, isLoading: paymentsLoading } = usePayments();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasNoData = !paymentsLoading && (!payments || payments.length === 0);

  const formatCurrency = (amount: number) => {
    const currency = profile?.currency || 'PEN';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTrend = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const statsData = [
    {
      title: "Pagos Este Mes",
      value: isLoading ? "---" : formatCurrency(stats?.totalAmountThisMonth || 0),
      change: isLoading ? "---" : formatTrend(stats?.paymentsTrend || 0),
      changeType: (stats?.paymentsTrend || 0) >= 0 ? "positive" as const : "negative" as const,
      icon: DollarSign,
    },
    {
      title: "Pagos Confirmados",
      value: isLoading ? "---" : String(stats?.confirmedPayments || 0),
      change: isLoading ? "---" : formatTrend(stats?.confirmedTrend || 0),
      changeType: (stats?.confirmedTrend || 0) >= 0 ? "positive" as const : "negative" as const,
      icon: CheckCircle2,
    },
    {
      title: "Pagos Pendientes",
      value: isLoading ? "---" : String(stats?.pendingPayments || 0),
      change: isLoading ? "---" : formatTrend(stats?.pendingTrend || 0),
      changeType: (stats?.pendingTrend || 0) <= 0 ? "positive" as const : "negative" as const,
      icon: Clock,
    },
    {
      title: "Tasa de Detección",
      value: isLoading ? "---" : `${(stats?.detectionRate || 0).toFixed(1)}%`,
      change: isLoading ? "---" : formatTrend(stats?.detectionTrend || 0),
      changeType: (stats?.detectionTrend || 0) >= 0 ? "positive" as const : "negative" as const,
      icon: CreditCard,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-stitch-text">Dashboard</h1>
            <p className="text-stitch-muted">
              Bienvenido de vuelta. Aquí está el resumen de hoy.
            </p>
          </div>
          <QuickActions />
        </div>

        {hasNoData ? (
          /* Empty State - Stitch Design */
          <div className="stitch-empty animate-scale-in">
            <div className="stitch-empty-icon">
              <Wallet className="h-10 w-10 text-stitch-primary" />
            </div>
            <h2 className="text-xl font-semibold text-stitch-text mb-2">
              ¡Bienvenido a PayTrack!
            </h2>
            <p className="text-stitch-muted max-w-md mb-6">
              Registra tu primer pago o conecta WhatsApp para empezar a detectar pagos automáticamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <Button
                className="flex-1 gradient-primary text-white rounded-xl shadow-button"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar pago
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-stitch-surface border-stitch text-stitch-text hover:bg-stitch-surface-elevated rounded-xl"
                onClick={() => navigate("/settings")}
              >
                Conectar WhatsApp
              </Button>
            </div>
            <p className="text-sm text-stitch-muted mt-4">
              También puedes agregar contactos primero en la sección Contactos.
            </p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {statsData.map((stat, index) => (
                <StatsCard key={stat.title} {...stat} delay={index * 50} />
              ))}
            </div>

            {/* Charts and Activity */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ActivityChart />
              </div>
              <div>
                <PendingPayments />
              </div>
            </div>

            {/* Recent Transactions */}
            <RecentTransactions />
          </>
        )}
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payment={null}
      />
    </DashboardLayout>
  );
};

export default Index;
