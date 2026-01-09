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
  Palette,
  GraduationCap,
  Megaphone,
  Briefcase,
  Code,
  FileText,
  Package,
  Wrench,
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

  // Get rejected/cancelled payments
  const rejectedPayments = payments?.filter(p => p.status === 'rejected' || p.status === 'cancelled') || [];

  // Get recent transactions (limit 5)
  const recentPayments = payments?.slice(0, 5) || [];

  // Generate WhatsApp reminder URL using templates
  const getWhatsAppUrl = (payment: PaymentWithContact, type: 'overdue' | 'rejected' | 'pending') => {
    const phone = payment.contact?.phone?.replace(/\D/g, '') || '';
    if (!phone) return null;

    const contactName = payment.contact?.name || 'Cliente';
    const amount = formatCurrencyWithCode(payment.amount, payment.currency);
    const businessName = profile?.business_name || profile?.full_name || 'Nosotros';

    let message = '';
    if (type === 'overdue') {
      const daysOverdue = payment.due_date
        ? Math.floor((new Date().getTime() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      message = `Hola ${contactName}, te recordamos que tienes un pago vencido de ${amount} hace ${daysOverdue} días. Por favor realiza el pago lo antes posible. - ${businessName}`;
    } else if (type === 'rejected') {
      message = `Hola ${contactName}, notamos que hubo un problema con tu pago de ${amount}. ¿Podemos ayudarte a resolverlo? - ${businessName}`;
    } else if (type === 'pending') {
      const dueDate = payment.due_date
        ? format(new Date(payment.due_date), "dd 'de' MMMM", { locale: es })
        : 'próximamente';
      message = `Hola ${contactName}, te recordamos que tienes un pago pendiente de ${amount} con vencimiento ${dueDate}. Por favor realiza el pago. - ${businessName}`;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  // Get non-overdue pending payments (pending but not overdue yet)
  const upcomingPendingPayments = pendingPayments.filter(p => !overduePayments.includes(p));

  // Calculate weekly activity from payments data directly
  const weeklyActivityData = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const activity: { day: string; payments: number; amount: number }[] = [];

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Count payments for this day from existing data
      const dayPayments = payments?.filter(p => {
        const paymentDate = new Date(p.created_at);
        return paymentDate >= date && paymentDate < nextDate;
      }) || [];

      const totalAmount = dayPayments.reduce((sum, p) => sum + p.amount, 0);

      activity.push({
        day: days[date.getDay()],
        payments: dayPayments.length,
        amount: totalAmount,
      });
    }

    return activity;
  }, [payments]);

  // Calculate weekly chart max for scaling
  const maxWeeklyValue = Math.max(...weeklyActivityData.map(d => d.payments), 1);

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

  // Get icon and color based on payment notes/method
  const getPaymentIcon = (payment: PaymentWithContact, index: number) => {
    const notes = (payment.notes || '').toLowerCase();
    const method = (payment.method || '').toLowerCase();

    // Check notes for keywords
    if (notes.includes('diseño') || notes.includes('logo') || notes.includes('design')) {
      return { Icon: Palette, bgColor: 'bg-purple-500/20', textColor: 'text-purple-500' };
    }
    if (notes.includes('consultor') || notes.includes('asesor') || notes.includes('consulting')) {
      return { Icon: GraduationCap, bgColor: 'bg-blue-500/20', textColor: 'text-blue-500' };
    }
    if (notes.includes('campaña') || notes.includes('rrss') || notes.includes('marketing') || notes.includes('social')) {
      return { Icon: Megaphone, bgColor: 'bg-pink-500/20', textColor: 'text-pink-500' };
    }
    if (notes.includes('desarrollo') || notes.includes('web') || notes.includes('app') || notes.includes('software')) {
      return { Icon: Code, bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-500' };
    }
    if (notes.includes('servicio') || notes.includes('trabajo')) {
      return { Icon: Wrench, bgColor: 'bg-orange-500/20', textColor: 'text-orange-500' };
    }
    if (notes.includes('producto') || notes.includes('venta')) {
      return { Icon: Package, bgColor: 'bg-teal-500/20', textColor: 'text-teal-500' };
    }

    // Default cycle through colors
    const defaults = [
      { Icon: Briefcase, bgColor: 'bg-purple-500/20', textColor: 'text-purple-500' },
      { Icon: FileText, bgColor: 'bg-blue-500/20', textColor: 'text-blue-500' },
      { Icon: Receipt, bgColor: 'bg-pink-500/20', textColor: 'text-pink-500' },
      { Icon: Wallet, bgColor: 'bg-teal-500/20', textColor: 'text-teal-500' },
      { Icon: Package, bgColor: 'bg-orange-500/20', textColor: 'text-orange-500' },
    ];
    return defaults[index % defaults.length];
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
            {/* Stats Carousel by Currency - With separator lines */}
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
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <p className="text-[var(--pt-text-muted)] text-sm font-medium">Ingresos</p>
                        <p className={cn(
                          "text-2xl font-bold",
                          isFirst ? "text-[var(--pt-primary)]" : "text-white"
                        )}>
                          {getCurrencySymbol(currency)}{currencyStats.confirmed.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                        </p>
                      </div>

                      {/* Secondary Stats: Pendiente + Rechazado with vertical divider */}
                      <div className="flex pt-3">
                        <div className="flex-1 pr-3 border-r border-white/10">
                          <p className="text-[var(--pt-text-muted)] text-[10px] font-medium uppercase tracking-wider mb-0.5">Pendiente</p>
                          <p className="text-[var(--pt-yellow)] font-semibold text-sm">
                            {getCurrencySymbol(currency)}{currencyStats.pending.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div className="flex-1 pl-3 text-right">
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
                  {weeklyActivityData.map((day, index) => {
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
                          {day.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Requires Attention - Exact replica of HTML design */}
            {(overduePayments.length > 0 || pendingPayments.length > 0 || rejectedPayments.length > 0) && (
              <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
                <h3 className="text-lg font-bold text-white mb-3">Requieren Atención</h3>
                <div className="space-y-3">
                  {/* Overdue payments - Red card design */}
                  {overduePayments.slice(0, 2).map((payment) => {
                    const whatsappUrl = getWhatsAppUrl(payment, 'overdue');
                    return (
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
                          {whatsappUrl ? (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold py-3 px-4 rounded-xl transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MessageSquare className="w-5 h-5" />
                              <span>Enviar Recordatorio por WhatsApp</span>
                            </a>
                          ) : (
                            <button
                              className="w-full flex items-center justify-center gap-2 bg-slate-600 text-white font-bold py-3 px-4 rounded-xl cursor-not-allowed"
                              disabled
                            >
                              <MessageSquare className="w-5 h-5" />
                              <span>Sin teléfono registrado</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Rejected payments - Dark red card design */}
                  {rejectedPayments.slice(0, 2).map((payment) => {
                    const whatsappUrl = getWhatsAppUrl(payment, 'rejected');
                    return (
                      <div
                        key={payment.id}
                        className="rounded-2xl bg-[#2a1e1e] border border-red-500/20 p-4 relative overflow-hidden cursor-pointer"
                        onClick={() => handleOpenDetail(payment)}
                      >
                        {/* Background X icon */}
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                          <X className="w-20 h-20 text-red-500" />
                        </div>

                        <div className="relative z-10">
                          {/* Header: Title + Time */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <X className="w-5 h-5 text-red-500" />
                              <p className="text-sm font-bold text-red-400">
                                Pago #{payment.reference_number || payment.id.slice(0, 4)} Rechazado
                              </p>
                            </div>
                            <span className="text-xs font-medium text-slate-400">
                              {formatPaymentDate(payment.created_at)}
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
                          {whatsappUrl ? (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold py-3 px-4 rounded-xl transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MessageSquare className="w-5 h-5" />
                              <span>Contactar por WhatsApp</span>
                            </a>
                          ) : (
                            <button
                              className="w-full flex items-center justify-center gap-2 bg-slate-600 text-white font-bold py-3 px-4 rounded-xl cursor-not-allowed"
                              disabled
                            >
                              <MessageSquare className="w-5 h-5" />
                              <span>Sin teléfono registrado</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Pending payments - Yellow card design (individual cards with WhatsApp) */}
                  {upcomingPendingPayments.slice(0, 2).map((payment) => {
                    const whatsappUrl = getWhatsAppUrl(payment, 'pending');
                    const dueDate = payment.due_date
                      ? format(new Date(payment.due_date), "dd 'de' MMM", { locale: es })
                      : null;
                    return (
                      <div
                        key={payment.id}
                        className="rounded-2xl bg-[#2a2a1e] border border-yellow-500/20 p-4 relative overflow-hidden cursor-pointer"
                        onClick={() => handleOpenDetail(payment)}
                      >
                        {/* Background clock icon */}
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                          <Clock className="w-20 h-20 text-yellow-500" />
                        </div>

                        <div className="relative z-10">
                          {/* Header: Title + Due date */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-yellow-500" />
                              <p className="text-sm font-bold text-yellow-400">
                                Pago #{payment.reference_number || payment.id.slice(0, 4)} Pendiente
                              </p>
                            </div>
                            {dueDate && (
                              <span className="text-xs font-medium text-slate-400">
                                Vence {dueDate}
                              </span>
                            )}
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
                          {whatsappUrl ? (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold py-3 px-4 rounded-xl transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MessageSquare className="w-5 h-5" />
                              <span>Enviar Recordatorio por WhatsApp</span>
                            </a>
                          ) : (
                            <button
                              className="w-full flex items-center justify-center gap-2 bg-slate-600 text-white font-bold py-3 px-4 rounded-xl cursor-not-allowed"
                              disabled
                            >
                              <MessageSquare className="w-5 h-5" />
                              <span>Sin teléfono registrado</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Summary card if more pending payments exist */}
                  {upcomingPendingPayments.length > 2 && (
                    <div
                      className="rounded-2xl bg-[#2a2a1e] border border-yellow-500/20 p-4 relative overflow-hidden cursor-pointer"
                      onClick={() => navigate("/payments?status=pending")}
                    >
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-yellow-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-yellow-400">
                              +{upcomingPendingPayments.length - 2} pagos pendientes más
                            </p>
                            <p className="text-xs text-slate-400">
                              Ver todos los pagos pendientes
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Transactions - Últimos Movimientos (HTML design style) */}
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
              <div className="flex flex-col gap-3">
                {recentPayments.map((payment, index) => {
                  const status = getStatusConfig(payment.status);
                  const isPending = payment.status === 'pending';
                  const { Icon, bgColor, textColor } = getPaymentIcon(payment, index);

                  return (
                    <div
                      key={payment.id}
                      onClick={() => handleOpenDetail(payment)}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--pt-surface)] border border-white/5 cursor-pointer hover:bg-[var(--pt-surface-elevated)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Colored Icon */}
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                          bgColor
                        )}>
                          <Icon className={cn("w-5 h-5", textColor)} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            {payment.notes?.split(' ').slice(0, 2).join(' ') || payment.contact?.name || 'Pago'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {payment.contact?.name || 'Cliente'} • {formatPaymentDate(payment.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-sm font-bold",
                          payment.status === 'confirmed' ? "text-[var(--pt-primary)]" : "text-white"
                        )}>
                          {payment.status === 'confirmed' ? '+' : ''}{formatCurrencyWithCode(payment.amount, payment.currency)}
                        </p>
                        <span className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded inline-block mt-0.5",
                          payment.status === 'confirmed'
                            ? "bg-[var(--pt-primary)]/10 text-[var(--pt-primary)]"
                            : isPending
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-slate-500/10 text-slate-400"
                        )}>
                          {status.label}
                        </span>
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
