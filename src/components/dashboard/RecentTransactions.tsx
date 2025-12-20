import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, MessageSquare, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const transactions = [
  {
    id: 1,
    contact: "María García",
    phone: "+54 9 11 2345-6789",
    amount: "$45,000",
    status: "confirmed",
    type: "comprobante",
    time: "Hace 5 min",
    confidence: 0.95,
  },
  {
    id: 2,
    contact: "Carlos López",
    phone: "+54 9 11 3456-7890",
    amount: "$12,500",
    status: "pending",
    type: "texto",
    time: "Hace 15 min",
    confidence: 0.78,
  },
  {
    id: 3,
    contact: "Ana Martínez",
    phone: "+54 9 11 4567-8901",
    amount: "$8,200",
    status: "confirmed",
    type: "comprobante",
    time: "Hace 32 min",
    confidence: 0.92,
  },
  {
    id: 4,
    contact: "Roberto Sánchez",
    phone: "+54 9 11 5678-9012",
    amount: "$25,000",
    status: "review",
    type: "texto",
    time: "Hace 1 hora",
    confidence: 0.65,
  },
  {
    id: 5,
    contact: "Laura Fernández",
    phone: "+54 9 11 6789-0123",
    amount: "$150,000",
    status: "confirmed",
    type: "comprobante",
    time: "Hace 2 horas",
    confidence: 0.98,
  },
];

const statusConfig = {
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
  review: {
    label: "Revisión",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export function RecentTransactions() {
  return (
    <div className="rounded-xl bg-card border border-border shadow-card animate-slide-up" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Transacciones Recientes</h3>
          <p className="text-sm text-muted-foreground">Últimos pagos detectados vía WhatsApp</p>
        </div>
        <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          Ver todos →
        </button>
      </div>

      <div className="divide-y divide-border">
        {transactions.map((tx, index) => {
          const status = statusConfig[tx.status as keyof typeof statusConfig];
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
                    {tx.contact.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{tx.contact}</p>
                    {tx.type === "comprobante" ? (
                      <ImageIcon className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{tx.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{tx.amount}</p>
                  <p className="text-xs text-muted-foreground">{tx.time}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-16">
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            tx.confidence >= 0.9 ? "bg-success" :
                            tx.confidence >= 0.7 ? "bg-warning" : "bg-destructive"
                          )}
                          style={{ width: `${tx.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {Math.round(tx.confidence * 100)}%
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
        })}
      </div>
    </div>
  );
}
