import { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Loader2,
  ChevronDown,
  Plus,
  Search,
  CheckCircle,
  Bell,
  CreditCard,
  Settings2,
  Upload,
  X,
  FileImage,
  FileText,
  UserPlus
} from "lucide-react";
import { useCreatePayment, useUpdatePayment } from "@/hooks/usePayments";
import { useContacts } from "@/hooks/useContacts";
import { useAuth } from "@/contexts/AuthContext";
import { useLimitedActions } from "@/hooks/useLimitedActions";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { ContactDialog } from "@/components/contacts/ContactDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Payment = Tables<'payments'>;
type PaymentMethod = 'transfer' | 'cash' | 'deposit' | 'debit' | 'credit' | 'other';

interface ExtendedPayment extends Payment {
  payment_due_date?: string | null;
  auto_remind?: boolean;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: ExtendedPayment | null;
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
  { value: "PEN", label: "Soles (PEN)", symbol: "S/" },
  { value: "USD", label: "Dólares (USD)", symbol: "$" },
  { value: "EUR", label: "Euros (EUR)", symbol: "€" },
  { value: "CLP", label: "Pesos Chilenos (CLP)", symbol: "$" },
  { value: "MXN", label: "Pesos MX (MXN)", symbol: "$" },
  { value: "COP", label: "Pesos CO (COP)", symbol: "$" },
  { value: "ARS", label: "Pesos AR (ARS)", symbol: "$" },
  { value: "BRL", label: "Reales (BRL)", symbol: "R$" },
];

const paymentStatuses: { value: string; label: string; color: string }[] = [
  { value: "confirmed", label: "Confirmado", color: "text-[var(--pt-green)]" },
  { value: "pending", label: "Pendiente", color: "text-yellow-500" },
  { value: "rejected", label: "Rechazado", color: "text-[var(--pt-red)]" },
];

