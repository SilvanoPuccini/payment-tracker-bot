import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Users,
  Search,
  Filter,
  Phone,
  MessageSquare,
  DollarSign,
  Star,
  MoreVertical,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  UserPlus,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useContacts, useContactStats, useToggleContactStar, useDeleteContact } from "@/hooks/useContacts";
import { ContactStatus } from "@/types/database";
import type { Tables } from "@/integrations/supabase/types";

type Contact = Tables<'contacts'>;
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ContactDialog } from "@/components/contacts/ContactDialog";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const getStatusConfig = (status: string) => {
  switch (status) {
    case "active":
      return { label: "Activo", icon: CheckCircle2, className: "bg-stitch-primary/15 text-stitch-primary" };
    case "inactive":
      return { label: "Inactivo", icon: Clock, className: "bg-stitch-muted/15 text-stitch-muted" };
    case "blocked":
      return { label: "Bloqueado", icon: XCircle, className: "bg-stitch-red/15 text-stitch-red" };
    default:
      return { label: "Desconocido", icon: Clock, className: "bg-stitch-muted/15 text-stitch-muted" };
  }
};

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const navigate = useNavigate();
  const { profile } = useAuth();

  const { data: contacts, isLoading } = useContacts(
    statusFilter !== "all" ? { status: statusFilter as ContactStatus } : undefined
  );
  const { data: stats } = useContactStats();
  const toggleStar = useToggleContactStar();
  const deleteContact = useDeleteContact();

  const filteredContacts = contacts?.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.phone && contact.phone.includes(searchTerm)) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const userCurrency = profile?.currency || 'PEN';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: userCurrency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatLastPayment = (date: string | null) => {
    if (!date) return "Sin pagos";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
  };

  const handleToggleStar = async (contactId: string, currentStarred: boolean) => {
    try {
      await toggleStar.mutateAsync({ id: contactId, isStarred: !currentStarred });
    } catch (error) {
      toast.error("Error al actualizar favorito");
    }
  };

  const handleDelete = async (contactId: string) => {
    if (confirm('¿Estás seguro de eliminar este contacto?')) {
      try {
        await deleteContact.mutateAsync(contactId);
      } catch (error) {
        toast.error("Error al eliminar contacto");
      }
    }
  };

  const handleOpenCreate = () => {
    setSelectedContact(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setDialogOpen(true);
  };

  const statsCards = [
    {
      title: "Total contactos",
      value: stats?.total || 0,
      icon: Users,
      color: "bg-stitch-primary/15 text-stitch-primary",
    },
    {
      title: "Activos",
      value: stats?.active || 0,
      icon: CheckCircle2,
      color: "bg-stitch-primary/15 text-stitch-primary",
    },
    {
      title: "Total recibido",
      value: formatCurrency(stats?.totalPaid || 0),
      icon: DollarSign,
      color: "bg-stitch-primary/15 text-stitch-primary",
    },
    {
      title: "Por cobrar",
      value: formatCurrency(stats?.totalPending || 0),
      icon: Clock,
      color: "bg-stitch-yellow/15 text-stitch-yellow",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-stitch-text">Contactos</h1>
            <p className="text-stitch-muted">
              Gestiona tus contactos y su historial de pagos
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-stitch-surface border-stitch text-stitch-text hover:bg-stitch-surface-elevated rounded-xl"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {statusFilter === "all" ? "Filtrar" :
                   statusFilter === "active" ? "Activos" :
                   statusFilter === "inactive" ? "Inactivos" : "Bloqueados"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-stitch-surface border-stitch">
                <DropdownMenuItem onClick={() => setStatusFilter("all")} className="text-stitch-text hover:bg-stitch-surface-elevated">
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("active")} className="text-stitch-text hover:bg-stitch-surface-elevated">
                  Activos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("inactive")} className="text-stitch-text hover:bg-stitch-surface-elevated">
                  Inactivos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("blocked")} className="text-stitch-text hover:bg-stitch-surface-elevated">
                  Bloqueados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              className="gradient-primary text-white rounded-xl shadow-button"
              onClick={handleOpenCreate}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nuevo contacto</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <div
              key={stat.title}
              className="stitch-card animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-stitch-text">{stat.value}</p>
                  <p className="text-xs text-stitch-muted">{stat.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="stitch-card animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stitch-muted" />
              <Input
                placeholder="Buscar por nombre, teléfono o email..."
                className="pl-9 bg-stitch-surface-elevated border-stitch text-stitch-text placeholder:text-stitch-muted rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-stitch-muted">
                {filteredContacts.length} contactos
              </span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="stitch-card animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-stitch-surface-elevated" />
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-stitch-surface-elevated rounded" />
                      <div className="h-5 w-16 bg-stitch-surface-elevated rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-stitch-surface-elevated rounded" />
                  <div className="h-4 w-40 bg-stitch-surface-elevated rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Contacts Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredContacts.map((contact, index) => {
                const status = getStatusConfig(contact.status);
                const StatusIcon = status.icon;

                return (
                  <div
                    key={contact.id}
                    className="stitch-card group hover:border-stitch-primary/30 transition-all duration-300 animate-slide-up cursor-pointer"
                    style={{ animationDelay: `${(index + 5) * 50}ms` }}
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stitch-surface-elevated group-hover:bg-stitch-primary/15 transition-colors">
                          <span className="text-sm font-semibold text-stitch-text group-hover:text-stitch-primary transition-colors">
                            {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-stitch-text">{contact.name}</h3>
                            {contact.is_starred && (
                              <Star className="h-4 w-4 fill-stitch-yellow text-stitch-yellow" />
                            )}
                          </div>
                          <span className={cn("stitch-badge text-xs mt-1", status.className)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-stitch-muted hover:text-stitch-text hover:bg-stitch-surface-elevated rounded-lg"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-stitch-surface border-stitch">
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(contact); }}
                            className="text-stitch-text hover:bg-stitch-surface-elevated"
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); navigate(`/messages?contact=${contact.id}`); }}
                            className="text-stitch-text hover:bg-stitch-surface-elevated"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Ver mensajes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); handleToggleStar(contact.id, contact.is_starred); }}
                            className="text-stitch-text hover:bg-stitch-surface-elevated"
                          >
                            <Star className="h-4 w-4 mr-2" />
                            {contact.is_starred ? "Quitar favorito" : "Agregar favorito"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-stitch-border" />
                          <DropdownMenuItem
                            className="text-stitch-red hover:bg-stitch-surface-elevated"
                            onClick={(e) => { e.stopPropagation(); handleDelete(contact.id); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm text-stitch-muted">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm text-stitch-muted">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.location && (
                        <div className="flex items-center gap-2 text-sm text-stitch-muted">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{contact.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="rounded-xl bg-stitch-surface-elevated/50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-stitch-muted">Total pagado</span>
                        <span className="text-sm font-semibold text-stitch-primary">
                          {formatCurrency(contact.total_paid || 0)}
                        </span>
                      </div>
                      {(contact.pending_amount || 0) > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-stitch-muted">Pendiente</span>
                          <span className="text-sm font-semibold text-stitch-yellow">
                            {formatCurrency(contact.pending_amount || 0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-stitch">
                      <div className="flex items-center gap-1 text-xs text-stitch-muted">
                        <Calendar className="h-3 w-3" />
                        <span>Último pago: {formatLastPayment(contact.last_payment_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredContacts.length === 0 && !isLoading && (
              <div className="stitch-card">
                {searchTerm ? (
                  <div className="stitch-empty py-12">
                    <div className="stitch-empty-icon">
                      <Search className="h-10 w-10 text-stitch-muted" />
                    </div>
                    <h3 className="text-xl font-semibold text-stitch-text mb-2">Sin resultados</h3>
                    <p className="text-stitch-muted mb-4">
                      No encontramos contactos con "{searchTerm}"
                    </p>
                    <Button
                      variant="outline"
                      className="bg-stitch-surface border-stitch text-stitch-text hover:bg-stitch-surface-elevated rounded-xl"
                      onClick={() => setSearchTerm("")}
                    >
                      Limpiar búsqueda
                    </Button>
                  </div>
                ) : (
                  <div className="stitch-empty py-12">
                    <div className="stitch-empty-icon">
                      <Users className="h-10 w-10 text-stitch-muted" />
                    </div>
                    <h2 className="text-xl font-semibold text-stitch-text mb-2">Sin contactos aún</h2>
                    <p className="text-stitch-muted max-w-md mb-6">
                      Agrega tu primer contacto para empezar a trackear sus pagos.
                    </p>
                    <Button
                      className="gradient-primary text-white rounded-xl shadow-button"
                      onClick={handleOpenCreate}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Agregar contacto
                    </Button>
                    <p className="text-sm text-stitch-muted mt-4">
                      Los contactos se crean automáticamente cuando detectamos pagos de nuevos números.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Contact Dialog */}
      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={selectedContact}
      />
    </DashboardLayout>
  );
}
