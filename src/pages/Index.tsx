import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Wallet,
  Clock,
  Plus,
  MessageSquare,
  Users,
  AlertTriangle,
  Calendar,
  ChevronRight,
  TrendingUp,
  ArrowRight,
  Wrench,
  FileText,
  Receipt
} from "lucide-react";
import { useDashboardStats, useWeeklyActivity } from "@/hooks/useDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { usePayments } from "@/hooks/usePayments";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const Index = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: payments, isLoading: paymentsLoading } = usePayments();
  const { data: weeklyData } = useWeeklyActivity();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasNoData = !paymentsLoading && (!payments || payments.length === 0);
  const userName = profile?.full_name?.split(' ')[0] || 'Usuario';

  const formatCurrency = (amount: number) => {
    const currency = profile?.currency || 'PEN';
    const symbol = currency === 'PEN' ? 'S/' : currency === 'USD' ? '$' : currency;
    return `${symbol} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  };

  const formatTrend = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(0)}%`;
  };

  // Get pending payments that need attention
  const pendingPayments = payments?.filter(p => p.status === 'pending') || [];
  const overduePayments = pendingPayments.filter(p => {
    if (!p.due_date) return false;
    return new Date(p.due_date) < new Date();
  });

  // Get recent transactions
  const recentPayments = payments?.slice(0, 5) || [];

  // Calculate weekly chart max for scaling
  const maxWeeklyValue = Math.max(...(weeklyData?.map(d => d.payments) || [1]));

  // Get avatar colors for payments
  const getAvatarColor = (index: number) => {
    const colors = ['pt-avatar-blue', 'pt-avatar-purple', 'pt-avatar-pink', 'pt-avatar-teal', 'pt-avatar-orange'];
    return colors[index % colors.length];
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const formatPaymentDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Hoy';
    if (isYesterday(date)) return 'Ayer';
    return format(date, 'dd MMM', { locale: es });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Greeting */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-white mb-1">
            Hola, {userName} <span className="animate-wave inline-block">👋</span>
          </h1>
          <p className="text-[var(--pt-text-secondary)] text-sm">
            Aquí está tu resumen financiero de hoy.
          </p>
        </div>

        {hasNoData ? (
          /* Empty State */
          <div className="pt-empty animate-scale-in">
            <div className="pt-empty-icon">
              <Wallet className="h-12 w-12 text-[var(--pt-primary)]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              ¡Bienvenido a PayTrack!
            </h2>
            <p className="text-[var(--pt-text-secondary)] max-w-sm mb-6">
              Registra tu primer pago o conecta WhatsApp para empezar a detectar pagos automáticamente.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                className="pt-btn-primary"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-5 w-5" />
                Registrar primer pago
              </button>
              <button
                className="pt-btn-secondary"
                onClick={() => navigate("/settings")}
              >
                <MessageSquare className="h-5 w-5 text-[#25D366]" />
                Conectar WhatsApp
              </button>
            </div>
            {/* Tip */}
            <div className="pt-tip mt-6 max-w-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--pt-yellow)]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">💡</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[var(--pt-text-muted)] uppercase tracking-wider">
                    Tip Pro
                  </p>
                  <p className="text-sm text-[var(--pt-text-secondary)] mt-1">
                    Conectar WhatsApp te permite recibir recordatorios automáticos de cobro.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards - Horizontal Scroll */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
              {/* Collected Card */}
              <div className="pt-stat-card min-w-[260px] animate-slide-up">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[var(--pt-primary)]/15 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-[var(--pt-primary)]" />
                    </div>
                    {(stats?.paymentsTrend || 0) !== 0 && (
                      <span className="text-xs font-bold text-[var(--pt-primary)]">
                        {formatTrend(stats?.paymentsTrend || 0)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--pt-text-secondary)] mb-1">Cobrado</p>
                  <p className="text-3xl font-bold text-white">
                    {isLoading ? '---' : formatCurrency(stats?.totalAmountThisMonth || 0)}
                  </p>
                </div>
              </div>

              {/* Pending Card */}
              <div className="pt-stat-card min-w-[180px] animate-slide-up" style={{ animationDelay: '50ms' }}>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[var(--pt-yellow)]/15 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[var(--pt-yellow)]" />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--pt-text-secondary)] mb-1">Pendiente</p>
                  <p className="text-3xl font-bold text-white">
                    {isLoading ? '---' : formatCurrency(stats?.pendingAmount || 0)}
                  </p>
                </div>
              </div>

              {/* Count Card */}
              <div className="pt-stat-card min-w-[140px] animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[var(--pt-blue)]/15 flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-[var(--pt-blue)]" />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--pt-text-secondary)] mb-1">Este mes</p>
                  <p className="text-3xl font-bold text-white">
                    {isLoading ? '---' : stats?.totalPaymentsThisMonth || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
              <p className="pt-section-header">ACCIONES RÁPIDAS</p>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                <button
                  className="pt-btn-secondary !px-4 !py-3 whitespace-nowrap"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="w-5 h-5" />
                  Nuevo Pago
                </button>
                <button
                  className="pt-btn-secondary !px-4 !py-3 whitespace-nowrap"
                  onClick={() => navigate("/settings")}
                >
                  <MessageSquare className="w-5 h-5 text-[#25D366]" />
                  WhatsApp
                </button>
                <button
                  className="pt-btn-secondary !px-4 !py-3 whitespace-nowrap"
                  onClick={() => navigate("/contacts")}
                >
                  <Users className="w-5 h-5" />
                  Contactos
                </button>
              </div>
            </div>

            {/* Weekly Activity */}
            <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Actividad Semanal</h3>
                <button
                  className="text-[var(--pt-primary)] text-sm font-semibold flex items-center gap-1"
                  onClick={() => navigate("/reports")}
                >
                  Ver Reporte
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="pt-card">
                <div className="flex items-end justify-between h-32 gap-2">
                  {(weeklyData || Array(7).fill({ day: '', payments: 0 })).map((day, index) => {
                    const height = maxWeeklyValue > 0 ? (day.payments / maxWeeklyValue) * 100 : 0;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex-1 flex items-end">
                          <div
                            className={cn(
                              "w-full rounded-t-lg transition-all duration-500",
                              day.payments > 0
                                ? "bg-gradient-to-t from-[var(--pt-primary)] to-[var(--pt-primary-light)]"
                                : "bg-[var(--pt-surface-elevated)]"
                            )}
                            style={{ height: `${Math.max(height, 8)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--pt-text-muted)]">
                          {day.day?.slice(0, 3) || ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][index]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Requires Attention */}
            {(overduePayments.length > 0 || pendingPayments.length > 0) && (
              <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
                <p className="pt-section-header">REQUIERE ATENCIÓN</p>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {overduePayments.length > 0 && (
                    <div className="pt-alert pt-alert-error min-w-[280px]">
                      <div className="w-10 h-10 rounded-full bg-[var(--pt-red)]/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-[var(--pt-red)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">Pago Vencido</p>
                        <p className="text-xs text-[var(--pt-text-secondary)] truncate">
                          {overduePayments[0]?.contact?.name || 'Unknown'} • {formatCurrency(overduePayments[0]?.amount || 0)}
                        </p>
                      </div>
                      <button
                        className="w-8 h-8 rounded-full bg-[var(--pt-red)] flex items-center justify-center flex-shrink-0"
                        onClick={() => navigate("/payments")}
                      >
                        <ArrowRight className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                  {pendingPayments.length > 1 && (
                    <div className="pt-alert pt-alert-warning min-w-[260px]">
                      <div className="w-10 h-10 rounded-full bg-[var(--pt-yellow)]/20 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-[var(--pt-yellow)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">Pagos Pendientes</p>
                        <p className="text-xs text-[var(--pt-text-secondary)]">
                          {pendingPayments.length} pagos necesitan revisión
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Transacciones Recientes</h3>
                <button
                  className="text-[var(--pt-primary)] text-sm font-semibold flex items-center gap-1"
                  onClick={() => navigate("/payments")}
                >
                  Ver Todo
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {recentPayments.map((payment, index) => (
                  <div
                    key={payment.id}
                    className="pt-list-item cursor-pointer"
                    onClick={() => navigate("/payments")}
                  >
                    {/* Icon/Avatar */}
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold",
                      "bg-[var(--pt-surface-elevated)]"
                    )}>
                      {payment.method === 'transfer' || payment.method === 'transferencia' ? (
                        <Receipt className="w-5 h-5 text-[var(--pt-text-secondary)]" />
                      ) : payment.method === 'cash' || payment.method === 'efectivo' ? (
                        <span className="text-lg">💵</span>
                      ) : (
                        <span className="text-lg">
                          {['🎨', '💻', '📄', '🛠️', '📦'][index % 5]}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white truncate">
                        {payment.notes?.split(' ').slice(0, 2).join(' ') || payment.contact?.name || 'Payment'}
                      </p>
                      <p className="text-xs text-[var(--pt-text-secondary)] truncate">
                        {payment.contact?.name || 'Unknown'} • {formatPaymentDate(payment.created_at)}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className={cn(
                        "font-bold text-sm",
                        payment.status === 'confirmed' ? "text-[var(--pt-primary)]" : "text-white"
                      )}>
                        {payment.status === 'confirmed' ? '+' : ''}{formatCurrency(payment.amount)}
                      </p>
                      {payment.status === 'pending' && (
                        <p className="text-[10px] text-[var(--pt-yellow)]">Pendiente</p>
                      )}
                    </div>
                  </div>
                ))}

                {recentPayments.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-[var(--pt-text-secondary)]">No hay transacciones recientes</p>
                  </div>
                )}
              </div>
            </div>
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