// Color gradients for contact avatars
const avatarGradients = [
  "from-emerald-400 to-teal-600",
  "from-indigo-500 to-purple-600",
  "from-pink-500 to-rose-600",
  "from-amber-400 to-orange-600",
  "from-cyan-400 to-blue-600",
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

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousContactsLength = useRef(contacts?.length || 0);

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
    auto_remind: false,
    notes: "",
  });

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
        due_date: payment.payment_due_date || "",
        auto_remind: payment.auto_remind ?? false,
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
        auto_remind: false,
        notes: "",
      });
    }
    // Reset file when dialog opens/closes
    setAttachedFile(null);
  }, [payment, defaultContactId, open, profile]);

  // Auto-select newly created contact
  useEffect(() => {
    if (contacts && contacts.length > previousContactsLength.current) {
      // A new contact was added, select it (it's the first one as they're sorted by created_at desc)
      const newestContact = contacts[0];
      if (newestContact) {
        setFormData(prev => ({ ...prev, contact_id: newestContact.id }));
      }
    }
    previousContactsLength.current = contacts?.length || 0;
  }, [contacts]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo es muy grande. Máximo 5MB.");
        return;
      }
      setAttachedFile(file);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (paymentId: string): Promise<string | null> => {
    if (!attachedFile) return null;

    try {
      setUploadingFile(true);
      const fileExt = attachedFile.name.split('.').pop();
      const fileName = `${paymentId}-${Date.now()}.${fileExt}`;
      const filePath = `payment-receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, attachedFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error("Error al subir el comprobante");
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Error al subir el comprobante");
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

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
        // Upload file first if attached
        let receiptUrl: string | null = null;
        if (attachedFile) {
          receiptUrl = await uploadFile(payment.id);
        }

        // Update payment with receipt URL in notes if uploaded
        const notesWithReceipt = receiptUrl
          ? `{{RECEIPT:${receiptUrl}}}${paymentData.notes || ''}`
          : paymentData.notes;

        await updatePayment.mutateAsync({
          id: payment.id,
          ...paymentData,
          notes: notesWithReceipt,
        });

        onOpenChange(false);
      } else {
        const result = await checkAndExecute("paymentsPerMonth", async () => {
          const newPayment = await createPayment.mutateAsync(paymentData);

          // Upload file if attached and update notes with receipt URL
          if (attachedFile && newPayment?.id) {
            const receiptUrl = await uploadFile(newPayment.id);
            if (receiptUrl) {
              // Update the payment with the receipt URL in notes
              const notesWithReceipt = `{{RECEIPT:${receiptUrl}}}${paymentData.notes || ''}`;
              await updatePayment.mutateAsync({
                id: newPayment.id,
                notes: notesWithReceipt,
              });
            }
          }

          return newPayment;
        });
        if (result) {
          onOpenChange(false);
        }
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isPending = createPayment.isPending || updatePayment.isPending || uploadingFile;

  const currencySymbol = currencies.find(c => c.value === formData.currency)?.symbol || "S/";
  const statusIcon = formData.status === "confirmed" ? "text-[var(--pt-green)]" : formData.status === "pending" ? "text-yellow-500" : "text-[var(--pt-red)]";

  // Filtered contacts for search
  const filteredContacts = contacts?.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  // Recent contacts (first 5)
  const recentContacts = contacts?.slice(0, 5) || [];

  const getFileIcon = () => {
    if (!attachedFile) return null;
    const ext = attachedFile.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-8 h-8 text-red-400" />;
    return <FileImage className="w-8 h-8 text-blue-400" />;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[95vh] rounded-t-3xl p-0 bg-[var(--pt-bg)] border-t border-white/10 flex flex-col overflow-hidden [&>button]:hidden"
      >
        <SheetTitle className="sr-only">
          {isEditing ? "Editar Pago" : "Registrar Pago"}
        </SheetTitle>
        <SheetDescription className="sr-only">
          {isEditing ? "Formulario para editar un pago existente" : "Formulario para registrar un nuevo pago"}
        </SheetDescription>

        {/* Header */}
        <header className="sticky top-0 z-30 bg-[var(--pt-bg)]/95 backdrop-blur-md border-b border-white/5 px-5 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-white">
            {isEditing ? "Editar Pago" : "Registrar Pago"}
          </h1>
          <div className="w-10" /> {/* Spacer para centrar el título */}
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-32">
          <form id="payment-form" onSubmit={handleSubmit} className="px-5 pt-6 space-y-6">

            {/* Contact Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                  Contacto
                </label>
                <button
                  type="button"
                  onClick={() => setShowContactSearch(!showContactSearch)}
                  className="w-10 h-10 rounded-full bg-[var(--pt-green)]/20 flex items-center justify-center text-[var(--pt-green)] hover:bg-[var(--pt-green)]/30 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {/* Contact Search Input */}
              {showContactSearch && (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Buscar contacto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[var(--pt-card)] text-white border-none rounded-2xl py-3 px-4 text-sm placeholder-gray-500 focus:ring-2 focus:ring-[var(--pt-green)] outline-none"
                  />
                  {searchTerm && filteredContacts && filteredContacts.length > 0 && (
                    <div className="mt-2 bg-[var(--pt-card)] rounded-2xl overflow-hidden border border-white/5">
                      {filteredContacts.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, contact_id: contact.id });
                            setSearchTerm("");
                            setShowContactSearch(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                        >
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradients[contact.name.charCodeAt(0) % avatarGradients.length]} flex items-center justify-center text-white font-bold`}>
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{contact.name}</p>
                            <p className="text-gray-400 text-xs">{contact.phone}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Contact Avatars Carousel */}
              <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-2 items-start">
                {/* Nuevo Contacto Button */}
                <button
                  type="button"
                  className="flex flex-col items-center space-y-2 flex-shrink-0 cursor-pointer group min-w-[64px]"
                  onClick={() => setShowContactDialog(true)}
                >
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center group-hover:border-[var(--pt-green)] group-hover:bg-[var(--pt-green)]/10 transition-colors bg-[var(--pt-card)]/50">
                    <UserPlus className="w-6 h-6 text-gray-400 group-hover:text-[var(--pt-green)] transition-colors" />
                  </div>
                  <span className="text-xs font-medium text-gray-400 group-hover:text-[var(--pt-green)]">Nuevo</span>
                </button>

                {/* Recent Contacts */}
                {recentContacts.map((contact, index) => (
                  <button
                    type="button"
                    key={contact.id}
                    className="flex flex-col items-center space-y-2 flex-shrink-0 cursor-pointer min-w-[64px]"
                    onClick={() => setFormData({ ...formData, contact_id: contact.id })}
                  >
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${avatarGradients[index % avatarGradients.length]} flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ${formData.contact_id === contact.id ? 'ring-[var(--pt-green)]' : 'ring-transparent'} hover:ring-[var(--pt-green)] transition-all relative`}>
                      {contact.name.charAt(0).toUpperCase()}
                      {formData.contact_id === contact.id && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-[var(--pt-green)] border-2 border-[var(--pt-bg)] rounded-full" />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${formData.contact_id === contact.id ? 'text-white' : 'text-gray-400'}`}>
                      {contact.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Amount Section */}
            <section>
              <label className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-3 block">
                Monto
              </label>
              <div className="bg-[var(--pt-card)] rounded-3xl p-2 flex items-center justify-between border border-white/5 focus-within:border-[var(--pt-green)]/50 focus-within:ring-4 focus-within:ring-[var(--pt-green)]/10 transition-all">
                <div className="relative group">
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    disabled={isPending}
                    className="appearance-none bg-[var(--pt-surface)] text-white font-bold py-3 pl-4 pr-10 rounded-2xl focus:outline-none cursor-pointer hover:bg-white/10 transition-colors border-none"
                    style={{ backgroundColor: 'var(--pt-surface)' }}
                  >
                    {currencies.map((curr) => (
                      <option key={curr.value} value={curr.value} className="bg-[#1a2c24]">{curr.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500 w-4 h-4" />
                </div>
                <div className="flex-1 ml-4 relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-500 pointer-events-none">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    disabled={isPending}
                    className="w-full text-right bg-transparent border-none text-4xl font-bold text-white placeholder-gray-600 focus:ring-0 p-0 outline-none h-14"
                  />
                </div>
              </div>
            </section>

            {/* Method & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-2 block">
                  Método
                </label>
                <div className="relative">
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value as PaymentMethod })}
                    disabled={isPending}
                    className="w-full appearance-none bg-[var(--pt-card)] text-white py-4 pl-4 pr-10 rounded-2xl border-none focus:ring-2 focus:ring-[var(--pt-green)] text-sm cursor-pointer"
                    style={{ backgroundColor: 'var(--pt-card)' }}
                  >
                    <option value="" className="bg-[#1a2c24]">Seleccionar</option>
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value} className="bg-[#1a2c24]">{method.label}</option>
                    ))}
                  </select>
                  <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500 w-5 h-5" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-2 block">
                  Estado
                </label>
                <div className="relative">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={isPending}
                    className="w-full appearance-none bg-[var(--pt-card)] text-white py-4 pl-4 pr-10 rounded-2xl border-none focus:ring-2 focus:ring-[var(--pt-green)] text-sm cursor-pointer"
                    style={{ backgroundColor: 'var(--pt-card)' }}
                  >
                    {paymentStatuses.map((status) => (
                      <option key={status.value} value={status.value} className="bg-[#1a2c24]">{status.label}</option>
                    ))}
                  </select>
                  <CheckCircle className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none w-5 h-5 ${statusIcon}`} />
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-2 block">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  disabled={isPending}
                  className="w-full bg-[var(--pt-card)] text-white border-transparent focus:border-[var(--pt-green)] focus:ring-0 rounded-2xl py-4 px-4 text-sm cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                  style={{ backgroundColor: 'var(--pt-card)' }}
                />
              </div>
              <div>
                <label className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-2 block">
                  Hora
                </label>
                <input
                  type="time"
                  value={formData.payment_time}
                  onChange={(e) => setFormData({ ...formData, payment_time: e.target.value })}
                  disabled={isPending}
                  className="w-full bg-[var(--pt-card)] text-white border-transparent focus:border-[var(--pt-green)] focus:ring-0 rounded-2xl py-4 px-4 text-sm cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                  style={{ backgroundColor: 'var(--pt-card)' }}
                />
              </div>
            </div>

            {/* Due Date & Auto Remind */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-2 block">
                  Vencimiento
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  disabled={isPending}
                  className="w-full bg-[var(--pt-card)] text-white border-transparent focus:border-[var(--pt-green)] focus:ring-0 rounded-2xl py-4 px-4 text-sm cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                  style={{ backgroundColor: 'var(--pt-card)' }}
                />
              </div>
              <div>
                <label className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-2 block">
                  Recordatorio
                </label>
                <div className="flex items-center justify-between bg-[var(--pt-card)] p-3.5 rounded-2xl h-[54px] w-full">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">Automático</span>
                  </div>
                  <Switch
                    checked={formData.auto_remind}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_remind: checked })}
                    disabled={isPending}
                    className="data-[state=checked]:bg-[var(--pt-green)]"
                  />
                </div>
              </div>
            </div>

            {/* Bank & Account */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-2 block">
                  Banco
                </label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="Ej. BCP"
                  disabled={isPending}
                  className="w-full bg-[var(--pt-card)] text-white border-transparent focus:border-[var(--pt-green)] focus:ring-0 rounded-2xl py-4 px-4 text-sm placeholder-gray-500"
                  style={{ backgroundColor: 'var(--pt-card)' }}
                />
              </div>
              <div>
                <label className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-2 block">
                  N° Cuenta (4)
                </label>
                <input
                  type="tel"
                  maxLength={4}
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="1234"
                  disabled={isPending}
                  className="w-full bg-[var(--pt-card)] text-white border-transparent focus:border-[var(--pt-green)] focus:ring-0 rounded-2xl py-4 px-4 text-sm placeholder-gray-500 text-center tracking-widest"
                  style={{ backgroundColor: 'var(--pt-card)' }}
                />
              </div>
            </div>

            {/* Reference & Detail */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-2 block">
                  N° Operación
                </label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  placeholder="000123"
                  disabled={isPending}
                  className="w-full bg-[var(--pt-card)] text-white border-transparent focus:border-[var(--pt-green)] focus:ring-0 rounded-2xl py-4 px-4 text-sm placeholder-gray-500"
                  style={{ backgroundColor: 'var(--pt-card)' }}
                />
              </div>
              <div>
                <label className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-2 block">
                  Detalle del método
                </label>
                <input
                  type="text"
                  value={formData.method_detail}
                  onChange={(e) => setFormData({ ...formData, method_detail: e.target.value })}
                  placeholder="Cta. Ahorro, Cte..."
                  disabled={isPending}
                  className="w-full bg-[var(--pt-card)] text-white border-transparent focus:border-[var(--pt-green)] focus:ring-0 rounded-2xl py-4 px-4 text-sm placeholder-gray-500"
                  style={{ backgroundColor: 'var(--pt-card)' }}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-2 block">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Agregar detalles adicionales..."
                disabled={isPending}
                rows={3}
                className="w-full bg-[var(--pt-card)] text-white border-transparent focus:border-[var(--pt-green)] focus:ring-0 rounded-2xl py-3 px-4 text-sm placeholder-gray-500 resize-none"
                style={{ backgroundColor: 'var(--pt-card)' }}
              />
            </div>

            {/* Advanced Options */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="mb-12">
              <CollapsibleTrigger className="w-full bg-[var(--pt-card)] rounded-2xl border border-white/5 overflow-hidden">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors">
                  <span className="text-xs font-bold tracking-wider text-gray-400 uppercase flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    Opciones Avanzadas
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transform transition-transform duration-300 ${advancedOpen ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-[var(--pt-card)] rounded-b-2xl border-t border-white/5 p-5 -mt-2">
                <label className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-3 block">
                  Comprobante de Pago
                </label>

                {attachedFile ? (
                  // File attached preview
                  <div className="relative w-full p-4 border-2 border-[var(--pt-green)] rounded-3xl bg-[var(--pt-green)]/10">
                    <button
                      type="button"
                      onClick={removeAttachedFile}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[var(--pt-surface)] flex items-center justify-center">
                        {getFileIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{attachedFile.name}</p>
                        <p className="text-gray-400 text-sm">{(attachedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Upload area
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-600 rounded-3xl cursor-pointer bg-[var(--pt-card)]/30 hover:bg-white/5 hover:border-[var(--pt-green)] transition-all group/upload">
                    <div className="flex flex-col items-center justify-center pt-2">
                      <div className="w-12 h-12 rounded-full bg-[var(--pt-green)]/10 flex items-center justify-center mb-3 group-hover/upload:scale-110 transition-transform duration-300">
                        <Upload className="w-6 h-6 text-[var(--pt-green)]" />
                      </div>
                      <p className="text-sm font-semibold text-gray-200">Adjuntar archivo</p>
                      <p className="text-xs text-gray-400 mt-1">Soporta: JPG, PNG, PDF (máx. 5MB)</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </CollapsibleContent>
            </Collapsible>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[var(--pt-bg)] via-[var(--pt-bg)] to-transparent pt-12 z-40">
          <div className="max-w-md mx-auto w-full grid grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="col-span-1 py-4 rounded-2xl font-bold text-gray-400 hover:text-white bg-[var(--pt-card)] border border-white/5 active:scale-95 transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="payment-form"
              disabled={isPending || !formData.amount}
              className="col-span-2 bg-[var(--pt-green)] hover:bg-[var(--pt-green)]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-[var(--pt-green)]/30 flex items-center justify-center gap-2 transition-transform transform active:scale-95 text-lg"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              <span>{isPending ? (isEditing ? "Guardando..." : "Registrando...") : (isEditing ? "Guardar" : "Registrar pago")}</span>
            </button>
          </div>
        </div>
      </SheetContent>

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

      {/* Contact Dialog for creating new contacts */}
      <ContactDialog
        open={showContactDialog}
        onOpenChange={setShowContactDialog}
      />
    </Sheet>
  );
}
