import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useContacts, useContactMessages, useContactPayments, useUpdateContact } from "@/hooks/useSupabaseData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Search,
  RefreshCw,
  MessageSquare,
  CreditCard,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronRight,
  Pencil,
  Save,
  X,
  User,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    notes: "",
  });

  const { data: contacts, isLoading, refetch } = useContacts({
    search: searchQuery || undefined,
    limit: 100,
  });

  const { data: contactMessages } = useContactMessages(selectedContact?.id);
  const { data: contactPayments } = useContactPayments(selectedContact?.id);
  const updateContact = useUpdateContact();

  // Sync edit form when contact is selected
  useEffect(() => {
    if (selectedContact) {
      setEditForm({
        name: selectedContact.name || "",
        email: selectedContact.email || "",
        notes: selectedContact.notes || "",
      });
      setIsEditing(false);
    }
  }, [selectedContact]);

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

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
    } catch {
      return dateStr;
    }
  };

  // Handle save contact
  const handleSaveContact = async () => {
    if (!selectedContact) return;

    try {
      await updateContact.mutateAsync({
        id: selectedContact.id,
        updates: {
          name: editForm.name || null,
          email: editForm.email || null,
          notes: editForm.notes || null,
        },
      });

      // Update local state
      setSelectedContact({
        ...selectedContact,
        name: editForm.name || null,
        email: editForm.email || null,
        notes: editForm.notes || null,
      });

      setIsEditing(false);
      toast.success("Contacto actualizado");
      refetch();
    } catch (error) {
      toast.error("Error al actualizar el contacto");
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditForm({
      name: selectedContact?.name || "",
      email: selectedContact?.email || "",
      notes: selectedContact?.notes || "",
    });
    setIsEditing(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contactos</h1>
            <p className="text-muted-foreground">
              Todos los contactos que han interactuado via WhatsApp
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>

        {/* Search */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contacts Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !contacts?.length ? (
            <div className="col-span-full">
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No hay contactos</h3>
                  <p className="text-sm text-muted-foreground">
                    Los contactos aparecerán aquí cuando recibas mensajes
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            contacts.map((contact) => (
              <Card
                key={contact.id}
                className="glass-card hover:border-primary/50 cursor-pointer transition-all"
                onClick={() => setSelectedContact(contact)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={contact.profile_picture_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {contact.name || "Sin nombre"}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {contact.phone}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{contact.message_count} mensajes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatDate(contact.last_message_at)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-1">
                      {contact.total_debt > 0 ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-400" />
                          <span className="text-sm text-red-400">
                            Debe: {formatCurrency(contact.total_debt)}
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-green-400">Al día</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {formatCurrency(contact.total_paid)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Contact Detail Dialog */}
        <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedContact?.profile_picture_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {getInitials(selectedContact?.name || editForm.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {selectedContact?.name || editForm.name || "Sin nombre"}
                    </p>
                    <p className="text-sm text-muted-foreground font-normal">
                      {selectedContact?.phone}
                    </p>
                  </div>
                </div>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                      <X className="mr-1 h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveContact}
                      disabled={updateContact.isPending}
                    >
                      {updateContact.isPending ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Guardar
                    </Button>
                  </div>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedContact && (
              <div className="flex-1 overflow-hidden">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{selectedContact.message_count}</p>
                    <p className="text-xs text-muted-foreground">Mensajes</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(selectedContact.total_paid)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Pagado</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className={`text-2xl font-bold ${selectedContact.total_debt > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatCurrency(selectedContact.total_debt)}
                    </p>
                    <p className="text-xs text-muted-foreground">Deuda Actual</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-sm font-medium">
                      {formatDate(selectedContact.last_message_at)}
                    </p>
                    <p className="text-xs text-muted-foreground">Último Mensaje</p>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue={isEditing ? "info" : "messages"} className="flex-1">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="messages">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Mensajes
                    </TabsTrigger>
                    <TabsTrigger value="payments">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pagos
                    </TabsTrigger>
                    <TabsTrigger value="info">
                      <User className="mr-2 h-4 w-4" />
                      Información
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="messages" className="mt-4 max-h-[300px] overflow-y-auto">
                    {!contactMessages?.length ? (
                      <p className="text-center text-muted-foreground py-8">
                        No hay mensajes
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {contactMessages.slice(0, 10).map((msg) => (
                          <div
                            key={msg.id}
                            className="p-3 rounded-lg bg-muted"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline" className="text-xs">
                                {msg.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(msg.wa_timestamp)}
                              </span>
                            </div>
                            <p className="text-sm">
                              {msg.content || `[${msg.type}]`}
                            </p>
                            {msg.intent && (
                              <div className="mt-2 flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {msg.intent}
                                </Badge>
                                {msg.confidence && (
                                  <span className="text-xs text-muted-foreground">
                                    {Math.round(msg.confidence * 100)}% confianza
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="payments" className="mt-4 max-h-[300px] overflow-y-auto">
                    {!contactPayments?.length ? (
                      <p className="text-center text-muted-foreground py-8">
                        No hay pagos registrados
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contactPayments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>
                                {format(new Date(payment.payment_date), "dd/MM/yyyy")}
                              </TableCell>
                              <TableCell className="font-semibold text-primary">
                                {formatCurrency(payment.amount, payment.currency)}
                              </TableCell>
                              <TableCell>
                                {payment.payment_method || "-"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    payment.status === "confirmed"
                                      ? "bg-green-500/20 text-green-400"
                                      : payment.status === "detected"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-red-500/20 text-red-400"
                                  }
                                >
                                  {payment.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>

                  <TabsContent value="info" className="mt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                          id="name"
                          placeholder="Nombre del contacto"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="correo@ejemplo.com"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea
                          id="notes"
                          placeholder="Notas sobre este contacto..."
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          disabled={!isEditing}
                          rows={4}
                        />
                      </div>

                      <div className="pt-4 border-t border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>Teléfono: {selectedContact.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Registrado: {format(new Date(selectedContact.created_at), "d MMM yyyy", { locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Contacts;
