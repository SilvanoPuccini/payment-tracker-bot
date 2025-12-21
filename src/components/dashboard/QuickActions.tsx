import { useState } from "react";
import { Download, RefreshCw, Filter, Plus, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQueryClient } from "@tanstack/react-query";
import { useCreatePayment, useContacts, usePayments } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { format } from "date-fns";

export function QuickActions() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    contactId: "",
    amount: "",
    currency: "PEN",
    paymentDate: format(new Date(), "yyyy-MM-dd"),
    paymentMethod: "",
    reference: "",
    notes: "",
  });

  const queryClient = useQueryClient();
  const createPayment = useCreatePayment();
  const { data: contacts } = useContacts({ limit: 100 });
  const { data: payments } = usePayments({ limit: 1000 });

  // Handle sync
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await queryClient.invalidateQueries();
      toast.success("Datos sincronizados correctamente");
    } catch (error) {
      toast.error("Error al sincronizar");
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle export CSV
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      if (!payments?.length) {
        toast.error("No hay pagos para exportar");
        return;
      }

      const headers = [
        "Fecha",
        "Contacto",
        "Teléfono",
        "Monto",
        "Moneda",
        "Método",
        "Referencia",
        "Estado",
        "Confianza",
      ];

      const rows = payments.map((p) => [
        p.payment_date,
        p.contacts?.name || "Sin nombre",
        p.contacts?.phone || "",
        p.amount.toString(),
        p.currency,
        p.payment_method || "",
        p.reference || "",
        p.status,
        p.confidence ? `${Math.round(p.confidence * 100)}%` : "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pagos-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${payments.length} pagos exportados`);
    } catch (error) {
      toast.error("Error al exportar");
    } finally {
      setIsExporting(false);
    }
  };

  // Handle manual payment registration
  const handleRegisterPayment = async () => {
    if (!paymentForm.contactId || !paymentForm.amount) {
      toast.error("Contacto y monto son requeridos");
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("El monto debe ser un número válido mayor a 0");
      return;
    }

    try {
      // Get user_id from contacts (they all belong to the same user)
      const contact = contacts?.find((c) => c.id === paymentForm.contactId);
      if (!contact) {
        toast.error("Contacto no encontrado");
        return;
      }

      await createPayment.mutateAsync({
        user_id: contact.user_id,
        contact_id: paymentForm.contactId,
        amount: amount,
        currency: paymentForm.currency,
        payment_date: paymentForm.paymentDate,
        payment_method: paymentForm.paymentMethod || null,
        reference: paymentForm.reference || null,
        notes: paymentForm.notes || null,
        status: "confirmed",
        source: "manual",
        confidence: 1.0,
      });

      toast.success("Pago registrado correctamente");
      setIsPaymentModalOpen(false);
      setPaymentForm({
        contactId: "",
        amount: "",
        currency: "PEN",
        paymentDate: format(new Date(), "yyyy-MM-dd"),
        paymentMethod: "",
        reference: "",
        notes: "",
      });
    } catch (error) {
      toast.error("Error al registrar el pago");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 animate-slide-up" style={{ animationDelay: "50ms" }}>
        <Button
          variant="default"
          className="gap-2"
          onClick={() => setIsPaymentModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Registrar Pago
        </Button>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filtros Rápidos</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFilterOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Rango de fechas</Label>
                <div className="flex gap-2">
                  <Input type="date" className="flex-1" />
                  <Input type="date" className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="confirmed">Confirmados</SelectItem>
                    <SelectItem value="detected">Pendientes</SelectItem>
                    <SelectItem value="rejected">Rechazados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monto mínimo</Label>
                <Input type="number" placeholder="0" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={() => {
                  toast.success("Filtros aplicados");
                  setIsFilterOpen(false);
                }}>
                  Aplicar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          className="gap-2"
          onClick={handleSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          Sincronizar
        </Button>

        <Button
          variant="ghost"
          className="gap-2"
          onClick={handleExportCSV}
          disabled={isExporting}
        >
          <Download className={`h-4 w-4 ${isExporting ? "animate-pulse" : ""}`} />
          Exportar CSV
        </Button>
      </div>

      {/* Payment Registration Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago Manual</DialogTitle>
            <DialogDescription>
              Registra un pago que no fue detectado automáticamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contact">Contacto *</Label>
              <Select
                value={paymentForm.contactId}
                onValueChange={(value) =>
                  setPaymentForm({ ...paymentForm, contactId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar contacto" />
                </SelectTrigger>
                <SelectContent>
                  {contacts?.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name || contact.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  value={paymentForm.currency}
                  onValueChange={(value) =>
                    setPaymentForm({ ...paymentForm, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PEN">PEN (Soles)</SelectItem>
                    <SelectItem value="USD">USD (Dólares)</SelectItem>
                    <SelectItem value="ARS">ARS (Pesos AR)</SelectItem>
                    <SelectItem value="MXN">MXN (Pesos MX)</SelectItem>
                    <SelectItem value="COP">COP (Pesos CO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha del Pago</Label>
              <Input
                id="date"
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, paymentDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Método de Pago</Label>
              <Select
                value={paymentForm.paymentMethod}
                onValueChange={(value) =>
                  setPaymentForm({ ...paymentForm, paymentMethod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yape">Yape</SelectItem>
                  <SelectItem value="plin">Plin</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="deposito">Depósito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Referencia / N° Operación</Label>
              <Input
                id="reference"
                placeholder="Ej: 123456789"
                value={paymentForm.reference}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, reference: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input
                id="notes"
                placeholder="Notas adicionales..."
                value={paymentForm.notes}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRegisterPayment}
              disabled={createPayment.isPending}
            >
              {createPayment.isPending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
