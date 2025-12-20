import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PendingPayments } from "@/components/dashboard/PendingPayments";
import { CreditCard, DollarSign, Clock, CheckCircle2 } from "lucide-react";

const stats = [
  {
    title: "Pagos Este Mes",
    value: "$2,845,600",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: DollarSign,
  },
  {
    title: "Pagos Confirmados",
    value: "156",
    change: "+8.2%",
    changeType: "positive" as const,
    icon: CheckCircle2,
  },
  {
    title: "Pagos Pendientes",
    value: "23",
    change: "-3.1%",
    changeType: "positive" as const,
    icon: Clock,
  },
  {
    title: "Tasa de Detección",
    value: "94.2%",
    change: "+2.3%",
    changeType: "positive" as const,
    icon: CreditCard,
  },
];

const Index = () => {
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
          {stats.map((stat, index) => (
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
