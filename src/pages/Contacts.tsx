import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
  Loader2,
  Pencil,
  Trash2
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
import { EmptyState } from "@/components/ui/empty-state";
import { StatsCardSkeleton, ContactCardSkeleton } from "@/components/ui/skeletons";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" />Activo</Badge>;
    case "inactive":
      return <Badge variant="secondary">Inactivo</Badge>;
    case "blocked":
      return <Badge variant="destructive">Bloqueado</Badge>;
    default:
      return null;
  }
};

const getReliabilityColor = (reliability: number) => {
  if (reliability >= 90) return "text-success";
  if (reliability >= 70) return "text-warning";
  return "text-destructive";
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contactos</h1>
            <p className="text-muted-foreground">
              Gestiona tus contactos y su historial de pagos
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {statusFilter === "all" ? "Filtrar" :
                   statusFilter === "active" ? "Activos" :
                   statusFilter === "inactive" ? "Inactivos" : "Bloqueados"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                  Activos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                  Inactivos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("blocked")}>
                  Bloqueados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              className="gradient-primary text-primary-foreground"
              onClick={handleOpenCreate}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo contacto
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Total contactos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.active || 0}</p>
                  <p className="text-xs text-muted-foreground">Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.totalPaid || 0)}</p>
                  <p className="text-xs text-muted-foreground">Total recibido</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.totalPending || 0)}</p>
                  <p className="text-xs text-muted-foreground">Por cobrar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, teléfono o email..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {filteredContacts.length} contactos
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ContactCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Contacts Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredContacts.map((contact, index) => (
                <Card
                  key={contact.id}
                  className="glass-card hover:shadow-glow/20 transition-all duration-300 hover:scale-[1.02]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                            {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{contact.name}</h3>
                            {contact.is_starred && (
                              <Star className="h-4 w-4 fill-warning text-warning" />
                            )}
                          </div>
                          {getStatusBadge(contact.status)}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(contact)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/messages?contact=${contact.id}`)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Ver mensajes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStar(contact.id, contact.is_starred)}>
                            <Star className="h-4 w-4 mr-2" />
                            {contact.is_starred ? "Quitar favorito" : "Agregar favorito"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(contact.id)}
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
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{contact.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="rounded-lg bg-muted/30 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Total pagado</span>
                        <span className="text-sm font-semibold text-success">
                          {formatCurrency(contact.total_paid || 0)}
                        </span>
                      </div>
                      {(contact.pending_amount || 0) > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Pendiente</span>
                          <span className="text-sm font-semibold text-warning">
                            {formatCurrency(contact.pending_amount || 0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Último pago: {formatLastPayment(contact.last_payment_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredContacts.length === 0 && !isLoading && (
              <Card className="glass-card">
                <CardContent className="py-4">
                  {searchTerm ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Search className="h-10 w-10 text-muted-foreground mb-3" />
                      <h3 className="text-lg font-semibold mb-1">Sin resultados</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        No encontramos contactos con "{searchTerm}"
                      </p>
                      <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
                        Limpiar búsqueda
                      </Button>
                    </div>
                  ) : (
                    <EmptyState
                      icon={<span role="img" aria-label="people">👥</span>}
                      title="Sin contactos aún"
                      description="Agrega tu primer contacto para empezar a trackear sus pagos."
                      action={{
                        label: "Agregar contacto",
                        onClick: handleOpenCreate,
                        icon: <UserPlus className="h-4 w-4" />,
                      }}
                      tip="Los contactos se crean automáticamente cuando detectamos pagos de nuevos números."
                    />
                  )}
                </CardContent>
              </Card>
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
