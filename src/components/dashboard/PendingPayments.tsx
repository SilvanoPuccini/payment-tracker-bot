import { AlertTriangle, ArrowRight, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePendingPromises } from "@/hooks/useSupabaseData";
import { formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";

const priorityConfig = {
  critical: {
    className: "border-destructive/50 bg-destructive/5",
    badge: "bg-destructive text-destructive-foreground",
    label: "Vencido",
  },
  high: {
    className: "border-warning/50 bg-warning/5",
    badge: "bg-warning text-warning-foreground",
    label: "Hoy",
  },
  medium: {
    className: "border-muted-foreground/30 bg-muted/30",
    badge: "bg-muted text-muted-foreground",
    label: "Próximo",
  },
};

export function PendingPayments() {
  const { data: promises, isLoading } = usePendingPromises(5);

  const formatCurrency = (amount: number | null, currency: string = "PEN") => {
    if (!amount) return "-";
    const symbols: Record<string, string> = {
      PEN: "S/",
      USD: "$",
      ARS: "$",
      MXN: "$",
      COP: "$",
    };
    return `${symbols[currency] || currency} ${amount.toLocaleString("es-PE", {
      minimumFractionDigits: 0,
    })}`;
  };

  const getDateInfo = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) {
      const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      return { text: `Hace ${days} día${days > 1 ? 's' : ''}`, priority: 'critical' as const };
    }
    if (isToday(date)) {
      return { text: 'Vence hoy', priority: 'high' as const };
    }
    if (isTomorrow(date)) {
      return { text: 'Vence mañana', priority: 'medium' as const };
    }
    return {
      text: `En ${formatDistanceToNow(date, { locale: es })}`,
      priority: 'medium' as const
    };
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="rounded-xl bg-card border border-border shadow-card animate-slide-up" style={{ animationDelay: "250ms" }}>
      <div className="flex items-center justify-between border-b border-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Promesas de Pago</h3>
            <p className="text-sm text-muted-foreground">Requieren seguimiento</p>
          </div>
        </div>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-warning/20 px-2 text-xs font-bold text-warning">
          {promises?.length || 0}
        </span>
      </div>

      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !promises?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No hay promesas pendientes</p>
          </div>
        ) : (
          promises.map((promise, index) => {
            const dateInfo = getDateInfo(promise.promised_date);
            const priorityStyle = priorityConfig[dateInfo.priority];

            return (
              <div
                key={promise.id}
                className={cn(
                  "flex items-center justify-between p-4 transition-colors hover:bg-secondary/30 animate-fade-in",
                  dateInfo.priority === "critical" && "bg-destructive/5"
                )}
                style={{ animationDelay: `${(index + 1) * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    <span className="text-sm font-semibold text-foreground">
                      {getInitials(promise.contacts?.name)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {promise.contacts?.name || "Sin nombre"}
                    </p>
                    <p className="text-xs text-muted-foreground">{dateInfo.text}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(promise.amount, promise.currency)}
                    </p>
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", priorityStyle.badge)}>
                      {priorityStyle.label}
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
        <Button variant="outline" className="w-full" asChild>
          <Link to="/payments">Ver todos los pendientes</Link>
        </Button>
      </div>
    </div>
  );
}
