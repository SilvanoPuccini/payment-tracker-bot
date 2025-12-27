import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Send,
  MoreVertical,
  Phone,
  Image as ImageIcon,
  Paperclip,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useConversations, useContactMessages, useSendMessage, useMessageStats } from "@/hooks/useMessages";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "confirmed":
      return <Badge variant="success" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Confirmado</Badge>;
    case "pending":
      return <Badge variant="warning" className="text-xs"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
    case "promise":
      return <Badge variant="secondary" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" />Promesa</Badge>;
    default:
      return null;
  }
};

export default function Messages() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageInput, setMessageInput] = useState("");

  const { data: conversations, isLoading: loadingConversations } = useConversations();
  const { data: messages, isLoading: loadingMessages } = useContactMessages(selectedContactId || "");
  const { data: stats } = useMessageStats();
  const sendMessage = useSendMessage();

  // Auto-select first conversation
  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedContactId) {
      setSelectedContactId(conversations[0].contact_id);
    }
  }, [conversations, selectedContactId]);

  const selectedConversation = conversations?.find(c => c.contact_id === selectedContactId);

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es });
  };

  const formatCurrency = (amount: number, currency: string = 'PEN') => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedContactId) return;

    try {
      await sendMessage.mutateAsync({
        contact_id: selectedContactId,
        content: messageInput,
        sender: 'user'
      });
      setMessageInput("");
    } catch (error) {
      toast.error("Error al enviar mensaje");
    }
  };

  const filteredConversations = conversations?.filter((conv) =>
    conv.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.contact_phone?.includes(searchTerm)
  ) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mensajes</h1>
            <p className="text-muted-foreground">
              Gestiona las conversaciones de WhatsApp y pagos detectados
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
            <Button size="sm" className="gradient-primary text-primary-foreground">
              <MessageSquare className="h-4 w-4 mr-2" />
              Nueva conversación
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalMessagesToday || 0}</p>
                  <p className="text-xs text-muted-foreground">Mensajes hoy</p>
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
                  <p className="text-2xl font-bold">{stats?.paymentsDetectedToday || 0}</p>
                  <p className="text-xs text-muted-foreground">Pagos detectados</p>
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
                  <p className="text-2xl font-bold">{stats?.messagesRequiringReview || 0}</p>
                  <p className="text-xs text-muted-foreground">Por revisar</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/50">
                  <DollarSign className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.totalAmountToday || 0)}</p>
                  <p className="text-xs text-muted-foreground">Detectado hoy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Conversations */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Conversation List */}
          <Card className="glass-card lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversaciones..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
                  <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:text-primary">
                    Todos
                  </TabsTrigger>
                  <TabsTrigger value="payments" className="data-[state=active]:bg-transparent data-[state=active]:text-primary">
                    Con pagos
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="data-[state=active]:bg-transparent data-[state=active]:text-primary">
                    No leídos
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="m-0">
                  <ScrollArea className="h-[500px]">
                    {loadingConversations ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : filteredConversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">No hay conversaciones</p>
                      </div>
                    ) : (
                      filteredConversations.map((conv) => (
                        <div
                          key={conv.contact_id}
                          onClick={() => setSelectedContactId(conv.contact_id)}
                          className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-border/50 hover:bg-muted/30 ${
                            selectedContactId === conv.contact_id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                          }`}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/20 text-primary text-sm">
                              {conv.contact_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "??"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-sm truncate">{conv.contact_name || "Desconocido"}</p>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {conv.last_message_time ? formatTime(conv.last_message_time) : ""}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate mt-0.5">
                              {conv.last_message || "Sin mensajes"}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              {conv.has_payment && (
                                <DollarSign className="h-3 w-3 text-success" />
                              )}
                              {conv.payment_status && getStatusBadge(conv.payment_status)}
                              {(conv.unread_count || 0) > 0 && (
                                <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                                  {conv.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="payments" className="m-0">
                  <ScrollArea className="h-[500px]">
                    {filteredConversations.filter(c => c.has_payment).map((conv) => (
                      <div
                        key={conv.contact_id}
                        onClick={() => setSelectedContactId(conv.contact_id)}
                        className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-border/50 hover:bg-muted/30 ${
                          selectedContactId === conv.contact_id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                        }`}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20 text-primary text-sm">
                            {conv.contact_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">{conv.contact_name}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {conv.last_message_time ? formatTime(conv.last_message_time) : ""}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <DollarSign className="h-3 w-3 text-success" />
                            {conv.payment_status && getStatusBadge(conv.payment_status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="unread" className="m-0">
                  <ScrollArea className="h-[500px]">
                    {filteredConversations.filter(c => (c.unread_count || 0) > 0).map((conv) => (
                      <div
                        key={conv.contact_id}
                        onClick={() => setSelectedContactId(conv.contact_id)}
                        className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-border/50 hover:bg-muted/30 ${
                          selectedContactId === conv.contact_id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                        }`}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20 text-primary text-sm">
                            {conv.contact_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">{conv.contact_name}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {conv.last_message_time ? formatTime(conv.last_message_time) : ""}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {conv.has_payment && <DollarSign className="h-3 w-3 text-success" />}
                            {conv.payment_status && getStatusBadge(conv.payment_status)}
                            <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                              {conv.unread_count}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Chat View */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader className="border-b border-border/50 pb-4">
              {selectedConversation ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {selectedConversation.contact_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{selectedConversation.contact_name || "Desconocido"}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {selectedConversation.contact_phone || "Sin teléfono"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedConversation.payment_status && getStatusBadge(selectedConversation.payment_status)}
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-4">
                  <p className="text-muted-foreground">Selecciona una conversación</p>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages */}
              <ScrollArea className="h-[400px] p-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !messages || messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No hay mensajes</p>
                    <p className="text-xs text-muted-foreground mt-1">Los mensajes aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                            msg.sender === "user"
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : msg.payment_intent === "confirmed"
                              ? "bg-success/10 border border-success/30 text-success rounded-bl-md"
                              : msg.payment_intent === "payment"
                              ? "bg-warning/10 border border-warning/30 text-foreground rounded-bl-md"
                              : "bg-muted/50 text-foreground rounded-bl-md"
                          }`}
                        >
                          {msg.payment_intent === "payment" && (
                            <div className="flex items-center gap-1.5 mb-1.5 text-warning">
                              <DollarSign className="h-3.5 w-3.5" />
                              <span className="text-xs font-medium">Pago detectado</span>
                            </div>
                          )}
                          {msg.payment_intent === "confirmed" && (
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span className="text-xs font-medium">Confirmado</span>
                            </div>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t border-border/50 p-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Escribe un mensaje..."
                    className="flex-1"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="gradient-primary text-primary-foreground shrink-0"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessage.isPending}
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
