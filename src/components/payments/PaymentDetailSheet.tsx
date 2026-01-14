import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Check,
  MessageCircle,
  Phone,
  Building2,
  Calendar,
  Hash,
  Sparkles,
  Image as ImageIcon,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { PaymentWithContact } from "@/hooks/usePayments";

// Helper to extract receipt URL from notes
const parseReceiptFromNotes = (notes: string | null): { receiptUrl: string | null; cleanNotes: string | null } => {
  if (!notes) return { receiptUrl: null, cleanNotes: null };

  const receiptMatch = notes.match(/\{\{RECEIPT:(.*?)\}\}/);
  if (receiptMatch) {
    const receiptUrl = receiptMatch[1];
    const cleanNotes = notes.replace(/\{\{RECEIPT:.*?\}\}/, '').trim() || null;
    return { receiptUrl, cleanNotes };
  }

  return { receiptUrl: null, cleanNotes: notes };
};

// Helper to get receipt URL with fallback to message media
const getReceiptUrl = (
  payment: PaymentWithContact
): { receiptUrl: string | null; cleanNotes: string | null; isPdf: boolean; source: 'upload' | 'whatsapp' | null } => {
  // First try to get receipt from notes (uploaded receipt)
  const { receiptUrl: notesReceiptUrl, cleanNotes } = parseReceiptFromNotes(payment.notes);

  if (notesReceiptUrl) {
    const isPdf = notesReceiptUrl.toLowerCase().endsWith('.pdf');
    return { receiptUrl: notesReceiptUrl, cleanNotes, isPdf, source: 'upload' };
  }

  // Fallback to message media (WhatsApp attachment)
  if (payment.message?.media_url) {
    const mimeType = payment.message.media_mime_type || '';
    const isPdf = mimeType.includes('pdf') || payment.message.media_url.toLowerCase().endsWith('.pdf');
    return { receiptUrl: payment.message.media_url, cleanNotes, isPdf, source: 'whatsapp' };
  }

  return { receiptUrl: null, cleanNotes, isPdf: false, source: null };
};

interface PaymentDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentWithContact | null;
  onEdit?: (payment: PaymentWithContact) => void;
  onConfirm?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "confirmed":
      return {
        label: "Confirmado",
        bgClass: "bg-[var(--pt-primary)]/20 border-[var(--pt-primary)]/20",
        textClass: "text-[var(--pt-primary)]",
        icon: CheckCircle2,
      };
    case "pending":
      return {
        label: "Pendiente",
        bgClass: "bg-[var(--pt-yellow)]/20 border-[var(--pt-yellow)]/20",
        textClass: "text-[var(--pt-yellow)]",
        icon: Clock,
      };
    case "rejected":
      return {
        label: "Rechazado",
        bgClass: "bg-[var(--pt-red)]/20 border-[var(--pt-red)]/20",
        textClass: "text-[var(--pt-red)]",
        icon: XCircle,
      };
    case "cancelled":
      return {
        label: "Cancelado",
        bgClass: "bg-[var(--pt-red)]/20 border-[var(--pt-red)]/20",
        textClass: "text-[var(--pt-red)]",
        icon: X,
      };
    default:
      return {
        label: "Desconocido",
        bgClass: "bg-gray-500/20 border-gray-500/20",
        textClass: "text-gray-400",
        icon: Clock,
      };
  }
};

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-gradient-to-br from-blue-500 to-blue-600",
    "bg-gradient-to-br from-purple-500 to-purple-600",
    "bg-gradient-to-br from-pink-500 to-pink-600",
    "bg-gradient-to-br from-teal-500 to-teal-600",
    "bg-gradient-to-br from-orange-500 to-orange-600",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// Translate method to Spanish
