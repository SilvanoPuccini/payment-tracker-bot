import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, X, ChevronRight, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePaymentPromises } from "@/hooks/useSupabaseData";
import { formatDistanceToNow, isPast, isToday, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface OverduePromise {
  id: string;
  promised_date: string;
  promised_amount: number;
  currency: string;
  contacts: {
    name: string | null;
    phone: string;
  } | null;
}

export function OverduePromisesAlert() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [hasShownToast, setHasShownToast] = useState(false);

  const { data: promises } = usePaymentPromises({ status: "pending" });

  // Filter overdue and near-due promises
  const overduePromises: OverduePromise[] = [];
  const nearDuePromises: OverduePromise[] = [];

  promises?.forEach((promise) => {
    const promiseDate = new Date(promise.promised_date);
    if (isPast(promiseDate) && !isToday(promiseDate)) {
      overduePromises.push(promise as unknown as OverduePromise);
    } else if (isToday(promiseDate) || promiseDate <= addDays(new Date(), 2)) {
      nearDuePromises.push(promise as unknown as OverduePromise);
    }
  });

  const totalAlerts = overduePromises.length + nearDuePromises.length;

  // Show toast notification once when there are overdue promises
  useEffect(() => {
    if (!hasShownToast && overduePromises.length > 0) {
      toast.warning(
        `Tienes ${overduePromises.length} promesa${overduePromises.length > 1 ? "s" : ""} de pago vencida${overduePromises.length > 1 ? "s" : ""}`,
        {
          description: "Revisa la sección de promesas para dar seguimiento",
          action: {
            label: "Ver promesas",
            onClick: () => navigate("/promises"),
          },
          duration: 8000,
        }
      );
      setHasShownToast(true);
    }
  }, [overduePromises.length, hasShownToast, navigate]);

  // Don't render if dismissed or no alerts
  if (dismissed || totalAlerts === 0) {
    return null;
  }

  const formatCurrency = (amount: number, currency: string = "PEN") => {
    const symbols: Record<string, string> = {
      PEN: "S/",
      USD: "$",
      ARS: "$",
      MXN: "$",
      COP: "$",
    };
    return `${symbols[currency] || currency} ${amount.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="animate-slide-up">
      {/* Overdue promises alert - high priority */}
      {overduePromises.length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-destructive">
                    {overduePromises.length} Promesa{overduePromises.length > 1 ? "s" : ""} Vencida{overduePromises.length > 1 ? "s" : ""}
                  </h4>
                  <Badge variant="destructive" className="text-xs">
                    Requiere acción
                  </Badge>
                </div>
                <div className="mt-2 space-y-1">
                  {overduePromises.slice(0, 3).map((promise) => (
                    <div key={promise.id} className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {promise.contacts?.name || promise.contacts?.phone}
                      </span>
                      {" - "}
                      <span className="text-destructive font-medium">
                        {formatCurrency(promise.promised_amount, promise.currency)}
                      </span>
                      {" (vencida hace "}
                      {formatDistanceToNow(new Date(promise.promised_date), { locale: es })}
                      {")"}
                    </div>
                  ))}
                  {overduePromises.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      y {overduePromises.length - 3} más...
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => navigate("/promises")}
              >
                Ver todas
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => setDismissed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Near-due promises alert - medium priority */}
      {nearDuePromises.length > 0 && overduePromises.length === 0 && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-warning">
                    {nearDuePromises.length} Promesa{nearDuePromises.length > 1 ? "s" : ""} Próxima{nearDuePromises.length > 1 ? "s" : ""} a Vencer
                  </h4>
                  <Badge className="text-xs bg-warning/20 text-warning border-warning/30">
                    Atención
                  </Badge>
                </div>
                <div className="mt-2 space-y-1">
                  {nearDuePromises.slice(0, 3).map((promise) => (
                    <div key={promise.id} className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {promise.contacts?.name || promise.contacts?.phone}
                      </span>
                      {" - "}
                      <span className="text-warning font-medium">
                        {formatCurrency(promise.promised_amount, promise.currency)}
                      </span>
                      {" ("}
                      {isToday(new Date(promise.promised_date))
                        ? "vence hoy"
                        : `vence ${formatDistanceToNow(new Date(promise.promised_date), { locale: es, addSuffix: true })}`}
                      {")"}
                    </div>
                  ))}
                  {nearDuePromises.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      y {nearDuePromises.length - 3} más...
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-warning/50 text-warning hover:bg-warning/10"
                onClick={() => navigate("/promises")}
              >
                Ver promesas
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => setDismissed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Combined small alert when both types exist */}
      {nearDuePromises.length > 0 && overduePromises.length > 0 && (
        <div className="rounded-lg border border-warning/50 bg-warning/5 p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-warning" />
              <span className="text-sm">
                <span className="font-medium text-warning">
                  {nearDuePromises.length} promesa{nearDuePromises.length > 1 ? "s" : ""}
                </span>{" "}
                próxima{nearDuePromises.length > 1 ? "s" : ""} a vencer
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => navigate("/promises")}
            >
              Ver todas
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
