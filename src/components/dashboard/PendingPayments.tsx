import { AlertTriangle, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { usePendingPayments } from "@/hooks/useDashboard";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

const getPriority = (createdAt: string) => {
  const days = differenceInDays(new Date(), new Date(createdAt));
  if (days >= 3) return "critical";
  if (days >= 1) return "high";
  return "medium";
};

const priorityConfig = {
  critical: {
    className: "border-stitch-red/50 bg-stitch-red/5",
    badge: "bg-stitch-red/15 text-stitch-red",
    label: "Crítico",
  },
  high: {
    className: "border-stitch-yellow/50 bg-stitch-yellow/5",
    badge: "bg-stitch-yellow/15 text-stitch-yellow",
    label: "Alto",
  },
  medium: {
    className: "border-stitch-muted/30 bg-stitch-surface-elevated/30",
    badge: "bg-stitch-surface-elevated text-stitch-muted",
    label: "Medio",
  },
};

export function PendingPayments() {
  const { data: payments, isLoading } = usePendingPayments();
  const navigate = useNavigate();

  const formatCurrency = (amount: number, currency: string = 'PEN') => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="stitch-card animate-slide-up" style={{ animationDelay: "250ms" }}>
      <div className="flex items-center justify-between border-b border-stitch pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stitch-yellow/15">
            <AlertTriangle className="h-5 w-5 text-stitch-yellow" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stitch-text">Pendientes</h3>
            <p className="text-sm text-stitch-muted">Requieren seguimiento</p>
          </div>
        </div>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-stitch-yellow/15 px-2 text-xs font-bold text-stitch-yellow">
          {payments?.length || 0}
        </span>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-stitch-surface-elevated/50">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl bg-stitch-surface-elevated" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-stitch-surface-elevated" />
                    <Skeleton className="h-3 w-16 bg-stitch-surface-elevated" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16 bg-stitch-surface-elevated" />
              </div>
            ))}
          </div>
        ) : !payments || payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-stitch-surface-elevated flex items-center justify-center mb-4">
              <Clock className="h-7 w-7 text-stitch-primary" />
            </div>
            <p className="text-stitch-text font-medium">¡Todo al día!</p>
            <p className="text-sm text-stitch-muted mt-1">No hay pagos pendientes</p>
          </div>
        ) : (
          payments.slice(0, 5).map((payment, index) => {
            const priorityKey = getPriority(payment.created_at);
            const priority = priorityConfig[priorityKey];
            const timeAgo = formatDistanceToNow(new Date(payment.created_at), { addSuffix: true, locale: es });

            return (
              <div
                key={payment.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-stitch-surface-elevated animate-fade-in cursor-pointer group",
                  priorityKey === "critical" && "bg-stitch-red/5"
                )}
                style={{ animationDelay: `${(index + 1) * 50}ms` }}
                onClick={() => navigate(`/payments?id=${payment.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stitch-surface-elevated group-hover:bg-stitch-primary/15 transition-colors">
                    <span className="text-sm font-semibold text-stitch-text group-hover:text-stitch-primary transition-colors">
                      {payment.contact?.name
                        ? payment.contact.name.split(" ").map(n => n[0]).join("").slice(0, 2)
                        : "??"
                      }
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stitch-text">
                      {payment.contact?.name || 'Contacto desconocido'}
                    </p>
                    <p className="text-xs text-stitch-muted">{timeAgo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-stitch-text">
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", priority.badge)}>
                      {priority.label}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-stitch-muted hover:text-stitch-primary hover:bg-stitch-primary/15 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {payments && payments.length > 0 && (
        <div className="border-t border-stitch pt-4 mt-4">
          <Button
            variant="outline"
            className="w-full bg-stitch-surface-elevated border-stitch text-stitch-text hover:bg-stitch-surface hover:text-stitch-primary rounded-xl"
            onClick={() => navigate('/payments?status=pending')}
          >
            Ver todos los pendientes
          </Button>
        </div>
      )}
    </div>
  );
}
