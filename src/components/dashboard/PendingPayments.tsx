import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const pendingPayments = [
  {
    id: 1,
    contact: "Diego Ramírez",
    amount: "$75,000",
    dueDate: "Vence hoy",
    daysOverdue: 0,
    priority: "high",
  },
  {
    id: 2,
    contact: "Lucía Mendoza",
    amount: "$32,000",
    dueDate: "Vence mañana",
    daysOverdue: -1,
    priority: "medium",
  },
  {
    id: 3,
    contact: "Fernando Torres",
    amount: "$18,500",
    dueDate: "Hace 3 días",
    daysOverdue: 3,
    priority: "critical",
  },
];

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
          {pendingPayments.length}
        </span>
      </div>

      <div className="divide-y divide-border">
        {pendingPayments.map((payment, index) => {
          const priority = priorityConfig[payment.priority as keyof typeof priorityConfig];

          return (
            <div
              key={payment.id}
              className={cn(
                "flex items-center justify-between p-4 transition-colors hover:bg-secondary/30 animate-fade-in",
                payment.priority === "critical" && "bg-destructive/5"
              )}
              style={{ animationDelay: `${(index + 1) * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                  <span className="text-sm font-semibold text-foreground">
                    {payment.contact.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{payment.contact}</p>
                  <p className="text-xs text-muted-foreground">{payment.dueDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{payment.amount}</p>
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
        })}
      </div>

      <div className="border-t border-border p-4">
        <Button variant="outline" className="w-full">
          Ver todos los pendientes
        </Button>
      </div>
    </div>
  );
}
