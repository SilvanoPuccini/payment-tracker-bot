import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useContacts, useContactMessages, useContactPayments } from "@/hooks/useSupabaseData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<any>(null);

  const { data: contacts, isLoading, refetch } = useContacts({
    search: searchQuery || undefined,
    limit: 100,
  });

  const { data: contactMessages } = useContactMessages(selectedContact?.id);
  const { data: contactPayments } = useContactPayments(selectedContact?.id);

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
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedContact?.profile_picture_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {getInitials(selectedContact?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {selectedContact?.name || "Sin nombre"}
                  </p>
                  <p className="text-sm text-muted-foreground font-normal">
                    {selectedContact?.phone}
                  </p>
                </div>
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
                <Tabs defaultValue="messages" className="flex-1">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="messages">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Mensajes
                    </TabsTrigger>
                    <TabsTrigger value="payments">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pagos
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
                </Tabs>

                {/* Contact Info */}
                {(selectedContact.email || selectedContact.notes) && (
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    {selectedContact.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedContact.email}</span>
                      </div>
                    )}
                    {selectedContact.notes && (
                      <div className="text-sm">
                        <p className="text-muted-foreground mb-1">Notas:</p>
                        <p>{selectedContact.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Contacts;
