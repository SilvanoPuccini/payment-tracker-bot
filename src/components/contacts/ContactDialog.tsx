import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  FileText,
  Star,
  X,
  Check,
  Camera,
  UserPlus,
  ChevronDown,
} from "lucide-react";
import { useCreateContact, useUpdateContact } from "@/hooks/useContacts";
import { useLimitedActions } from "@/hooks/useLimitedActions";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Contact = Tables<'contacts'>;

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
}

// Validation functions
const validateName = (name: string) => {
  if (!name.trim()) return { valid: false, error: "Nombre requerido" };
  if (name.trim().length < 2) return { valid: false, error: "Minimo 2 caracteres" };
  return { valid: true, error: null };
};

const validatePhone = (phone: string) => {
  if (!phone.trim()) return { valid: false, error: "Telefono requerido" };
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) return { valid: false, error: "Numero incompleto" };
  return { valid: true, error: null };
};

const validateEmail = (email: string) => {
  if (!email.trim()) return { valid: true, error: null }; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { valid: false, error: "Email invalido" };
  return { valid: true, error: null };
};

export function ContactDialog({ open, onOpenChange, contact }: ContactDialogProps) {
  const isEditing = !!contact;
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const {
    showUpgradeModal,
    limitReached,
    currentUsage,
    limit,
    checkAndExecute,
    closeUpgradeModal,
  } = useLimitedActions();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
    company: "",
    notes: "",
    status: "active" as string,
    is_starred: false,
  });

  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    email: false,
  });

  // Validation states
  const validations = useMemo(() => ({
    name: validateName(formData.name),
    phone: validatePhone(formData.phone),
    email: validateEmail(formData.email),
  }), [formData.name, formData.phone, formData.email]);

  // Check if form is valid
  const isFormValid = validations.name.valid && validations.phone.valid && validations.email.valid;

  // Populate form when editing
  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || "",
        phone: contact.phone || "",
        email: contact.email || "",
        location: contact.location || "",
        company: contact.company || "",
        notes: contact.notes || "",
        status: contact.status || "active",
        is_starred: contact.is_starred || false,
      });
      setTouched({ name: true, phone: true, email: true });
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        location: "",
        company: "",
        notes: "",
        status: "active",
        is_starred: false,
      });
      setTouched({ name: false, phone: false, email: false });
    }
  }, [contact, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched
    setTouched({ name: true, phone: true, email: true });

    if (!isFormValid) return;

    try {
      if (isEditing && contact) {
        await updateContact.mutateAsync({
          id: contact.id,
          ...formData,
        });
        onOpenChange(false);
      } else {
        const result = await checkAndExecute("contacts", async () => {
          return await createContact.mutateAsync(formData);
        });
        if (result) {
          onOpenChange(false);
        }
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isPending = createContact.isPending || updateContact.isPending;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 bg-[var(--pt-bg)] border-[var(--pt-border)] overflow-hidden max-h-[90vh] flex flex-col" aria-describedby="contact-dialog-description">
        {/* Accessibility - Hidden title and description */}
        <VisuallyHidden>
          <DialogTitle>
            {isEditing ? "Editar Contacto" : "Nuevo Contacto"}
          </DialogTitle>
          <DialogDescription id="contact-dialog-description">
            {isEditing ? "Formulario para modificar los datos del contacto" : "Formulario para crear un nuevo contacto"}
          </DialogDescription>
        </VisuallyHidden>

        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between bg-[var(--pt-bg)]/95 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-[var(--pt-primary)]" />
            <div>
              <h1 className="text-lg font-bold text-white">
                {isEditing ? "Editar Contacto" : "Nuevo Contacto"}
              </h1>
              <p className="text-[10px] text-[var(--pt-text-muted)] uppercase tracking-wider">
                {isEditing ? "MODIFICA LOS DATOS" : "COMPLETA LOS DATOS"}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-[var(--pt-text-muted)] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="px-5 pt-6 pb-6 space-y-5">
            {/* Avatar Section */}
            <div className="flex flex-col items-center justify-center mb-2">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-[var(--pt-surface)] border-2 border-dashed border-[var(--pt-primary)] flex items-center justify-center overflow-hidden">
                  {formData.name ? (
                    <span className="text-3xl font-bold text-[var(--pt-primary)]">
                      {getInitials(formData.name)}
                    </span>
                  ) : (
                    <User className="w-10 h-10 text-[var(--pt-primary)]/60" />
                  )}
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 bg-[var(--pt-primary)] text-white p-2 rounded-full border-4 border-[var(--pt-bg)] shadow-xl flex items-center justify-center hover:bg-[var(--pt-primary-hover)] transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs font-semibold text-[var(--pt-primary)]/80">
                Anadir foto de perfil
              </p>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {/* Name - Full width */}
              <div className="col-span-2 space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--pt-primary)] ml-1">
                  <User className="w-4 h-4" />
                  Nombre *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onBlur={() => setTouched({ ...touched, name: true })}
                    placeholder="Juan Perez"
                    disabled={isPending}
                    className={cn(
                      "w-full pl-4 pr-10 py-3 bg-[var(--pt-surface)] rounded-xl text-white placeholder:text-[var(--pt-text-muted)] transition-all outline-none",
                      touched.name && !validations.name.valid
                        ? "border-2 border-[var(--pt-red)] focus:border-[var(--pt-red)] focus:ring-1 focus:ring-[var(--pt-red)]"
                        : "border border-[var(--pt-primary)] focus:border-[var(--pt-primary)] focus:ring-1 focus:ring-[var(--pt-primary)]"
                    )}
                  />
                  {touched.name && validations.name.valid && formData.name && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pt-primary)]" />
                  )}
                </div>
                {touched.name && validations.name.error && (
                  <p className="text-xs text-[var(--pt-red)] ml-1">{validations.name.error}</p>
                )}
              </div>

              {/* Phone - Full width */}
              <div className="col-span-2 space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--pt-primary)] ml-1">
                  <Phone className="w-4 h-4" />
                  Telefono *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    onBlur={() => setTouched({ ...touched, phone: true })}
                    placeholder="+51 999 888 777"
                    disabled={isPending}
                    className={cn(
                      "w-full pl-4 pr-10 py-3 bg-[var(--pt-surface)] rounded-xl text-white placeholder:text-[var(--pt-text-muted)] transition-all outline-none",
                      touched.phone && !validations.phone.valid
                        ? "border-2 border-[var(--pt-red)] focus:border-[var(--pt-red)] focus:ring-1 focus:ring-[var(--pt-red)]"
                        : "border border-[var(--pt-primary)] focus:border-[var(--pt-primary)] focus:ring-1 focus:ring-[var(--pt-primary)]"
                    )}
                  />
                  {touched.phone && validations.phone.valid && formData.phone && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pt-primary)]" />
                  )}
                </div>
                {touched.phone && validations.phone.error && (
                  <p className="text-xs text-[var(--pt-red)] ml-1">{validations.phone.error}</p>
                )}
              </div>

              {/* Email - Full width */}
              <div className="col-span-2 space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--pt-primary)] ml-1">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onBlur={() => setTouched({ ...touched, email: true })}
                    placeholder="juan@email.com"
                    disabled={isPending}
                    className={cn(
                      "w-full pl-4 pr-10 py-3 bg-[var(--pt-surface)] rounded-xl text-white placeholder:text-[var(--pt-text-muted)] transition-all outline-none",
                      touched.email && !validations.email.valid
                        ? "border-2 border-[var(--pt-red)] focus:border-[var(--pt-red)] focus:ring-1 focus:ring-[var(--pt-red)]"
                        : "border border-[var(--pt-primary)] focus:border-[var(--pt-primary)] focus:ring-1 focus:ring-[var(--pt-primary)]"
                    )}
                  />
                  {touched.email && validations.email.valid && formData.email && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pt-primary)]" />
                  )}
                </div>
                {touched.email && validations.email.error && (
                  <p className="text-xs text-[var(--pt-red)] ml-1">{validations.email.error}</p>
                )}
              </div>

              {/* Location - Half width */}
              <div className="col-span-1 space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--pt-text-secondary)] ml-1">
                  <MapPin className="w-4 h-4" />
                  Ubicacion
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Lima, Peru"
                  disabled={isPending}
                  className="w-full pl-4 pr-4 py-3 bg-[var(--pt-surface)] border border-[var(--pt-border)] focus:border-[var(--pt-primary)] focus:ring-1 focus:ring-[var(--pt-primary)] rounded-xl text-white placeholder:text-[var(--pt-text-muted)] transition-all outline-none"
                />
              </div>

              {/* Company - Half width */}
              <div className="col-span-1 space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--pt-text-secondary)] ml-1">
                  <Building2 className="w-4 h-4" />
                  Empresa
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Empresa SAC"
                  disabled={isPending}
                  className="w-full pl-4 pr-4 py-3 bg-[var(--pt-surface)] border border-[var(--pt-border)] focus:border-[var(--pt-primary)] focus:ring-1 focus:ring-[var(--pt-primary)] rounded-xl text-white placeholder:text-[var(--pt-text-muted)] transition-all outline-none"
                />
              </div>

              {/* Status - Half width */}
              <div className="col-span-1 space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--pt-text-secondary)] ml-1">
                  <FileText className="w-4 h-4" />
                  Estado
                </label>
                <div className="relative">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={isPending}
                    className="w-full pl-4 pr-10 py-3 bg-[var(--pt-surface)] border border-[var(--pt-border)] focus:border-[var(--pt-primary)] focus:ring-1 focus:ring-[var(--pt-primary)] rounded-xl text-white appearance-none transition-all outline-none"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="blocked">Bloqueado</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pt-text-muted)] pointer-events-none" />
                </div>
              </div>

              {/* Starred - Half width */}
              <div className="col-span-1 space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--pt-text-secondary)] ml-1">
                  <Star className="w-4 h-4" />
                  Favorito
                </label>
                <div className="flex items-center h-[50px] px-4 bg-[var(--pt-surface)] border border-[var(--pt-border)] rounded-xl">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <Switch
                      checked={formData.is_starred}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_starred: checked })}
                      disabled={isPending}
                    />
                    <span className={cn(
                      "ml-3 text-xs font-medium",
                      formData.is_starred ? "text-[var(--pt-primary)]" : "text-[var(--pt-text-muted)]"
                    )}>
                      {formData.is_starred ? "Marcado" : "No marcado"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Notes - Full width */}
              <div className="col-span-2 space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--pt-text-secondary)] ml-1">
                  <FileText className="w-4 h-4" />
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={3}
                  disabled={isPending}
                  className="w-full pl-4 pr-4 py-3 bg-[var(--pt-surface)] border border-[var(--pt-border)] focus:border-[var(--pt-primary)] focus:ring-1 focus:ring-[var(--pt-primary)] rounded-xl text-white placeholder:text-[var(--pt-text-muted)] transition-all outline-none resize-none"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="sticky bottom-0 p-5 space-y-3 bg-gradient-to-t from-[var(--pt-bg)] via-[var(--pt-bg)] to-transparent pt-8 border-t border-[var(--pt-border)]">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isPending || !isFormValid}
            className={cn(
              "w-full py-4 font-bold rounded-xl transition-all active:scale-[0.98]",
              isFormValid
                ? "bg-[var(--pt-primary)] text-[var(--pt-bg)] shadow-[0_0_20px_rgba(18,186,102,0.3)]"
                : "bg-[var(--pt-primary)]/50 text-[var(--pt-bg)]/50 cursor-not-allowed"
            )}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {isEditing ? "Guardando..." : "Creando..."}
              </span>
            ) : isEditing ? (
              "Guardar cambios"
            ) : (
              "Crear contacto"
            )}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="w-full py-4 bg-transparent border border-white/10 hover:border-white/20 text-[var(--pt-text-muted)] text-sm font-medium rounded-xl transition-colors"
          >
            Cancelar
          </button>
        </div>
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
