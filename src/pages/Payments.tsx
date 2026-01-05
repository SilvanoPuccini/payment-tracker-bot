import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  TrendingUp,
  Building2,
  MoreHorizontal,
  Eye,
  Trash2,
  Plus,
  Pencil,
  ArrowLeft,
  Receipt,
  Check,
  PiggyBank,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { usePayments, usePaymentStats, useConfirmPayment, useRejectPayment, useDeletePayment, PaymentWithContact } from "@/hooks/usePayments";
import type { PaymentStatus } from "@/types/database";
import { format, isToday, isYesterday, isThisWeek, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { PaymentDetailSheet } from "@/components/payments/PaymentDetailSheet";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

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

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithContact | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailPayment, setDetailPayment] = useState<PaymentWithContact | null>(null);
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: payments, isLoading } = usePayments(
    statusFilter !== "all" ? { status: statusFilter as PaymentStatus } : undefined
  );
  const { data: stats } = usePaymentStats();
  const confirmPayment = useConfirmPayment();
  const rejectPayment = useRejectPayment();
  const deletePayment = useDeletePayment();

  const userCurrency = profile?.currency || 'PEN';

  // Get currency symbol based on currency code
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

  // Format currency with symbol and code: "$ 200,000 ARS"
  const formatCurrencyWithCode = (amount: number, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    const formattedAmount = amount.toLocaleString('es-PE', { minimumFractionDigits: 0 });
    return `${symbol}${formattedAmount} ${currency}`;
  };

  // Format for stats (uses user's default currency)
  const formatCurrency = (amount: number) => {
    const symbol = getCurrencySymbol(userCurrency);
    const formattedAmount = amount.toLocaleString('es-PE', { minimumFractionDigits: 0 });
    return `${userCurrency} ${symbol}${formattedAmount}`;
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

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments?.filter((payment) => {
      const contactName = payment.contact?.name || '';
      const matchesSearch = contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.reference_number && payment.reference_number.includes(searchTerm));
      return matchesSearch;
    }) || [];
  }, [payments, searchTerm]);

  // Group payments by date
  const groupedPayments = useMemo(() => {
    const groups: { [key: string]: PaymentWithContact[] } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    filteredPayments.forEach(payment => {
      const date = new Date(payment.created_at);
      if (isToday(date)) {
        groups.today.push(payment);
      } else if (isYesterday(date)) {
        groups.yesterday.push(payment);
      } else if (isThisWeek(date, { weekStartsOn: 1 })) {
        groups.thisWeek.push(payment);
      } else {
        groups.older.push(payment);
      }
    });

    return groups;
  }, [filteredPayments]);

  const handleConfirm = async (id: string) => {
    await confirmPayment.mutateAsync(id);
  };

  const handleReject = async (id: string) => {
    await rejectPayment.mutateAsync(id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este pago?')) {
      await deletePayment.mutateAsync(id);
    }
  };

  const handleOpenCreate = () => {
    setSelectedPayment(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (payment: PaymentWithContact) => {
    setDetailSheetOpen(false);
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const handleOpenDetail = (payment: PaymentWithContact) => {
    setDetailPayment(payment);
    setDetailSheetOpen(true);
  };

  const handleConfirmFromDetail = async (id: string) => {
    await handleConfirm(id);
    setDetailSheetOpen(false);
  };

  const handleRejectFromDetail = async (id: string) => {
    await handleReject(id);
    setDetailSheetOpen(false);
  };

  const handleDeleteFromDetail = async (id: string) => {
    await handleDelete(id);
    setDetailSheetOpen(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const filters = [
    { id: 'all', label: 'Todo', count: payments?.length || 0 },
    { id: 'confirmed', label: 'Confirmado', count: payments?.filter(p => p.status === 'confirmed').length || 0 },
    { id: 'pending', label: 'Pendiente', count: payments?.filter(p => p.status === 'pending').length || 0 },
    { id: 'rejected', label: 'Rechazado', count: payments?.filter(p => p.status === 'rejected' || p.status === 'cancelled').length || 0 },
  ];

  const PaymentItem = ({ payment, index }: { payment: PaymentWithContact; index: number }) => {
    const status = getStatusConfig(payment.status);
    const isPending = payment.status === 'pending';

    return (
      <div
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
            <span>{formatTime(payment.created_at)}</span>
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

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
              className="h-8 w-8 text-[var(--pt-text-muted)] hover:text-white hover:bg-[var(--pt-surface-elevated)] rounded-lg ml-1"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[var(--pt-surface)] border-[var(--pt-border)]">
            <DropdownMenuItem
              onClick={() => handleOpenEdit(payment)}
              className="text-white hover:bg-[var(--pt-surface-elevated)]"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            {isPending && (
              <>
                <DropdownMenuSeparator className="bg-[var(--pt-border)]" />
                <DropdownMenuItem
                  onClick={() => handleConfirm(payment.id)}
                  className="text-[var(--pt-primary)] hover:bg-[var(--pt-surface-elevated)]"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleReject(payment.id)}
                  className="text-[var(--pt-yellow)] hover:bg-[var(--pt-surface-elevated)]"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator className="bg-[var(--pt-border)]" />
            <DropdownMenuItem
              className="text-[var(--pt-red)] hover:bg-[var(--pt-surface-elevated)]"
              onClick={() => handleDelete(payment.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-[var(--pt-surface)] rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Pagos</h1>
          <button
            onClick={handleOpenCreate}
            className="bg-[var(--pt-primary)] text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-1.5 shadow-button"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        </div>

        {/* Search */}
        <div className="relative animate-slide-up">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pt-text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por nombre, monto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pt-input pl-12 pr-12 rounded-2xl"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--pt-text-muted)] hover:text-white">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 animate-slide-up" style={{ animationDelay: '50ms' }}>
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={cn(
                "pt-chip",
                statusFilter === filter.id && "active"
              )}
            >
              {filter.label}
              {filter.count > 0 && (
                <span className={cn(
                  "text-xs",
                  statusFilter === filter.id ? "text-white/80" : "text-[var(--pt-text-muted)]"
                )}>
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
          {/* Total Card */}
          <div className="snap-center min-w-[100px] flex-shrink-0 flex flex-col gap-1 rounded-2xl p-3 bg-[var(--pt-surface)] border border-white/5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="p-1 rounded-full bg-[var(--pt-blue)]/20 text-[var(--pt-blue)]">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">Total</span>
            </div>
            <p className="text-white text-xl font-bold">{payments?.length || 0}</p>
            <p className="text-gray-400 text-[10px]">Transacciones</p>
          </div>

          {/* Income Card - Featured */}
          <div className="snap-center min-w-[120px] flex-shrink-0 flex flex-col gap-1 rounded-2xl p-3 bg-gradient-to-br from-[var(--pt-primary)] to-[var(--pt-primary-hover)] border border-white/10 shadow-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="p-1 rounded-full bg-white/20 text-white">
                <PiggyBank className="w-4 h-4" />
              </div>
              <span className="text-white/70 text-[10px] font-medium uppercase tracking-wider">Ingresos</span>
            </div>
            <p className="text-white text-xl font-bold truncate">{formatCurrency(stats?.confirmedAmount || 0)}</p>
            <p className="text-white/60 text-[10px]">Este mes</p>
          </div>

          {/* Pending Card */}
          <div className="snap-center min-w-[120px] flex-shrink-0 flex flex-col gap-1 rounded-2xl p-3 bg-[var(--pt-surface)] border border-white/5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="p-1 rounded-full bg-[var(--pt-yellow)]/20 text-[var(--pt-yellow)]">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">Pendiente</span>
            </div>
            <p className="text-white text-xl font-bold truncate">{formatCurrency(stats?.pendingAmount || 0)}</p>
            <p className="text-gray-400 text-[10px]">Por cobrar</p>
          </div>

          {/* Rejected Card */}
          <div className="snap-center min-w-[120px] flex-shrink-0 flex flex-col gap-1 rounded-2xl p-3 bg-[var(--pt-surface)] border border-white/5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="p-1 rounded-full bg-[var(--pt-red)]/20 text-[var(--pt-red)]">
                <XCircle className="w-4 h-4" />
              </div>
              <span className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">Rechazado</span>
            </div>
            <p className="text-white text-xl font-bold truncate">{formatCurrency(payments?.filter(p => p.status === 'rejected' || p.status === 'cancelled').reduce((sum, p) => sum + p.amount, 0) || 0)}</p>
            <p className="text-gray-400 text-[10px]">Este mes</p>
          </div>
        </div>

        {/* Payment List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-4 rounded-2xl bg-[var(--pt-surface)]">
                <div className="w-12 h-12 rounded-full bg-[var(--pt-surface-elevated)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 bg-[var(--pt-surface-elevated)] rounded" />
                  <div className="h-3 w-20 bg-[var(--pt-surface-elevated)] rounded" />
                </div>
                <div className="h-5 w-16 bg-[var(--pt-surface-elevated)] rounded" />
              </div>
            ))}
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            {/* Emoji con círculo */}
            <div className="w-28 h-28 rounded-full bg-[var(--pt-surface)] flex items-center justify-center mb-6 shadow-lg">
              <span className="text-6xl">💰</span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">¡Sin pagos todavía!</h2>
            <p className="text-[var(--pt-text-secondary)] max-w-xs mb-8">
              Registra tu primer pago o conecta WhatsApp para detectar pagos automáticamente.
            </p>

            {/* Botones */}
            <div className="w-full max-w-xs space-y-3">
              <button
                onClick={handleOpenCreate}
                className="w-full py-4 px-6 rounded-2xl bg-[var(--pt-primary)] text-white font-bold flex items-center justify-center gap-2 shadow-button hover:bg-[var(--pt-primary-hover)] transition-all"
              >
                <Plus className="w-5 h-5" />
                Registrar primer pago
              </button>

              <button
                onClick={() => navigate('/settings')}
                className="w-full py-4 px-6 rounded-2xl bg-[var(--pt-surface)] border border-[var(--pt-border)] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[var(--pt-surface-elevated)] transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Conectar WhatsApp
              </button>
            </div>

            {/* Tip Pro Card */}
            <div className="w-full max-w-xs mt-8 p-4 rounded-2xl bg-[var(--pt-surface)] border border-[var(--pt-border)]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--pt-yellow)]/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">💡</span>
                </div>
                <div className="text-left">
                  <p className="text-[var(--pt-yellow)] text-xs font-bold uppercase mb-1">TIP PRO</p>
                  <p className="text-[var(--pt-text-secondary)] text-sm">
                    Conectar WhatsApp te permite recibir recordatorios automáticos de cobro.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
            {/* Today */}
            {groupedPayments.today.length > 0 && (
              <div>
                <p className="pt-section-header">HOY</p>
                <div className="space-y-3">
                  {groupedPayments.today.map((payment, index) => (
                    <PaymentItem key={payment.id} payment={payment} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Yesterday */}
            {groupedPayments.yesterday.length > 0 && (
              <div>
                <p className="pt-section-header">AYER</p>
                <div className="space-y-3">
                  {groupedPayments.yesterday.map((payment, index) => (
                    <PaymentItem key={payment.id} payment={payment} index={index + groupedPayments.today.length} />
                  ))}
                </div>
              </div>
            )}

            {/* This Week */}
            {groupedPayments.thisWeek.length > 0 && (
              <div>
                <p className="pt-section-header">ESTA SEMANA</p>
                <div className="space-y-3">
                  {groupedPayments.thisWeek.map((payment, index) => (
                    <PaymentItem key={payment.id} payment={payment} index={index + groupedPayments.today.length + groupedPayments.yesterday.length} />
                  ))}
                </div>
              </div>
            )}

            {/* Older */}
            {groupedPayments.older.length > 0 && (
              <div>
                <p className="pt-section-header">ANTERIORES</p>
                <div className="space-y-3">
                  {groupedPayments.older.map((payment, index) => (
                    <PaymentItem key={payment.id} payment={payment} index={index + groupedPayments.today.length + groupedPayments.yesterday.length + groupedPayments.thisWeek.length} />
                  ))}
                </div>
              </div>
            )}

            {/* Count */}
            <div className="text-center py-4">
              <p className="text-sm text-[var(--pt-text-muted)]">
                Mostrando {filteredPayments.length} pagos
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payment={selectedPayment}
      />

      {/* Payment Detail Sheet */}
      <PaymentDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        payment={detailPayment}
        onEdit={handleOpenEdit}
        onConfirm={handleConfirmFromDetail}
        onReject={handleRejectFromDetail}
        onDelete={handleDeleteFromDetail}
      />
    </DashboardLayout>
  );
}
