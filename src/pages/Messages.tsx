import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useMessages, useUpdateMessage } from "@/hooks/useSupabaseData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  Search,
  Filter,
  Image,
  FileAudio,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Pencil,
  Save,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const intentLabels = {
  pago: { label: "Pago", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  promesa: { label: "Promesa", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  consulta: { label: "Consulta", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  otro: { label: "Otro", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

const statusLabels = {
  pending: { label: "Pendiente", icon: Clock, color: "text-yellow-400" },
  processing: { label: "Procesando", icon: RefreshCw, color: "text-blue-400" },
  processed: { label: "Procesado", icon: CheckCircle2, color: "text-green-400" },
  review: { label: "Revisar", icon: AlertCircle, color: "text-orange-400" },
  error: { label: "Error", icon: AlertCircle, color: "text-red-400" },
};

const typeIcons = {
  text: MessageSquare,
  image: Image,
  audio: FileAudio,
  document: FileText,
  video: FileText,
  sticker: Image,
  location: MessageSquare,
};

const Messages = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [intentFilter, setIntentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editIntent, setEditIntent] = useState<string>("");

  const { data: messages, isLoading, refetch } = useMessages({
    status: statusFilter !== "all" ? statusFilter : undefined,
    intent: intentFilter !== "all" ? intentFilter : undefined,
    limit: 100,
  });

  const updateMessage = useUpdateMessage();

  const filteredMessages = messages?.filter((msg) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      msg.content?.toLowerCase().includes(search) ||
      msg.contacts?.name?.toLowerCase().includes(search) ||
      msg.contacts?.phone?.toLowerCase().includes(search)
    );
  });

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
    } catch {
      return dateStr;
    }
  };

  // Handle quick intent change from table
  const handleQuickIntentChange = async (messageId: string, newIntent: string) => {
    try {
      await updateMessage.mutateAsync({
        id: messageId,
        updates: {
          intent: newIntent,
          status: "processed",
        },
      });
      toast.success(`Clasificación actualizada a "${intentLabels[newIntent as keyof typeof intentLabels]?.label}"`);
    } catch (error) {
      toast.error("Error al actualizar la clasificación");
    }
  };

  // Handle save from modal
  const handleSaveClassification = async () => {
    if (!selectedMessage || !editIntent) return;

    try {
      await updateMessage.mutateAsync({
        id: selectedMessage.id,
        updates: {
          intent: editIntent,
          status: "processed",
        },
      });

      setSelectedMessage({
        ...selectedMessage,
        intent: editIntent,
        status: "processed",
      });

      setIsEditing(false);
      toast.success("Clasificación corregida");
    } catch (error) {
      toast.error("Error al actualizar la clasificación");
    }
  };

  // Handle mark as reviewed
  const handleMarkAsReviewed = async (messageId: string) => {
    try {
      await updateMessage.mutateAsync({
        id: messageId,
        updates: {
          status: "processed",
        },
      });
      toast.success("Mensaje marcado como revisado");
    } catch (error) {
      toast.error("Error al actualizar el estado");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mensajes</h1>
            <p className="text-muted-foreground">
              Todos los mensajes recibidos de WhatsApp Business
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>

        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por contenido, contacto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="processing">Procesando</SelectItem>
                  <SelectItem value="processed">Procesado</SelectItem>
                  <SelectItem value="review">Revisar</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              <Select value={intentFilter} onValueChange={setIntentFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Intención" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="promesa">Promesa</SelectItem>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Messages Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Mensajes Recibidos
              {filteredMessages && (
                <Badge variant="secondary" className="ml-2">
                  {filteredMessages.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !filteredMessages?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No hay mensajes</h3>
                <p className="text-sm text-muted-foreground">
                  Los mensajes aparecerán aquí cuando se reciban via WhatsApp
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Contenido</TableHead>
                      <TableHead>Intención</TableHead>
                      <TableHead>Confianza</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMessages.map((msg) => {
                      const TypeIcon = typeIcons[msg.type as keyof typeof typeIcons] || MessageSquare;
                      const status = statusLabels[msg.status as keyof typeof statusLabels];
                      const StatusIcon = status?.icon || Clock;
                      const intent = msg.intent ? intentLabels[msg.intent as keyof typeof intentLabels] : null;

                      return (
                        <TableRow key={msg.id} className="hover:bg-muted/50">
                          <TableCell>
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {msg.contacts?.name || "Sin nombre"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {msg.contacts?.phone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            <p className="truncate text-sm">
                              {msg.content || (
                                <span className="text-muted-foreground italic">
                                  [{msg.type}]
                                </span>
                              )}
                            </p>
                          </TableCell>
                          <TableCell>
                            {intent && (
                              <Badge variant="outline" className={intent.color}>
                                {intent.label}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {msg.confidence !== null && (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      msg.confidence >= 0.7
                                        ? "bg-green-500"
                                        : msg.confidence >= 0.5
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{ width: `${msg.confidence * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(msg.confidence * 100)}%
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-1 ${status?.color}`}>
                              <StatusIcon className="h-4 w-4" />
                              <span className="text-xs">{status?.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(msg.wa_timestamp)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedMessage(msg);
                                  setEditIntent(msg.intent || "otro");
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver detalle
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleQuickIntentChange(msg.id, "pago")}>
                                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                                  Marcar como Pago
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleQuickIntentChange(msg.id, "promesa")}>
                                  <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
                                  Marcar como Promesa
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleQuickIntentChange(msg.id, "consulta")}>
                                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                                  Marcar como Consulta
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleQuickIntentChange(msg.id, "otro")}>
                                  <div className="w-2 h-2 rounded-full bg-gray-500 mr-2" />
                                  Marcar como Otro
                                </DropdownMenuItem>
                                {msg.status === "review" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleMarkAsReviewed(msg.id)}>
                                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                      Marcar como revisado
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Detail Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={() => {
          setSelectedMessage(null);
          setIsEditing(false);
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                Detalle del Mensaje
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar clasificación
                  </Button>
                )}
              </DialogTitle>
              <DialogDescription>
                Información completa del mensaje y análisis de IA
              </DialogDescription>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Contacto</p>
                    <p className="font-medium">{selectedMessage.contacts?.name}</p>
                    <p className="text-sm">{selectedMessage.contacts?.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {new Date(selectedMessage.wa_timestamp).toLocaleString("es")}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Contenido</p>
                  <div className="rounded-lg bg-muted p-4">
                    <p className="whitespace-pre-wrap">
                      {selectedMessage.content || `[${selectedMessage.type}]`}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Clasificación</p>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Intención</Label>
                        <Select value={editIntent} onValueChange={setEditIntent}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar intención" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pago">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                Pago
                              </div>
                            </SelectItem>
                            <SelectItem value="promesa">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                Promesa
                              </div>
                            </SelectItem>
                            <SelectItem value="consulta">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                Consulta
                              </div>
                            </SelectItem>
                            <SelectItem value="otro">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-500" />
                                Otro
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-muted p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Intención:</span>
                        {selectedMessage.intent && (
                          <Badge
                            variant="outline"
                            className={intentLabels[selectedMessage.intent as keyof typeof intentLabels]?.color}
                          >
                            {intentLabels[selectedMessage.intent as keyof typeof intentLabels]?.label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Confianza:</span>
                        <span className="font-medium">
                          {Math.round((selectedMessage.confidence || 0) * 100)}%
                        </span>
                        {selectedMessage.confidence < 0.7 && (
                          <Badge variant="outline" className="text-orange-400 border-orange-400/30">
                            Requiere revisión
                          </Badge>
                        )}
                      </div>
                      {selectedMessage.extracted_data && (
                        <div>
                          <span className="text-sm">Datos extraídos:</span>
                          <pre className="mt-1 text-xs bg-background/50 p-2 rounded overflow-auto">
                            {JSON.stringify(selectedMessage.extracted_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {isEditing && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveClassification} disabled={updateMessage.isPending}>
                  {updateMessage.isPending ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
