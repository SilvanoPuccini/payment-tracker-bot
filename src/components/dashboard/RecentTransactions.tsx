import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, MessageSquare, ImageIcon, RefreshCw, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRecentTransactions } from "@/hooks/useSupabaseData";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";

const statusConfig = {
  confirmed: {
    label: "Confirmado",
    icon: CheckCircle2,
    className: "bg-success/10 text-success border-success/20",
  },
  detected: {
    label: "Pendiente",
    icon: Clock,
    className: "bg-warning/10 text-warning border-warning/20",
  },
  rejected: {
    label: "Rechazado",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  duplicate: {
    label: "Duplicado",
    icon: XCircle,
    className: "bg-muted/50 text-muted-foreground border-muted/50",
  },
};

export function RecentTransactions() {
  const { data: transactions, isLoading } = useRecentTransactions(5);

  const formatCurrency = (amount: number, currency: string = "PEN") => {
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

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: false, locale: es });
    } catch {
      return dateStr;
    }
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
    <div className="rounded-xl bg-card border border-border shadow-card animate-slide-up" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Transacciones Recientes</h3>
          <p className="text-sm text-muted-foreground">Últimos pagos detectados vía WhatsApp</p>
        </div>
        <Link to="/payments" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          Ver todos →
        </Link>
      </div>

      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !transactions?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No hay transacciones recientes</p>
          </div>
        ) : (
          transactions.map((tx, index) => {
            const status = statusConfig[tx.status as keyof typeof statusConfig] || statusConfig.detected;
            const StatusIcon = status.icon;

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors animate-fade-in"
                style={{ animationDelay: `${(index + 1) * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    <span className="text-sm font-semibold text-foreground">
                      {getInitials(tx.contacts?.name)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {tx.contacts?.name || "Sin nombre"}
                      </p>
                      {tx.source === "ocr" ? (
                        <ImageIcon className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{tx.contacts?.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(tx.amount, tx.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">Hace {formatTime(tx.created_at)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {tx.confidence && (
                      <div className="w-16">
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                tx.confidence >= 0.9
                                  ? "bg-success"
                                  : tx.confidence >= 0.7
                                  ? "bg-warning"
                                  : "bg-destructive"
                              )}
                              style={{ width: `${tx.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {Math.round(tx.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    )}

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
