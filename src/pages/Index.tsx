import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PendingPayments } from "@/components/dashboard/PendingPayments";
import { useDashboardStats } from "@/hooks/useSupabaseData";
import { DashboardFilterProvider, useDashboardFilters } from "@/contexts/DashboardFilterContext";
import { CreditCard, DollarSign, Clock, CheckCircle2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

function DashboardContent() {
  const { filters } = useDashboardFilters();
  const { data: stats, isLoading } = useDashboardStats(filters);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `S/ ${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `S/ ${(amount / 1000).toFixed(1)}K`;
    }
    return `S/ ${amount.toFixed(0)}`;
  };

  const formatDateRange = () => {
    try {
      const start = format(parseISO(filters.startDate), "d MMM", { locale: es });
      const end = format(parseISO(filters.endDate), "d MMM yyyy", { locale: es });
      return `${start} - ${end}`;
    } catch {
      return "Este mes";
    }
  };

  const statsData = [
    {
      title: "Total Pagos",
      value: isLoading ? "..." : formatCurrency(stats?.totalPaymentsAmount || 0),
      change: "+12.5%",
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      title: "Pagos Confirmados",
      value: isLoading ? "..." : String(stats?.confirmedPaymentsCount || 0),
      change: "+8.2%",
      changeType: "positive" as const,
      icon: CheckCircle2,
    },
    {
      title: "Pagos Pendientes",
      value: isLoading ? "..." : String(stats?.pendingPaymentsCount || 0),
      change: stats?.pendingPaymentsCount === 0 ? "0" : `-${stats?.pendingPaymentsCount}`,
      changeType: "positive" as const,
      icon: Clock,
    },
    {
      title: "Tasa de Detección",
      value: isLoading ? "..." : `${stats?.detectionRate || 0}%`,
      change: "+2.3%",
      changeType: "positive" as const,
      icon: CreditCard,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <Badge variant="outline" className="gap-1 font-normal">
                <Calendar className="h-3 w-3" />
                {formatDateRange()}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Bienvenido de vuelta. Aquí está el resumen del período seleccionado.
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
}

const Index = () => {
  return (
    <DashboardFilterProvider>
      <DashboardContent />
    </DashboardFilterProvider>
  );
};

export default Index;
