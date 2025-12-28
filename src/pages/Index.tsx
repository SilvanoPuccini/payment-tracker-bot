import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PendingPayments } from "@/components/dashboard/PendingPayments";
import { CreditCard, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const { profile } = useAuth();

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Bienvenido de vuelta. Aquí está el resumen de hoy.
            </p>
          </div>
          <QuickActions />
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>
    </DashboardLayout>
  );
};

export default Index;
