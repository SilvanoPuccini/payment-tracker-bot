import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Users,
  Search,
  Phone,
  MessageSquare,
  Star,
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  ArrowLeft,
  ChevronRight,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
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

// Avatar images - realistic profile photos
const AVATAR_IMAGES = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
];

const getAvatarImage = (name: string) => {
  // Generate a consistent index based on name
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_IMAGES[hash % AVATAR_IMAGES.length];
};

const getAvatarColor = (index: number) => {
  const colors = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-gradient-to-br from-teal-500 to-teal-600',
    'bg-gradient-to-br from-orange-500 to-orange-600',
  ];
  return colors[index % colors.length];
};

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const navigate = useNavigate();
  const { profile } = useAuth();

  const { data: contacts, isLoading } = useContacts();
  const { data: stats } = useContactStats();
  const toggleStar = useToggleContactStar();
  const deleteContact = useDeleteContact();

  const userCurrency = profile?.currency || 'PEN';
  const currencySymbol = userCurrency === 'PEN' ? 'S/' : userCurrency === 'USD' ? '$' : userCurrency;

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  };

  // Filter contacts
  const filteredContacts = useMemo(() => {
    let result = contacts || [];

    // Apply search filter
    if (searchTerm) {
      result = result.filter((contact) =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.phone && contact.phone.includes(searchTerm)) ||
        (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    switch (filter) {
      case 'favorites':
        result = result.filter(c => c.is_starred);
        break;
      case 'active':
        result = result.filter(c => c.status === 'active');
        break;
      case 'withDebt':
        result = result.filter(c => (c.pending_amount || 0) > 0);
        break;
    }

    return result;
  }, [contacts, searchTerm, filter]);

  // Get starred contacts for favorites section
  const starredContacts = useMemo(() => {
    return (contacts || []).filter(c => c.is_starred).slice(0, 5);
  }, [contacts]);

  // Group contacts alphabetically
  const groupedContacts = useMemo(() => {
    const groups: { [key: string]: Contact[] } = {};

    filteredContacts.forEach(contact => {
      const letter = contact.name.charAt(0).toUpperCase();
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(contact);
    });

    // Sort each group by name
    Object.keys(groups).forEach(letter => {
      groups[letter].sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [filteredContacts]);

  const sortedLetters = Object.keys(groupedContacts).sort();

  const handleToggleStar = async (contactId: string, currentStarred: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleStar.mutateAsync({ id: contactId, isStarred: !currentStarred });
    } catch (error) {
      toast.error("Error al actualizar favorito");
    }
  };

  const handleDelete = async (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleOpenEdit = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedContact(contact);
    setDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const formatLastPayment = (date: string | null) => {
    if (!date) return "Sin pagos";
    return `hace ${formatDistanceToNow(new Date(date), { locale: es })}`;
  };

  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'favorites', label: 'Favoritos' },
    { id: 'active', label: 'Activos' },
    { id: 'withDebt', label: 'Con Deuda' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-[var(--pt-surface)] rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Contactos</h1>
          <button
            onClick={handleOpenCreate}
            className="bg-[var(--pt-primary)] text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-1.5 shadow-button"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        </div>

        {/* Search */}
        <div className="relative animate-slide-up">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pt-text-muted)]" />
          <input
            type="text"
            placeholder="Buscar nombre o empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pt-input pl-12 rounded-2xl"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 animate-slide-up" style={{ animationDelay: '50ms' }}>
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "pt-chip",
                filter === f.id && "active"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Favorites Section */}
        {starredContacts.length > 0 && filter !== 'withDebt' && (
          <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white">Favoritos</h2>
              <button
                className="text-[var(--pt-primary)] text-sm font-semibold"
                onClick={() => setFilter('favorites')}
              >
                Ver todos
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
              {starredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                  className="pt-favorite-card cursor-pointer hover:border-[var(--pt-primary)]/30 transition-all min-w-[140px]"
                >
                  {/* Avatar with image */}
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg ring-2 ring-[var(--pt-border)]">
                      <img
                        src={getAvatarImage(contact.name)}
                        alt={contact.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials on error
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className={cn(
                        "hidden w-full h-full flex items-center justify-center text-white font-bold text-lg",
                        getAvatarColor(contact.name.charCodeAt(0))
                      )}>
                        {getInitials(contact.name)}
                      </div>
                    </div>
                    {/* Status indicator */}
                    <div className={cn(
                      "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[var(--pt-bg)]",
                      contact.status === 'active' ? "bg-[var(--pt-primary)]" : "bg-gray-500"
                    )} />
                  </div>

                  {/* Name */}
                  <p className="font-semibold text-sm text-white text-center truncate w-full mt-2">
                    {contact.name.split(' ').slice(0, 2).join(' ')}
                  </p>

                  {/* Amount */}
                  <p className="text-[var(--pt-primary)] font-bold text-base">
                    {formatCurrency(contact.total_paid || 0)}
                  </p>

                  {/* Trust Score */}
                  <div className="w-full">
                    <div className="pt-progress h-1.5">
                      <div
                        className="pt-progress-bar"
                        style={{ width: `${contact.reliability_score || 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--pt-text-muted)] text-center mt-1 tracking-wider">
                      TRUST {contact.reliability_score || 100}/100
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-4 rounded-2xl bg-[var(--pt-surface)]">
                <div className="w-12 h-12 rounded-full bg-[var(--pt-surface-elevated)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 bg-[var(--pt-surface-elevated)] rounded" />
                  <div className="h-3 w-20 bg-[var(--pt-surface-elevated)] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="pt-empty py-16">
            <div className="pt-empty-icon">
              <Users className="h-12 w-12 text-[var(--pt-text-muted)]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {searchTerm ? 'Sin resultados' : 'Sin contactos aún'}
            </h2>
            <p className="text-[var(--pt-text-secondary)] max-w-sm mb-6">
              {searchTerm
                ? `No encontramos contactos con "${searchTerm}"`
                : 'Agrega tu primer contacto para empezar a trackear sus pagos.'
              }
            </p>
            {!searchTerm && (
              <button
                className="pt-btn-primary"
                onClick={handleOpenCreate}
              >
                <Plus className="h-5 w-5" />
                Agregar contacto
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
            {sortedLetters.map((letter, letterIndex) => (
              <div key={letter}>
                {/* Letter Header */}
                <p className="pt-section-header text-[var(--pt-primary)]">{letter}</p>

                {/* Contacts in this letter */}
                <div className="space-y-3">
                  {groupedContacts[letter].map((contact, index) => {
                    const hasPending = (contact.pending_amount || 0) > 0;
                    const globalIndex = letterIndex * 10 + index;

                    return (
                      <div
                        key={contact.id}
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                        className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--pt-border)] bg-[var(--pt-surface)] cursor-pointer hover:bg-[var(--pt-surface-elevated)] transition-all"
                      >
                        {/* Avatar with image */}
                        <div className="relative shrink-0">
                          {contact.company ? (
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--pt-surface-elevated)] shadow-md">
                              <Briefcase className="w-5 h-5 text-[var(--pt-text-secondary)]" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full overflow-hidden shadow-md">
                              <img
                                src={getAvatarImage(contact.name)}
                                alt={contact.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <div className={cn(
                                "hidden w-full h-full flex items-center justify-center text-white font-bold text-sm",
                                getAvatarColor(globalIndex)
                              )}>
                                {getInitials(contact.name)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-white truncate">
                              {contact.name}
                            </p>
                            {contact.is_starred && (
                              <Star className="w-4 h-4 fill-[var(--pt-yellow)] text-[var(--pt-yellow)]" />
                            )}
                          </div>
                          <p className={cn(
                            "text-xs",
                            hasPending ? "text-[var(--pt-yellow)]" : "text-[var(--pt-text-secondary)]"
                          )}>
                            {hasPending ? 'Pago pendiente' : `${contact.payment_count || 0} pagos completados`}
                          </p>
                        </div>

                        {/* Amount & Status */}
                        <div className="text-right">
                          <p className={cn(
                            "font-bold text-sm",
                            hasPending ? "text-[var(--pt-red)]" : "text-white"
                          )}>
                            {hasPending ? '-' : ''}{formatCurrency(hasPending ? contact.pending_amount || 0 : contact.total_paid || 0)}
                          </p>
                          <p className={cn(
                            "text-xs font-medium",
                            hasPending ? "text-[var(--pt-red)]" : contact.status === 'active' ? "text-[var(--pt-primary)]" : "text-[var(--pt-text-muted)]"
                          )}>
                            {hasPending ? 'Vencido' : contact.status === 'active' ? 'Activo' : formatLastPayment(contact.last_payment_at)}
                          </p>
                        </div>

                        {/* Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[var(--pt-text-muted)] hover:text-white hover:bg-[var(--pt-surface-elevated)] rounded-lg"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[var(--pt-surface)] border-[var(--pt-border)]">
                            <DropdownMenuItem
                              onClick={(e) => handleOpenEdit(contact, e as unknown as React.MouseEvent)}
                              className="text-white hover:bg-[var(--pt-surface-elevated)]"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://wa.me/${contact.phone?.replace(/\D/g, '')}`, '_blank');
                              }}
                              className="text-[#25D366] hover:bg-[var(--pt-surface-elevated)]"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleToggleStar(contact.id, contact.is_starred, e as unknown as React.MouseEvent)}
                              className="text-[var(--pt-yellow)] hover:bg-[var(--pt-surface-elevated)]"
                            >
                              <Star className="h-4 w-4 mr-2" />
                              {contact.is_starred ? 'Quitar favorito' : 'Agregar favorito'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[var(--pt-border)]" />
                            <DropdownMenuItem
                              onClick={(e) => handleDelete(contact.id, e as unknown as React.MouseEvent)}
                              className="text-[var(--pt-red)] hover:bg-[var(--pt-surface-elevated)]"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Count */}
            <div className="text-center py-4">
              <p className="text-sm text-[var(--pt-text-muted)]">
                {filteredContacts.length} contactos
              </p>
            </div>
          </div>
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
