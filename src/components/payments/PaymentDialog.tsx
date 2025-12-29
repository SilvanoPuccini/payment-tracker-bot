import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, DollarSign, CreditCard, Calendar, FileText, Hash, Building2, Bell, CalendarClock } from "lucide-react";
import { useCreatePayment, useUpdatePayment } from "@/hooks/usePayments";
import { useContacts } from "@/hooks/useContacts";
import { useAuth } from "@/contexts/AuthContext";
import { useLimitedActions } from "@/hooks/useLimitedActions";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import type { Tables } from "@/integrations/supabase/types";

type Payment = Tables<'payments'>;
type PaymentMethod = 'transfer' | 'cash' | 'deposit' | 'debit' | 'credit' | 'other';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: Payment | null;
  defaultContactId?: string;
}

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "transfer", label: "Transferencia" },
  { value: "cash", label: "Efectivo" },
  { value: "deposit", label: "Depósito" },
  { value: "debit", label: "Débito" },
  { value: "credit", label: "Crédito" },
  { value: "other", label: "Otro" },
];

const currencies = [
  { value: "PEN", label: "Soles (PEN)" },
  { value: "USD", label: "Dólares (USD)" },
  { value: "EUR", label: "Euros (EUR)" },
  { value: "CLP", label: "Pesos Chilenos (CLP)" },
  { value: "MXN", label: "Pesos MX (MXN)" },
  { value: "COP", label: "Pesos CO (COP)" },
  { value: "ARS", label: "Pesos AR (ARS)" },
  { value: "BRL", label: "Reales (BRL)" },
];

const paymentStatuses: { value: string; label: string }[] = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "rejected", label: "Rechazado" },
  { value: "cancelled", label: "Cancelado" },
];

export function PaymentDialog({ open, onOpenChange, payment, defaultContactId }: PaymentDialogProps) {
  const isEditing = !!payment;
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const { data: contacts } = useContacts();
  const { profile } = useAuth();
  const {
    showUpgradeModal,
    limitReached,
    currentUsage,
    limit,
    checkAndExecute,
    closeUpgradeModal,
  } = useLimitedActions();

  const [formData, setFormData] = useState({
    contact_id: "",
    amount: "",
    currency: "PEN",
    status: "pending" as string,
    method: "" as PaymentMethod | "",
    method_detail: "",
    reference_number: "",
    bank_name: "",
    account_number: "",
    payment_date: "",
    payment_time: "",
    due_date: "",
    auto_remind: true,
    notes: "",
  });

  // Populate form when editing or with default values
  useEffect(() => {
    if (payment) {
      setFormData({
        contact_id: payment.contact_id || "",
        amount: payment.amount?.toString() || "",
        currency: payment.currency || "PEN",
        status: payment.status || "pending",
        method: (payment.method || "") as PaymentMethod | "",
        method_detail: payment.method_detail || "",
        reference_number: payment.reference_number || "",
        bank_name: payment.bank_name || "",
        account_number: payment.account_number || "",
        payment_date: payment.payment_date || "",
        payment_time: payment.payment_time || "",
        due_date: (payment as any).payment_due_date || "",
        auto_remind: (payment as any).auto_remind ?? true,
        notes: payment.notes || "",
      });
    } else {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      setFormData({
        contact_id: defaultContactId || "",
        amount: "",
        currency: profile?.currency || "PEN",
        status: "pending",
        method: "",
        method_detail: "",
        reference_number: "",
        bank_name: "",
        account_number: "",
        payment_date: today,
        payment_time: now,
        due_date: "",
        auto_remind: true,
        notes: "",
      });
    }
  }, [payment, defaultContactId, open, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const paymentData = {
      contact_id: formData.contact_id || null,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      status: formData.status,
      method: formData.method || null,
      method_detail: formData.method_detail || null,
      reference_number: formData.reference_number || null,
      bank_name: formData.bank_name || null,
      account_number: formData.account_number || null,
      payment_date: formData.payment_date || null,
      payment_time: formData.payment_time || null,
      payment_due_date: formData.due_date || null,
      auto_remind: formData.auto_remind,
      notes: formData.notes || null,
    };

    try {
      if (isEditing && payment) {
        await updatePayment.mutateAsync({
          id: payment.id,
          ...paymentData,
        });
        onOpenChange(false);
      } else {
        // Check limits before creating new payment
        const result = await checkAndExecute("paymentsPerMonth", async () => {
          return await createPayment.mutateAsync(paymentData);
        });
        if (result) {
          onOpenChange(false);
        }
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isPending = createPayment.isPending || updatePayment.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] glass-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {isEditing ? "Editar Pago" : "Registrar Pago"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del pago"
              : "Completa los datos para registrar un nuevo pago"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact */}
          <div className="space-y-2">
            <Label htmlFor="contact">Contacto</Label>
            <Select
              value={formData.contact_id || "none"}
              onValueChange={(value) => setFormData({ ...formData, contact_id: value === "none" ? "" : value })}
              disabled={isPending}
            >
              <SelectTrigger disabled={isPending}>
                <SelectValue placeholder="Seleccionar contacto (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin contacto</SelectItem>
                {contacts?.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} - {contact.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Monto *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
                disabled={isPending}
              >
                <SelectTrigger disabled={isPending}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Method & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="method" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Método de pago
              </Label>
              <Select
                value={formData.method}
                onValueChange={(value: PaymentMethod) => setFormData({ ...formData, method: value })}
                disabled={isPending}
              >
                <SelectTrigger disabled={isPending}>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: string) => setFormData({ ...formData, status: value })}
                disabled={isPending}
              >
                <SelectTrigger disabled={isPending}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Fecha del pago
              </Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_time">Hora del pago</Label>
              <Input
                id="payment_time"
                type="time"
                value={formData.payment_time}
                onChange={(e) => setFormData({ ...formData, payment_time: e.target.value })}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Due Date & Auto Remind */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date" className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                Fecha de vencimiento
              </Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Recordatorio automatico
              </Label>
              <div className="flex items-center gap-3 h-10">
                <Switch
                  id="auto_remind"
                  checked={formData.auto_remind}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_remind: checked })}
                  disabled={isPending || !formData.due_date}
                />
                <Label htmlFor="auto_remind" className="text-sm text-muted-foreground font-normal">
                  {formData.auto_remind && formData.due_date ? 'Activado' : 'Desactivado'}
                </Label>
              </div>
            </div>
          </div>

          {/* Reference & Bank */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference_number" className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                N° Operación
              </Label>
              <Input
                id="reference_number"
                placeholder="12345678"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_name" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Banco
              </Label>
              <Input
                id="bank_name"
                placeholder="BCP, BBVA, etc."
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Account Number & Method Detail */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_number">N° Cuenta (últimos 4)</Label>
              <Input
                id="account_number"
                placeholder="4532"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method_detail">Detalle del método</Label>
              <Input
                id="method_detail"
                placeholder="Cuenta corriente, ahorros..."
                value={formData.method_detail}
                onChange={(e) => setFormData({ ...formData, method_detail: e.target.value })}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Notas
            </Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales sobre el pago..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              disabled={isPending}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="gradient-primary text-primary-foreground"
              disabled={isPending || !formData.amount}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Guardando..." : "Registrando..."}
                </>
              ) : isEditing ? (
                "Guardar cambios"
              ) : (
                "Registrar pago"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Upgrade Modal */}
      {limitReached && (
        <UpgradeModal
          open={showUpgradeModal}
          onClose={closeUpgradeModal}
          limitReached={limitReached}
          currentUsage={currentUsage}
          limit={limit}
        />
      )}
    </Dialog>
  );
}
