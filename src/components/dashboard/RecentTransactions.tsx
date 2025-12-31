import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, MessageSquare, ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentTransactions } from "@/hooks/useDashboard";
import { useNavigate } from "react-router-dom";
import { PaymentStatus } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const statusConfig: Record<PaymentStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  confirmed: {
    label: "Confirmado",
    icon: CheckCircle2,
    className: "bg-stitch-primary/15 text-stitch-primary border-stitch-primary/20",
  },
  pending: {
    label: "Pendiente",
    icon: Clock,
    className: "bg-stitch-yellow/15 text-stitch-yellow border-stitch-yellow/20",
  },
  rejected: {
    label: "Rechazado",
    icon: XCircle,
    className: "bg-stitch-red/15 text-stitch-red border-stitch-red/20",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    className: "bg-stitch-muted/15 text-stitch-muted border-stitch-muted/20",
  },
};

export function RecentTransactions() {
  const { data: transactions, isLoading } = useRecentTransactions(5);
  const navigate = useNavigate();

  const formatCurrency = (amount: number, currency: string = 'PEN') => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es });
  };

  return (
    <div className="stitch-card animate-slide-up" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between border-b border-stitch pb-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-stitch-text">Transacciones Recientes</h3>
          <p className="text-sm text-stitch-muted">Últimos pagos detectados vía WhatsApp</p>
        </div>
        <button
          onClick={() => navigate('/payments')}
          className="text-sm font-medium text-stitch-primary hover:text-stitch-primary/80 transition-colors"
        >
          Ver todos →
        </button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-stitch-surface-elevated/50">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl bg-stitch-surface-elevated" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28 bg-stitch-surface-elevated" />
                    <Skeleton className="h-3 w-20 bg-stitch-surface-elevated" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16 bg-stitch-surface-elevated" />
                  <Skeleton className="h-6 w-20 rounded-full bg-stitch-surface-elevated" />
                </div>
              </div>
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-stitch-surface-elevated flex items-center justify-center mb-4">
              <MessageSquare className="h-7 w-7 text-stitch-muted" />
            </div>
            <p className="text-stitch-text font-medium">No hay transacciones recientes</p>
            <p className="text-sm text-stitch-muted mt-1">Las transacciones aparecerán aquí cuando se detecten pagos</p>
          </div>
        ) : (
          transactions.map((tx, index) => {
            const status = statusConfig[tx.status];
            const StatusIcon = status.icon;
            const confidence = (tx.confidence_score || 0) / 100;

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-stitch-surface-elevated transition-colors animate-fade-in cursor-pointer group"
                style={{ animationDelay: `${(index + 1) * 50}ms` }}
                onClick={() => navigate(`/payments?id=${tx.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stitch-surface-elevated group-hover:bg-stitch-primary/15 transition-colors">
                    <span className="text-sm font-semibold text-stitch-text group-hover:text-stitch-primary transition-colors">
                      {tx.contact?.name
                        ? tx.contact.name.split(" ").map(n => n[0]).join("").slice(0, 2)
                        : "??"
                      }
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-stitch-text">
                        {tx.contact?.name || 'Contacto desconocido'}
                      </p>
                      {tx.message_id ? (
                        <ImageIcon className="h-3.5 w-3.5 text-stitch-primary" />
                      ) : (
                        <MessageSquare className="h-3.5 w-3.5 text-stitch-muted" />
                      )}
                    </div>
                    <p className="text-xs text-stitch-muted">
                      {tx.contact?.phone || tx.method_detail || 'Sin teléfono'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-stitch-text">
                      {formatCurrency(tx.amount, tx.currency)}
                    </p>
                    <p className="text-xs text-stitch-muted">{formatTime(tx.created_at)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Confidence bar - hidden on mobile */}
                    <div className="w-16 hidden lg:block">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 flex-1 rounded-full bg-stitch-surface-elevated overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              confidence >= 0.9 ? "bg-stitch-primary" :
                              confidence >= 0.7 ? "bg-stitch-yellow" : "bg-stitch-red"
                            )}
                            style={{ width: `${confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-stitch-muted font-medium">
                          {tx.confidence_score || 0}%
                        </span>
                      </div>
                    </div>

                    <span className={cn("stitch-badge text-xs", status.className)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">{status.label}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
