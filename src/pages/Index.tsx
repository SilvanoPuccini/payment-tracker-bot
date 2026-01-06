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
  Receipt,
  Check,
  Building2,
  X,
  Send,
} from "lucide-react";
import { useDashboardStats, useWeeklyActivity } from "@/hooks/useDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { usePayments, PaymentWithContact } from "@/hooks/usePayments";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { PaymentDetailSheet } from "@/components/payments/PaymentDetailSheet";
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
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailPayment, setDetailPayment] = useState<PaymentWithContact | null>(null);

  const hasNoData = !paymentsLoading && (!payments || payments.length === 0);
  const userName = profile?.full_name?.split(' ')[0] || 'Usuario';
  const userCurrency = profile?.currency || 'PEN';

  // Currency helpers
  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'PEN': 'S/',
      'USD': '$',
      'ARS': '$',
      'EUR': '€',
      'BRL': 'R$',
      'CLP': '$',
      'COP': '$',
      'MXN': '$',
    };
    return symbols[currency] || '$';
  };

  const getCurrencyName = (currency: string) => {
    const names: Record<string, string> = {
      'PEN': 'Sol Peruano',
      'USD': 'Dólar USA',
      'ARS': 'Peso Argentino',
      'EUR': 'Euro',
      'BRL': 'Real Brasileño',
      'CLP': 'Peso Chileno',
      'COP': 'Peso Colombiano',
      'MXN': 'Peso Mexicano',
    };
    return names[currency] || currency;
  };

  const formatCurrencyWithCode = (amount: number, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    const formattedAmount = amount.toLocaleString('es-PE', { minimumFractionDigits: 0 });
    return `${symbol}${formattedAmount} ${currency}`;
  };

  // Translate method to Spanish
  const translateMethod = (method: string | null) => {
    if (!method) return 'Pago';
    const translations: Record<string, string> = {
      'transfer': 'Transferencia',
      'cash': 'Efectivo',
      'credit': 'Crédito',
      'debit': 'Débito',
      'check': 'Cheque',
      'deposit': 'Depósito',
      'wire': 'Giro',
      'other': 'Otro',
    };
    return translations[method.toLowerCase()] || method;
  };

  // Calculate stats by currency
  const statsByCurrency = useMemo(() => {
    if (!payments) return {};
    const statsData: Record<string, { confirmed: number; pending: number; rejected: number }> = {};

    payments.forEach(payment => {
      const currency = payment.currency || userCurrency;
      if (!statsData[currency]) {
        statsData[currency] = { confirmed: 0, pending: 0, rejected: 0 };
      }
      if (payment.status === 'confirmed') {
        statsData[currency].confirmed += payment.amount;
      } else if (payment.status === 'pending') {
        statsData[currency].pending += payment.amount;
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        statsData[currency].rejected += payment.amount;
      }
    });
    return statsData;
  }, [payments, userCurrency]);

  // Get list of currencies sorted by total amount
  const currencyList = useMemo(() => {
    const currencies = Object.keys(statsByCurrency);
    return currencies.sort((a, b) => {
      const totalA = statsByCurrency[a].confirmed + statsByCurrency[a].pending;
      const totalB = statsByCurrency[b].confirmed + statsByCurrency[b].pending;
      return totalB - totalA;
    });
  }, [statsByCurrency]);

  // Get pending payments that need attention
  const pendingPayments = payments?.filter(p => p.status === 'pending') || [];
  const overduePayments = pendingPayments.filter(p => {
    if (!p.due_date) return false;
    return new Date(p.due_date) < new Date();
  });

  // Get recent transactions (limit 5)
  const recentPayments = payments?.slice(0, 5) || [];

  // Calculate weekly chart max for scaling
  const maxWeeklyValue = Math.max(...(weeklyData?.map(d => d.payments) || [1]), 1);

  const getAvatarColor = (index: number) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-pink-500 to-pink-600',
      'bg-gradient-to-br from-teal-500 to-teal-600',
      'bg-gradient-to-br from-orange-500 to-orange-600',
    ];
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

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return { label: "Pagado", className: "text-[var(--pt-primary)]" };
      case "pending":
        return { label: "Pendiente", className: "text-[var(--pt-yellow)]" };
      case "rejected":
        return { label: "Rechazado", className: "text-[var(--pt-red)]" };
      case "cancelled":
        return { label: "Cancelado", className: "text-[var(--pt-red)]" };
      default:
        return { label: "Desconocido", className: "text-[var(--pt-text-muted)]" };
    }
  };

  const handleOpenDetail = (payment: PaymentWithContact) => {
    setDetailPayment(payment);
    setDetailSheetOpen(true);
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
            {/* Stats Carousel by Currency - Same as Payments page */}
            <div className="animate-slide-up">
              <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2">
                {currencyList.map((currency, index) => {
                  const currencyStats = statsByCurrency[currency];
                  const isFirst = index === 0;

                  return (
                    <div
                      key={currency}
                      className={cn(
                        "snap-center flex-shrink-0 rounded-2xl p-4 border transition-all",
                        "min-w-[280px] sm:min-w-[300px] md:min-w-[280px] lg:min-w-[300px]",
                        isFirst
                          ? "bg-[var(--pt-surface)] border-[var(--pt-primary)]/30"
                          : "bg-[var(--pt-surface)] border-white/5"
                      )}
                    >
                      {/* Header: Currency icon + name + code */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold",
                          isFirst
                            ? "bg-[var(--pt-primary)]/20 text-[var(--pt-primary)]"
                            : "bg-white/10 text-white"
                        )}>
                          {getCurrencySymbol(currency)}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-base">{getCurrencyName(currency)}</p>
                          <p className="text-[var(--pt-text-muted)] text-xs">{currency}</p>
                        </div>
                      </div>

                      {/* Main Amount: Ingresos - label left, amount right */}
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[var(--pt-text-muted)] text-sm font-medium">Ingresos</p>
                        <p className={cn(
                          "text-2xl font-bold",
                          isFirst ? "text-[var(--pt-primary)]" : "text-white"
                        )}>
                          {getCurrencySymbol(currency)}{currencyStats.confirmed.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                        </p>
                      </div>

                      {/* Secondary Stats: Pendiente + Rechazado */}
                      <div className="flex justify-between">
                        <div>
                          <p className="text-[var(--pt-text-muted)] text-[10px] font-medium uppercase tracking-wider mb-0.5">Pendiente</p>
                          <p className="text-[var(--pt-yellow)] font-semibold text-sm">
                            {getCurrencySymbol(currency)}{currencyStats.pending.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[var(--pt-text-muted)] text-[10px] font-medium uppercase tracking-wider mb-0.5">Rechazado</p>
                          <p className="text-[var(--pt-red)] font-semibold text-sm">
                            {getCurrencySymbol(currency)}{currencyStats.rejected.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty state when no currencies */}
                {currencyList.length === 0 && (
                  <div className="snap-center min-w-[280px] flex-shrink-0 rounded-2xl p-4 bg-[var(--pt-surface)] border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Sin datos</p>
                        <p className="text-[var(--pt-text-muted)] text-xs">Registra pagos para ver stats</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Carousel indicators */}
              {currencyList.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {currencyList.map((currency, index) => (
                    <div
                      key={currency}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all",
                        index === 0 ? "bg-[var(--pt-primary)] w-4" : "bg-white/20"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
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

            {/* Weekly Activity Chart */}
            <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
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
                    const isActive = day.payments > 0;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex-1 flex items-end justify-center">
                          <div
                            className={cn(
                              "w-full max-w-[40px] rounded-t-lg transition-all duration-500",
                              isActive
                                ? "bg-gradient-to-t from-[var(--pt-primary)] to-[var(--pt-primary-light)]"
                                : "bg-[var(--pt-surface-elevated)]"
                            )}
                            style={{ height: `${Math.max(height, 8)}%` }}
                          />
                        </div>
                        <span className={cn(
                          "text-[10px]",
                          isActive ? "text-[var(--pt-primary)]" : "text-[var(--pt-text-muted)]"
                        )}>
                          {day.day || ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][index]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Requires Attention - Exact replica of HTML design */}
            {(overduePayments.length > 0 || pendingPayments.length > 0) && (
              <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
                <h3 className="text-lg font-bold text-white mb-3">Requieren Atención</h3>
                <div className="space-y-3">
                  {/* Overdue payments - Red card design */}
                  {overduePayments.slice(0, 2).map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-2xl bg-[#2a1e1e] border border-red-500/20 p-4 relative overflow-hidden cursor-pointer"
                      onClick={() => handleOpenDetail(payment)}
                    >
                      {/* Background warning icon */}
                      <div className="absolute top-0 right-0 p-3 opacity-10">
                        <AlertTriangle className="w-20 h-20 text-red-500" />
                      </div>

                      <div className="relative z-10">
                        {/* Header: Title + Time */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <p className="text-sm font-bold text-red-400">
                              Factura #{payment.reference_number || payment.id.slice(0, 4)} Vencida
                            </p>
                          </div>
                          <span className="text-xs font-medium text-slate-400">
                            Hace {formatDistanceToNow(new Date(payment.due_date!), { locale: es })}
                          </span>
                        </div>

                        {/* Amount */}
                        <p className="text-2xl font-bold text-white mb-1">
                          {formatCurrencyWithCode(payment.amount, payment.currency)}
                        </p>

                        {/* Client */}
                        <p className="text-sm text-slate-400 mb-4">
                          Cliente: {payment.contact?.name || 'Desconocido'}
                        </p>

                        {/* WhatsApp button - Full width */}
                        <button
                          className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold py-3 px-4 rounded-xl transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Send WhatsApp reminder
                          }}
                        >
                          <MessageSquare className="w-5 h-5" />
                          <span>Enviar Recordatorio por WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Pending payments card - Yellow/Orange theme */}
                  {pendingPayments.length > overduePayments.length && (
                    <div
                      className="rounded-2xl bg-[#2a2a1e] border border-orange-500/20 p-4 relative overflow-hidden cursor-pointer"
                      onClick={() => navigate("/payments?status=pending")}
                    >
                      {/* Background icon */}
                      <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Clock className="w-20 h-20 text-orange-500" />
                      </div>

                      <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-500" />
                            <p className="text-sm font-bold text-orange-400">
                              {pendingPayments.length - overduePayments.length} Pagos Pendientes
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>

                        {/* Total pending amount */}
                        <p className="text-2xl font-bold text-white mb-1">
                          {formatCurrencyWithCode(
                            pendingPayments
                              .filter(p => !overduePayments.includes(p))
                              .reduce((sum, p) => sum + p.amount, 0),
                            userCurrency
                          )}
                        </p>

                        <p className="text-sm text-slate-400">
                          Pagos que necesitan revisión
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Transactions - Últimos Movimientos */}
            <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Últimos Movimientos</h3>
                <button
                  className="text-[var(--pt-primary)] text-sm font-semibold flex items-center gap-1"
                  onClick={() => navigate("/payments")}
                >
                  Ver todo
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {recentPayments.map((payment, index) => {
                  const status = getStatusConfig(payment.status);
                  const isPending = payment.status === 'pending';

                  return (
                    <div
                      key={payment.id}
                      onClick={() => handleOpenDetail(payment)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer active:scale-[0.98]",
                        isPending
                          ? "border-l-4 border-l-[var(--pt-yellow)] border-[var(--pt-border)] bg-[var(--pt-surface)] hover:bg-[var(--pt-surface-elevated)]"
                          : "border-[var(--pt-border)] bg-[var(--pt-surface)] hover:bg-[var(--pt-surface-elevated)]"
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md",
                          getAvatarColor(index)
                        )}>
                          {payment.contact?.name ? getInitials(payment.contact.name) : '??'}
                        </div>
                        {payment.status === 'confirmed' && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--pt-primary)] rounded-full border-2 border-[var(--pt-bg)] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {isPending && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--pt-yellow)] rounded-full border-2 border-[var(--pt-bg)] flex items-center justify-center">
                            <Clock className="w-3 h-3 text-[var(--pt-bg)]" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white truncate">
                          {payment.contact?.name || 'Desconocido'}
                        </p>
                        <div className="flex items-center gap-1.5 text-[var(--pt-text-secondary)] text-xs">
                          <Building2 className="w-3 h-3" />
                          <span>{payment.method_detail || translateMethod(payment.method)}</span>
                          <span>•</span>
                          <span>{formatPaymentDate(payment.created_at)}</span>
                        </div>
                      </div>

                      {/* Amount & Status */}
                      <div className="text-right">
                        <p className={cn(
                          "font-bold text-base",
                          payment.status === 'confirmed' ? "text-[var(--pt-primary)]" : isPending ? "text-white" : "text-[var(--pt-text-secondary)]"
                        )}>
                          {payment.status === 'confirmed' ? '+' : ''}{formatCurrencyWithCode(payment.amount, payment.currency)}
                        </p>
                        <p className={cn("text-xs font-medium", status.className)}>
                          {status.label}
                        </p>
                      </div>
                    </div>
                  );
                })}

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

      {/* Payment Detail Sheet */}
      <PaymentDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        payment={detailPayment}
        onEdit={() => {}}
        onConfirm={() => {}}
        onReject={() => {}}
        onDelete={() => {}}
      />
    </DashboardLayout>
  );
};

export default Index;
