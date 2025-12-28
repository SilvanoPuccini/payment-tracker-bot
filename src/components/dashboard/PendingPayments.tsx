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
    className: "border-destructive/50 bg-destructive/5",
    badge: "bg-destructive text-destructive-foreground",
    label: "Crítico",
  },
  high: {
    className: "border-warning/50 bg-warning/5",
    badge: "bg-warning text-warning-foreground",
    label: "Alto",
  },
  medium: {
    className: "border-muted-foreground/30 bg-muted/30",
    badge: "bg-muted text-muted-foreground",
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
    <div className="rounded-xl bg-card border border-border shadow-card animate-slide-up" style={{ animationDelay: "250ms" }}>
      <div className="flex items-center justify-between border-b border-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Pagos Pendientes</h3>
            <p className="text-sm text-muted-foreground">Requieren seguimiento</p>
          </div>
        </div>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-warning/20 px-2 text-xs font-bold text-warning">
          {payments?.length || 0}
        </span>
      </div>

      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : !payments || payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Clock className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No hay pagos pendientes</p>
            <p className="text-xs text-muted-foreground mt-1">¡Todo está al día!</p>
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
                  "flex items-center justify-between p-4 transition-colors hover:bg-secondary/30 animate-fade-in cursor-pointer",
                  priorityKey === "critical" && "bg-destructive/5"
                )}
                style={{ animationDelay: `${(index + 1) * 50}ms` }}
                onClick={() => navigate(`/payments?id=${payment.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    <span className="text-sm font-semibold text-foreground">
                      {payment.contact?.name
                        ? payment.contact.name.split(" ").map(n => n[0]).join("").slice(0, 2)
                        : "??"
                      }
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {payment.contact?.name || 'Contacto desconocido'}
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", priority.badge)}>
                      {priority.label}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-border p-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/payments?status=pending')}
        >
          Ver todos los pendientes
        </Button>
      </div>
    </div>
  );
}
