import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  ArrowLeft,
  Pencil,
  MessageSquare,
  Phone,
  Mail,
  Check,
  Bell,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  BadgeCheck,
  Calendar,
} from "lucide-react";
import { useContact } from "@/hooks/useContacts";
import { usePayments } from "@/hooks/usePayments";
import { useAuth } from "@/contexts/AuthContext";
import { ContactDialog } from "@/components/contacts/ContactDialog";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, subMonths } from "date-fns";
import { es } from "date-fns/locale";

// Avatar colors based on name
const AVATAR_COLORS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-pink-500 to-pink-600',
  'from-teal-500 to-teal-600',
  'from-orange-500 to-orange-600',
  'from-emerald-500 to-emerald-600',
  'from-indigo-500 to-indigo-600',
  'from-rose-500 to-rose-600',
];

const getAvatarColor = (name: string) => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
};

export default function ContactProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const { data: contactData, isLoading } = useContact(id || '');
  const { data: allPayments } = usePayments();

  const userCurrency = profile?.currency || 'USD';
  const currencySymbol = userCurrency === 'PEN' ? 'S/' : userCurrency === 'USD' ? '$' : userCurrency === 'ARS' ? '$' : userCurrency;

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  };

  // Get payments for this contact
  const contactPayments = useMemo(() => {
    if (!allPayments || !id) return [];
    return allPayments.filter(p => p.contact_id === id).sort((a, b) =>
      new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );
  }, [allPayments, id]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalPaid = contactPayments
      .filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalPending = contactPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const confirmedCount = contactPayments.filter(p => p.status === 'confirmed').length;
    const totalCount = contactPayments.length;
    const reliability = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 100;

    return { totalPaid, totalPending, reliability };
  }, [contactPayments]);

  // Calculate chart data (last 6 months)
  const chartData = useMemo(() => {
    const months: { month: string; shortMonth: string; amount: number; isCurrentMonth: boolean }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthPayments = contactPayments.filter(p => {
        const pDate = new Date(p.payment_date);
        return pDate >= monthStart && pDate <= monthEnd && p.status === 'confirmed';
      });

      const amount = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      months.push({
        month: format(date, 'MMMM', { locale: es }),
        shortMonth: format(date, 'MMM', { locale: es }),
        amount,
        isCurrentMonth: i === 0,
      });
    }

    return months;
  }, [contactPayments]);

  const maxChartValue = Math.max(...chartData.map(d => d.amount), 1);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-full bg-[var(--pt-surface)] rounded-xl" />
          <div className="flex flex-col items-center gap-4">
            <div className="w-28 h-28 rounded-full bg-[var(--pt-surface)]" />
            <div className="h-6 w-40 bg-[var(--pt-surface)] rounded" />
            <div className="h-4 w-32 bg-[var(--pt-surface)] rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!contactData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-[var(--pt-text-muted)]">Contacto no encontrado</p>
          <button
            onClick={() => navigate('/contacts')}
            className="mt-4 text-[var(--pt-primary)] font-medium"
          >
            Volver a contactos
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const contact = contactData;
  const clientSince = contact.created_at
    ? format(new Date(contact.created_at), "'Cliente desde' MMM yyyy", { locale: es })
    : 'Cliente nuevo';

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <button
            onClick={() => navigate('/contacts')}
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-[var(--pt-surface)] rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white">Perfil de Contacto</h1>
          <button
            onClick={() => setEditDialogOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-[var(--pt-text-muted)] hover:bg-[var(--pt-surface)] rounded-full transition-colors"
          >
            <Pencil className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col items-center animate-slide-up">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className={cn(
              "w-28 h-28 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg bg-gradient-to-br ring-4 ring-[var(--pt-primary)]/20 ring-offset-2 ring-offset-[var(--pt-bg)]",
              getAvatarColor(contact.name)
            )}>
              {getInitials(contact.name)}
            </div>
            {contact.status === 'active' && (
              <div className="absolute bottom-1 right-1 bg-[var(--pt-primary)] border-2 border-[var(--pt-bg)] rounded-full w-7 h-7 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            )}
          </div>

          {/* Name & Info */}
          <h2 className="text-2xl font-bold text-white text-center mb-1">{contact.name}</h2>
          <p className="text-[var(--pt-text-muted)] text-sm font-medium text-center mb-1">{contact.phone}</p>
          <p className="text-xs text-[var(--pt-text-muted)] bg-white/5 px-3 py-1 rounded-full">
            {clientSince}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6 py-2 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <button
            onClick={() => window.open(`https://wa.me/${contact.phone?.replace(/\D/g, '')}`, '_blank')}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="rounded-full bg-green-500/10 group-hover:bg-green-500/20 p-3.5 transition-colors border border-green-500/20">
              <MessageSquare className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-medium text-[var(--pt-text-muted)]">WhatsApp</span>
          </button>
          <button
            onClick={() => window.open(`tel:${contact.phone}`, '_blank')}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="rounded-full bg-[var(--pt-surface)] group-hover:bg-white/10 p-3.5 transition-colors">
              <Phone className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-medium text-[var(--pt-text-muted)]">Llamar</span>
          </button>
          {contact.email && (
            <button
              onClick={() => window.open(`mailto:${contact.email}`, '_blank')}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="rounded-full bg-[var(--pt-surface)] group-hover:bg-white/10 p-3.5 transition-colors">
                <Mail className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-xs font-medium text-[var(--pt-text-muted)]">Email</span>
            </button>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex flex-col gap-1 rounded-xl p-4 bg-[var(--pt-surface)] border border-[var(--pt-border)]">
            <span className="text-[var(--pt-text-muted)] text-xs font-medium">Pagado</span>
            <span className="text-[var(--pt-primary)] tracking-tight text-lg font-bold leading-none">
              {formatCurrency(stats.totalPaid)}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl p-4 bg-[var(--pt-surface)] border border-[var(--pt-border)]">
            <span className="text-[var(--pt-text-muted)] text-xs font-medium">Pendiente</span>
            <span className="text-[var(--pt-yellow)] tracking-tight text-lg font-bold leading-none">
              {formatCurrency(stats.totalPending)}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl p-4 bg-[var(--pt-surface)] border border-[var(--pt-border)]">
            <span className="text-[var(--pt-text-muted)] text-xs font-medium">Confianza</span>
            <div className="flex items-center gap-1">
              <span className="text-white tracking-tight text-lg font-bold leading-none">
                {stats.reliability}%
              </span>
              <BadgeCheck className="w-4 h-4 text-[var(--pt-primary)]" />
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="rounded-2xl bg-[var(--pt-surface)] p-5 border border-[var(--pt-border)] animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Historial de Pagos</h3>
              <p className="text-xs text-[var(--pt-text-muted)] mt-1">Ultimos 6 meses</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-white">{formatCurrency(stats.totalPaid + stats.totalPending)}</p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--pt-primary)] font-bold">TOTAL</p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="grid grid-cols-6 gap-2 h-32 items-end pt-4">
            {chartData.map((data, index) => {
              const height = maxChartValue > 0 ? (data.amount / maxChartValue) * 100 : 0;
              const hasValue = data.amount > 0;

              return (
                <div key={index} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition-all relative",
                      hasValue
                        ? data.isCurrentMonth
                          ? "bg-[var(--pt-primary)] shadow-[0_0_10px_rgba(18,186,102,0.3)]"
                          : "bg-[var(--pt-primary)]/70"
                        : "bg-white/5 group-hover:bg-[var(--pt-primary)]/30"
                    )}
                    style={{ height: `${Math.max(height, 5)}%` }}
                  >
                    {hasValue && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {formatCurrency(data.amount)}
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium capitalize",
                    hasValue ? "text-white" : "text-[var(--pt-text-muted)]"
                  )}>
                    {data.shortMonth}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white">Ultimos Pagos</h3>
            <button
              onClick={() => navigate('/payments')}
              className="text-[var(--pt-primary)] text-sm font-medium hover:text-[var(--pt-primary)]/80 transition-colors"
            >
              Ver todos
            </button>
          </div>

          {contactPayments.length === 0 ? (
            <div className="text-center py-8 bg-[var(--pt-surface)] rounded-xl border border-[var(--pt-border)]">
              <p className="text-[var(--pt-text-muted)]">Sin pagos registrados</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {contactPayments.slice(0, 5).map((payment) => {
                const isPaid = payment.status === 'confirmed';
                const isPending = payment.status === 'pending';
                const isRejected = payment.status === 'rejected';

                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--pt-surface)] border border-[var(--pt-border)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        isPaid ? "bg-[var(--pt-primary)]/20" :
                        isPending ? "bg-[var(--pt-yellow)]/20" :
                        "bg-[var(--pt-red)]/20"
                      )}>
                        {isPaid ? (
                          <CheckCircle2 className="w-5 h-5 text-[var(--pt-primary)]" />
                        ) : isPending ? (
                          <Clock className="w-5 h-5 text-[var(--pt-yellow)]" />
                        ) : (
                          <XCircle className="w-5 h-5 text-[var(--pt-red)]" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">
                          {payment.description || 'Pago'}
                        </span>
                        <span className="text-xs text-[var(--pt-text-muted)]">
                          {format(new Date(payment.payment_date), "dd MMM, yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-white">
                        {formatCurrency(Number(payment.amount))}
                      </span>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium",
                        isPaid ? "bg-[var(--pt-primary)]/20 text-[var(--pt-primary)]" :
                        isPending ? "bg-[var(--pt-yellow)]/20 text-[var(--pt-yellow)]" :
                        "bg-[var(--pt-red)]/20 text-[var(--pt-red)]"
                      )}>
                        {isPaid ? 'Pagado' : isPending ? 'Pendiente' : 'Rechazado'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes Section */}
        {contact.notes && (
          <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white">Notas</h3>
              <button
                onClick={() => setEditDialogOpen(true)}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <Pencil className="w-4 h-4 text-[var(--pt-text-muted)]" />
              </button>
            </div>
            <div className="p-4 rounded-xl bg-[var(--pt-surface)]/50 border border-[var(--pt-border)]">
              <div className="flex gap-3">
                <FileText className="w-5 h-5 text-[var(--pt-text-muted)] shrink-0" />
                <p className="text-sm text-[var(--pt-text-secondary)] leading-relaxed">
                  {contact.notes}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Footer */}
        <div className="fixed bottom-16 left-0 w-full p-4 bg-[var(--pt-bg)]/80 backdrop-blur-xl border-t border-[var(--pt-border)] z-40 sm:bottom-0">
          <div className="flex gap-4 max-w-md mx-auto">
            <button
              onClick={() => navigate('/reminders')}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border border-[var(--pt-border)] text-white font-medium hover:bg-white/5 transition-colors"
            >
              <Bell className="w-5 h-5" />
              Recordar
            </button>
            <button
              onClick={() => setPaymentDialogOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--pt-primary)] text-white font-bold hover:bg-[var(--pt-primary)]/90 transition-colors shadow-lg shadow-[var(--pt-primary)]/20"
            >
              <Plus className="w-5 h-5" />
              Registrar Pago
            </button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <ContactDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        contact={contact}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        defaultContactId={contact.id}
      />
    </DashboardLayout>
  );
}
