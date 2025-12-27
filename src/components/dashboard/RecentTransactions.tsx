import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, MessageSquare, ImageIcon, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRecentTransactions } from "@/hooks/useDashboard";
import { useNavigate } from "react-router-dom";
import { PaymentStatus } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const statusConfig: Record<PaymentStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  confirmed: {
    label: "Confirmado",
    icon: CheckCircle2,
    className: "bg-success/10 text-success border-success/20",
  },
  pending: {
    label: "Pendiente",
    icon: Clock,
    className: "bg-warning/10 text-warning border-warning/20",
  },
  rejected: {
    label: "Rechazado",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    className: "bg-muted/10 text-muted-foreground border-muted/20",
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
    <div className="rounded-xl bg-card border border-border shadow-card animate-slide-up" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Transacciones Recientes</h3>
          <p className="text-sm text-muted-foreground">Últimos pagos detectados vía WhatsApp</p>
        </div>
        <button
          onClick={() => navigate('/payments')}
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Ver todos →
        </button>
      </div>

      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No hay transacciones recientes</p>
            <p className="text-xs text-muted-foreground mt-1">Las transacciones aparecerán aquí cuando se detecten pagos</p>
          </div>
        ) : (
          transactions.map((tx, index) => {
            const status = statusConfig[tx.status];
            const StatusIcon = status.icon;
            const confidence = (tx.confidence_score || 0) / 100;

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors animate-fade-in cursor-pointer"
                style={{ animationDelay: `${(index + 1) * 50}ms` }}
                onClick={() => navigate(`/payments?id=${tx.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    <span className="text-sm font-semibold text-foreground">
                      {tx.contact?.name
                        ? tx.contact.name.split(" ").map(n => n[0]).join("").slice(0, 2)
                        : "??"
                      }
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {tx.contact?.name || 'Contacto desconocido'}
                      </p>
                      {tx.message_id ? (
                        <ImageIcon className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tx.contact?.phone || tx.method_detail || 'Sin teléfono'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(tx.amount, tx.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatTime(tx.created_at)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-16">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              confidence >= 0.9 ? "bg-success" :
                              confidence >= 0.7 ? "bg-warning" : "bg-destructive"
                            )}
                            style={{ width: `${confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {tx.confidence_score || 0}%
                        </span>
                      </div>
                    </div>

                    <Badge variant="outline" className={cn("gap-1", status.className)}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
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
