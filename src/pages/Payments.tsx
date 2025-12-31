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
      return { label: "Cancelado", className: "text-[var(--pt-text-muted)]" };
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
  const currencySymbol = userCurrency === 'PEN' ? 'S/' : userCurrency === 'USD' ? '$' : userCurrency;

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`;
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
    setSelectedPayment(payment);
    setDialogOpen(true);
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
  ];

  const PaymentItem = ({ payment, index }: { payment: PaymentWithContact; index: number }) => {
    const status = getStatusConfig(payment.status);
    const isPending = payment.status === 'pending';

    return (
      <div
        className={cn(
          "flex items-center gap-3 p-4 rounded-2xl border transition-all",
          isPending
            ? "border-l-4 border-l-[var(--pt-yellow)] border-[var(--pt-border)] bg-[var(--pt-surface)]"
            : "border-[var(--pt-border)] bg-[var(--pt-surface)]"
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
            <span>{payment.method_detail || payment.method || 'Pago'}</span>
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
            {payment.status === 'confirmed' ? '+' : ''}{formatCurrency(payment.amount)}
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
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
          {/* Total Card */}
          <div className="pt-stat-card min-w-[140px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--pt-blue)]/15 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-[var(--pt-blue)]" />
              </div>
            </div>
            <p className="text-[10px] text-[var(--pt-text-secondary)] uppercase font-bold">TOTAL</p>
            <p className="text-2xl font-bold text-white">{payments?.length || 0}</p>
            <p className="text-xs text-[var(--pt-text-muted)]">Transacciones</p>
          </div>

          {/* Income Card - Featured */}
          <div className="pt-stat-card pt-stat-card-featured min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <PiggyBank className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-[10px] text-white/70 uppercase font-bold">INGRESOS</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(stats?.confirmedAmount || 0)}</p>
            <p className="text-xs text-white/60">Este mes</p>
          </div>

          {/* Pending Card */}
          <div className="pt-stat-card min-w-[140px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--pt-yellow)]/15 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[var(--pt-yellow)]" />
              </div>
            </div>
            <p className="text-[10px] text-[var(--pt-text-secondary)] uppercase font-bold">POR COBRAR</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(stats?.pendingAmount || 0)}</p>
            <p className="text-xs text-[var(--pt-text-muted)]">Pendiente</p>
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
          <div className="pt-empty py-16">
            <div className="pt-empty-icon">
              <Receipt className="h-12 w-12 text-[var(--pt-text-muted)]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Sin pagos registrados</h2>
            <p className="text-[var(--pt-text-secondary)] max-w-sm mb-6">
              Los pagos que detectemos aparecerán aquí. Puedes agregar uno manualmente.
            </p>
            <button
              className="pt-btn-primary"
              onClick={handleOpenCreate}
            >
              <Plus className="h-5 w-5" />
              Registrar primer pago
            </button>
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
    </DashboardLayout>
  );
}