const translateMethod = (method: string | null) => {
  if (!method) return null;
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

export function PaymentDetailSheet({
  open,
  onOpenChange,
  payment,
  onEdit,
  onConfirm,
  onReject,
  onDelete,
}: PaymentDetailSheetProps) {
  const [imageError, setImageError] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  if (!payment) return null;

  const status = getStatusConfig(payment.status);
  const StatusIcon = status.icon;

  // Get receipt URL (from upload or WhatsApp message)
  const { receiptUrl, cleanNotes, isPdf, source: receiptSource } = getReceiptUrl(payment);
  const isPending = payment.status === "pending";

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

  const currencySymbol = getCurrencySymbol(payment.currency);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    const formattedAmount = amount.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
    });
    return `${symbol} ${formattedAmount} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM, yyyy", { locale: es });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: es });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openWhatsApp = () => {
    if (payment.contact?.phone) {
      const phone = payment.contact.phone.replace(/\D/g, "");
      window.open(`https://wa.me/${phone}`, "_blank");
    }
  };

  const makeCall = () => {
    if (payment.contact?.phone) {
      window.open(`tel:${payment.contact.phone}`, "_self");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-[var(--pt-bg)] border-0 rounded-t-3xl h-[95vh] overflow-y-auto p-0"
      >
        <SheetTitle className="sr-only">Detalle de Transacción</SheetTitle>
        <SheetDescription className="sr-only">Vista detallada del pago con información y acciones</SheetDescription>

        {/* Top App Bar */}
        <div className="sticky top-0 z-50 flex items-center bg-[var(--pt-bg)]/95 backdrop-blur-md p-4 justify-between border-b border-white/5">
          <button
            onClick={() => onOpenChange(false)}
            className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">
            Detalle de Transacción
          </h2>
          {/* Spacer para mantener el título centrado */}
          <div className="size-10" />
        </div>

        {/* Hero Section: Amount & Status */}
        <div className="flex flex-col items-center pt-8 pb-6 px-4">
          <h1 className="text-white tracking-tight text-4xl font-bold leading-tight text-center mb-3">
            {formatCurrency(payment.amount, payment.currency)}
          </h1>
          <div
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-1.5 border",
              status.bgClass
            )}
          >
            <StatusIcon className={cn("w-[18px] h-[18px]", status.textClass)} />
            <p className={cn("text-sm font-semibold", status.textClass)}>
              {status.label}
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="px-4 pb-2">
          <div className="flex flex-col items-center gap-4 bg-[var(--pt-surface)] rounded-2xl p-6 shadow-sm border border-white/5">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl ring-4 ring-[var(--pt-bg)]",
                    getAvatarColor(payment.contact?.name || "?")
                  )}
                >
                  {payment.contact?.name
                    ? getInitials(payment.contact.name)
                    : "??"}
                </div>
                {payment.status === "confirmed" && (
                  <div className="absolute bottom-0 right-0 bg-[var(--pt-primary)] h-6 w-6 rounded-full border-2 border-[var(--pt-bg)] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-white text-xl font-bold">
                  {payment.contact?.name || "Sin contacto"}
                </p>
                {payment.contact?.phone && (
                  <p className="text-[#9db8ab] text-sm font-medium">
                    {payment.contact.phone}
                  </p>
                )}
              </div>
            </div>
            {payment.contact?.phone && (
              <div className="flex w-full gap-3">
                <button
                  onClick={openWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 h-11 rounded-full bg-[#25D366] hover:bg-[#1ebc59] text-white text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-green-900/20"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </button>
                <button
                  onClick={makeCall}
                  className="flex-1 flex items-center justify-center gap-2 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-transform active:scale-95"
                >
                  <Phone className="w-5 h-5" />
                  Llamar
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="h-6" />

        {/* Payment Details */}
        <div className="px-4">
          <h3 className="text-white text-sm font-bold uppercase tracking-wider opacity-70 mb-3 px-2">
            Detalles del Pago
          </h3>
          <div className="bg-[var(--pt-surface)] rounded-2xl p-5 shadow-sm border border-white/5 space-y-4">
            {/* Method */}
            {payment.method && (
              <>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <p className="text-[#9db8ab] text-sm">Método</p>
                  </div>
                  <p className="text-white text-sm font-medium">
                    {translateMethod(payment.method)}
                  </p>
                </div>
                <div className="w-full h-px bg-white/5" />
              </>
            )}

            {/* Bank */}
            {payment.bank_name && (
              <>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <p className="text-[#9db8ab] text-sm">Banco</p>
                  </div>
                  <p className="text-white text-sm font-medium">
                    {payment.bank_name}
                  </p>
                </div>
                <div className="w-full h-px bg-white/5" />
              </>
            )}

            {/* Method Detail */}
            {payment.method_detail && (
              <>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <p className="text-[#9db8ab] text-sm">Detalle del método</p>
                  </div>
                  <p className="text-white text-sm font-medium">
                    {payment.method_detail}
                  </p>
                </div>
                <div className="w-full h-px bg-white/5" />
              </>
            )}

            {/* Date */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <p className="text-[#9db8ab] text-sm">Fecha</p>
              </div>
              <p className="text-white text-sm font-medium">
                {payment.payment_date
                  ? formatDate(payment.payment_date)
                  : formatDate(payment.created_at)}
              </p>
            </div>

            {/* Reference */}
            {payment.reference_number && (
              <>
                <div className="w-full h-px bg-white/5" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Hash className="w-5 h-5 text-gray-400" />
                    <p className="text-[#9db8ab] text-sm">Referencia</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-white text-sm font-medium">
                      #{payment.reference_number}
                    </p>
                    <button
                      onClick={() => copyToClipboard(payment.reference_number!)}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* AI Confidence */}
            {payment.confidence_score != null && (
              <>
                <div className="w-full h-px bg-white/5" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[var(--pt-primary)]" />
                    <p className="text-[#9db8ab] text-sm">Confianza IA</p>
                  </div>
                  {(() => {
                    const score = payment.confidence_score || 0;
                    // Handle both 0-1 and 0-100 formats
                    const percentage = score > 1 ? Math.min(Math.round(score), 100) : Math.round(score * 100);
                    const isHigh = percentage >= 80;
                    const isMedium = percentage >= 50 && percentage < 80;
                    return (
                      <div className={cn(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded-md",
                        isHigh ? "bg-[var(--pt-primary)]/10" : isMedium ? "bg-[var(--pt-yellow)]/10" : "bg-[var(--pt-red)]/10"
                      )}>
                        <span className={cn(
                          "block w-1.5 h-1.5 rounded-full",
                          isHigh ? "bg-[var(--pt-primary)]" : isMedium ? "bg-[var(--pt-yellow)]" : "bg-[var(--pt-red)]"
                        )} />
                        <p className={cn(
                          "text-xs font-bold uppercase tracking-wide",
                          isHigh ? "text-[var(--pt-primary)]" : isMedium ? "text-[var(--pt-yellow)]" : "text-[var(--pt-red)]"
                        )}>
                          {percentage}% {isHigh ? 'Alta' : isMedium ? 'Media' : 'Baja'}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="h-6" />

        {/* Notes Section */}
        {cleanNotes && (
          <>
            <div className="px-4">
              <div className="flex justify-between items-end mb-2 px-2">
                <h3 className="text-white text-sm font-bold uppercase tracking-wider opacity-70">
                  Notas
                </h3>
                <button className="text-[var(--pt-primary)] text-xs font-bold hover:underline">
                  Editar
                </button>
              </div>
              <div className="bg-[var(--pt-surface)] rounded-2xl p-4 shadow-sm border border-white/5">
                <p className="text-gray-300 text-sm leading-relaxed">
                  {cleanNotes}
                </p>
              </div>
            </div>
            <div className="h-6" />
          </>
        )}

        {/* Proof of Payment */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider opacity-70">
              Comprobante de Pago
            </h3>
            {receiptSource === 'whatsapp' && (
              <span className="flex items-center gap-1 text-xs text-[#25D366] bg-[#25D366]/10 px-2 py-1 rounded-full">
                <MessageSquare className="w-3 h-3" />
                WhatsApp
              </span>
            )}
          </div>
          <div className="bg-[var(--pt-surface)] rounded-2xl p-4 shadow-sm border border-white/5">
            {receiptUrl && !imageError ? (
              isPdf ? (
                // PDF File - centered compact card
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 hover:bg-white/5 rounded-xl p-3 transition-colors"
                >
                  <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-red-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white text-sm font-medium">Documento PDF</p>
                    <p className="text-gray-500 text-xs flex items-center justify-center gap-1 mt-0.5">
                      <ExternalLink className="w-3 h-3" />
                      Abrir en nueva pestaña
                    </p>
                  </div>
                </a>
              ) : (
                // Image File - centered thumbnail card
                <button
                  onClick={() => setShowImageModal(true)}
                  className="flex flex-col items-center gap-2 w-full hover:bg-white/5 rounded-xl p-3 transition-colors group/thumb"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden ring-1 ring-white/10">
                    <img
                      src={receiptUrl}
                      alt="Comprobante de pago"
                      className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                      onError={() => setImageError(true)}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-white text-sm font-medium">Imagen adjunta</p>
                    <p className="text-gray-500 text-xs mt-0.5">Toca para ver en grande</p>
                  </div>
                </button>
              )
            ) : (
              // No receipt - centered compact
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="w-14 h-14 rounded-xl bg-gray-800/50 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-gray-500" />
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Sin comprobante</p>
                  <p className="text-gray-600 text-xs mt-0.5">No se adjuntó archivo</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image Modal */}
        {showImageModal && receiptUrl && !isPdf && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={receiptUrl}
              alt="Comprobante de pago"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm hover:bg-white/20 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
              Abrir original
            </a>
          </div>
        )}

        <div className="h-6" />

        {/* History Log */}
        <div className="px-4 mb-8">
          <h3 className="text-white text-sm font-bold uppercase tracking-wider opacity-70 mb-4 px-2">
            Historial
          </h3>
          <div className="relative pl-2">
            {/* Timeline Item 1 - Created (oldest first) */}
            <div className="relative flex gap-4 pb-6">
              {/* Line connector */}
              <div className="absolute left-[15px] top-9 bottom-0 w-0.5 bg-[#293830]" />
              <div className="flex flex-col items-center z-10">
                <div className="size-8 rounded-full bg-[var(--pt-surface)] border border-white/10 flex items-center justify-center shadow-[0_0_0_4px_var(--pt-bg)]">
                  <Plus className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div className="flex flex-col pt-1">
                <p className="text-white text-sm font-medium">
                  Transacción Creada
                </p>
                <p className="text-[#9db8ab] text-xs">
                  {formatDateTime(payment.created_at)}
                </p>
              </div>
            </div>

            {/* Timeline Item 2 - Current Status (most recent) */}
            <div className="relative flex gap-4">
              <div className="flex flex-col items-center z-10">
                <div
                  className={cn(
                    "size-8 rounded-full flex items-center justify-center shadow-[0_0_0_4px_var(--pt-bg)]",
                    payment.status === "confirmed"
                      ? "bg-[var(--pt-primary)]"
                      : payment.status === "pending"
                      ? "bg-[var(--pt-yellow)]"
                      : "bg-[var(--pt-red)]"
                  )}
                >
                  {payment.status === "confirmed" ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : payment.status === "pending" ? (
                    <Clock className="w-4 h-4 text-black" />
                  ) : (
                    <X className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>
              <div className="flex flex-col pt-1">
                <p className="text-white text-sm font-bold">
                  {payment.status === "confirmed"
                    ? "Marcado como Pagado"
                    : payment.status === "pending"
                    ? "Pendiente de Pago"
                    : "Pago Rechazado"}
                </p>
                <p className="text-[#9db8ab] text-xs">
                  {formatDateTime(payment.updated_at || payment.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer for sticky footer */}
        <div className="h-40" />

        {/* Sticky Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--pt-bg)]/80 backdrop-blur-lg border-t border-white/5 flex flex-col gap-3 max-w-md mx-auto z-50">
          {isPending && (
            <div className="flex gap-3">
              <button
                onClick={() => onConfirm?.(payment.id)}
                className="flex-1 flex items-center justify-center h-12 rounded-full bg-[var(--pt-primary)] hover:bg-[var(--pt-primary-hover)] text-white font-bold tracking-wide transition-colors shadow-lg shadow-primary/20"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Confirmar Pago
              </button>
              <button
                onClick={() => onReject?.(payment.id)}
                className="flex-1 flex items-center justify-center h-12 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Rechazar
              </button>
            </div>
          )}

          <button
            onClick={() => onEdit?.(payment)}
            className="w-full flex items-center justify-center h-12 rounded-full bg-[var(--pt-primary)] hover:bg-[var(--pt-primary-hover)] text-white font-bold tracking-wide transition-colors shadow-lg shadow-primary/20"
          >
            <Pencil className="w-5 h-5 mr-2" />
            Editar Pago
          </button>
          <button
            onClick={() => onDelete?.(payment.id)}
            className="w-full flex items-center justify-center h-10 rounded-full text-red-500 hover:bg-red-500/10 font-semibold text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar Transacción
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
