import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  Calendar,
  CreditCard,
  Hash,
  FileText,
  User,
  Phone,
  Mail,
  Pencil,
  Trash2,
  Check,
  X,
  CalendarClock,
  Bell,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { PaymentWithContact } from "@/hooks/usePayments";

interface PaymentDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentWithContact | null;
  onEdit?: (payment: PaymentWithContact) => void;
  onConfirm?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete?: (id: string) => void;
  currencySymbol?: string;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "confirmed":
      return {
        label: "Confirmado",
        className: "bg-[var(--pt-primary)]/15 text-[var(--pt-primary)]",
        icon: CheckCircle2,
        iconColor: "text-[var(--pt-primary)]",
      };
    case "pending":
      return {
        label: "Pendiente",
        className: "bg-[var(--pt-yellow)]/15 text-[var(--pt-yellow)]",
        icon: Clock,
        iconColor: "text-[var(--pt-yellow)]",
      };
    case "rejected":
      return {
        label: "Rechazado",
        className: "bg-[var(--pt-red)]/15 text-[var(--pt-red)]",
        icon: XCircle,
        iconColor: "text-[var(--pt-red)]",
      };
    case "cancelled":
      return {
        label: "Cancelado",
        className: "bg-[var(--pt-text-muted)]/15 text-[var(--pt-text-muted)]",
        icon: X,
        iconColor: "text-[var(--pt-text-muted)]",
      };
    default:
      return {
        label: "Desconocido",
        className: "bg-[var(--pt-text-muted)]/15 text-[var(--pt-text-muted)]",
        icon: Clock,
        iconColor: "text-[var(--pt-text-muted)]",
      };
  }
};

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-gradient-to-br from-teal-500 to-teal-600',
    'bg-gradient-to-br from-orange-500 to-orange-600',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export function PaymentDetailSheet({
  open,
  onOpenChange,
  payment,
  onEdit,
  onConfirm,
  onReject,
  onDelete,
  currencySymbol = "S/",
}: PaymentDetailSheetProps) {
  if (!payment) return null;

  const status = getStatusConfig(payment.status);
  const StatusIcon = status.icon;
  const isPending = payment.status === "pending";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: es });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: es });
  };

  const DetailRow = ({
    icon: Icon,
    label,
    value,
    iconColor = "text-[var(--pt-text-muted)]",
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | null | undefined;
    iconColor?: string;
  }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 py-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--pt-surface-elevated)] flex items-center justify-center flex-shrink-0">
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--pt-text-muted)] font-medium uppercase">
            {label}
          </p>
          <p className="text-sm text-white font-medium mt-0.5">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-[var(--pt-bg)] border-t border-[var(--pt-border)] rounded-t-3xl max-h-[90vh] overflow-y-auto p-0"
      >
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-[var(--pt-surface)] to-[var(--pt-surface-elevated)] p-6 pb-8">
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="text-white text-lg">
              Detalle del pago
            </SheetTitle>
          </SheetHeader>

          {/* Contact Card */}
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg",
                getAvatarColor(payment.contact?.name || "?")
              )}
            >
              {payment.contact?.name ? getInitials(payment.contact.name) : "??"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-white truncate">
                {payment.contact?.name || "Sin contacto"}
              </p>
              {payment.contact?.phone && (
                <p className="text-sm text-[var(--pt-text-secondary)]">
                  {payment.contact.phone}
                </p>
              )}
            </div>
          </div>

          {/* Amount Badge */}
          <div className="absolute -bottom-8 right-6 bg-[var(--pt-surface)] border-4 border-[var(--pt-bg)] rounded-2xl px-5 py-3 shadow-xl">
            <p className="text-xs text-[var(--pt-text-muted)] font-medium">
              MONTO
            </p>
            <p
              className={cn(
                "text-2xl font-bold",
                payment.status === "confirmed"
                  ? "text-[var(--pt-primary)]"
                  : "text-white"
              )}
            >
              {payment.status === "confirmed" ? "+" : ""}
              {formatCurrency(payment.amount)}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="px-6 pt-12 pb-4">
          <div
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm",
              status.className
            )}
          >
            <StatusIcon className="w-4 h-4" />
            {status.label}
          </div>
        </div>

        {/* Details Section */}
        <div className="px-6 pb-4">
          <p className="text-xs text-[var(--pt-text-muted)] font-bold uppercase mb-2">
            INFORMACIÓN DEL PAGO
          </p>
          <div className="bg-[var(--pt-surface)] rounded-2xl p-4 divide-y divide-[var(--pt-border)]">
            <DetailRow
              icon={CreditCard}
              label="Método de pago"
              value={payment.method_detail || payment.method}
              iconColor="text-[var(--pt-blue)]"
            />
            <DetailRow
              icon={Building2}
              label="Banco"
              value={payment.bank_name}
              iconColor="text-[var(--pt-purple)]"
            />
            <DetailRow
              icon={Hash}
              label="N° Operación"
              value={payment.reference_number}
              iconColor="text-[var(--pt-yellow)]"
            />
            <DetailRow
              icon={Calendar}
              label="Fecha del pago"
              value={
                payment.payment_date ? formatDate(payment.payment_date) : null
              }
              iconColor="text-[var(--pt-primary)]"
            />
            {payment.payment_time && (
              <DetailRow
                icon={Clock}
                label="Hora del pago"
                value={payment.payment_time}
                iconColor="text-[var(--pt-text-muted)]"
              />
            )}
            <DetailRow
              icon={CalendarClock}
              label="Fecha de vencimiento"
              value={
                (payment as any).payment_due_date
                  ? formatDate((payment as any).payment_due_date)
                  : null
              }
              iconColor="text-[var(--pt-red)]"
            />
            <DetailRow
              icon={FileText}
              label="Notas"
              value={payment.notes}
              iconColor="text-[var(--pt-text-muted)]"
            />
          </div>
        </div>

        {/* Contact Details */}
        {payment.contact && (
          <div className="px-6 pb-4">
            <p className="text-xs text-[var(--pt-text-muted)] font-bold uppercase mb-2">
              INFORMACIÓN DEL CONTACTO
            </p>
            <div className="bg-[var(--pt-surface)] rounded-2xl p-4 divide-y divide-[var(--pt-border)]">
              <DetailRow
                icon={User}
                label="Nombre"
                value={payment.contact.name}
                iconColor="text-[var(--pt-primary)]"
              />
              <DetailRow
                icon={Phone}
                label="Teléfono"
                value={payment.contact.phone}
                iconColor="text-[var(--pt-blue)]"
              />
              <DetailRow
                icon={Mail}
                label="Email"
                value={payment.contact.email}
                iconColor="text-[var(--pt-purple)]"
              />
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="px-6 pb-4">
          <p className="text-xs text-[var(--pt-text-muted)] font-bold uppercase mb-2">
            REGISTRO
          </p>
          <div className="bg-[var(--pt-surface)] rounded-2xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[var(--pt-text-muted)]">
                Registrado
              </span>
              <span className="text-sm text-white">
                {formatDateTime(payment.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-[var(--pt-bg)] border-t border-[var(--pt-border)] px-6 py-4 space-y-3">
          {isPending && (
            <div className="flex gap-3">
              <Button
                onClick={() => onConfirm?.(payment.id)}
                className="flex-1 bg-[var(--pt-primary)] hover:bg-[var(--pt-primary-hover)] text-white rounded-xl h-12"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Confirmar pago
              </Button>
              <Button
                onClick={() => onReject?.(payment.id)}
                variant="outline"
                className="flex-1 border-[var(--pt-yellow)] text-[var(--pt-yellow)] hover:bg-[var(--pt-yellow)]/10 rounded-xl h-12"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Rechazar
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => onEdit?.(payment)}
              variant="outline"
              className="flex-1 border-[var(--pt-border)] text-white hover:bg-[var(--pt-surface)] rounded-xl h-12"
            >
              <Pencil className="w-5 h-5 mr-2" />
              Editar
            </Button>
            <Button
              onClick={() => onDelete?.(payment.id)}
              variant="outline"
              className="border-[var(--pt-red)] text-[var(--pt-red)] hover:bg-[var(--pt-red)]/10 rounded-xl h-12 px-4"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
