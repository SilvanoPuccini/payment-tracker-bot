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
import { useConversations, useContactMessages, useSendMessage, useMessageStats, Conversation } from "@/hooks/useMessages";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

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
      setSelectedContactId(conversations[0].contact.id);
    }
  }, [conversations, selectedContactId]);

  const selectedConversation = conversations?.find(c => c.contact.id === selectedContactId);

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
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
        direction: 'outgoing'
      });
      setMessageInput("");
    } catch (error) {
      toast.error("Error al enviar mensaje");
    }
  };

  const filteredConversations = conversations?.filter((conv) =>
    conv.contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.contact.phone?.includes(searchTerm)
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
                  <p className="text-2xl font-bold">{stats?.totalToday || 0}</p>
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
                  <p className="text-2xl font-bold">{stats?.paymentsDetected || 0}</p>
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
                  <p className="text-2xl font-bold">{stats?.requiresReview || 0}</p>
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
                  <p className="text-2xl font-bold">{formatCurrency(stats?.totalDetectedAmount || 0)}</p>
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
                        <ConversationItem
                          key={conv.id}
                          conversation={conv}
                          isSelected={selectedContactId === conv.contact.id}
                          onSelect={() => setSelectedContactId(conv.contact.id)}
                          formatTime={formatTime}
                        />
                      ))
                    )}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="payments" className="m-0">
                  <ScrollArea className="h-[500px]">
                    {filteredConversations.filter(c => c.hasPaymentPending).map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        isSelected={selectedContactId === conv.contact.id}
                        onSelect={() => setSelectedContactId(conv.contact.id)}
                        formatTime={formatTime}
                      />
                    ))}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="unread" className="m-0">
                  <ScrollArea className="h-[500px]">
                    {filteredConversations.filter(c => c.unreadCount > 0).map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        isSelected={selectedContactId === conv.contact.id}
                        onSelect={() => setSelectedContactId(conv.contact.id)}
                        formatTime={formatTime}
                      />
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
                        {selectedConversation.contact.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{selectedConversation.contact.name || "Desconocido"}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {selectedConversation.contact.phone || "Sin teléfono"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedConversation.hasPaymentPending && (
                      <Badge variant="warning" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />Pago pendiente
                      </Badge>
                    )}
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
                        className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.direction === 'outgoing'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs opacity-70">
                              {formatTime(msg.created_at)}
                            </span>
                            {msg.is_payment_related && (
                              <DollarSign className="h-3 w-3 text-success" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
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
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={!selectedContactId}
                  />
                  <Button
                    size="icon"
                    className="gradient-primary shrink-0"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || !selectedContactId || sendMessage.isPending}
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

// Conversation item component
function ConversationItem({
  conversation,
  isSelected,
  onSelect,
  formatTime
}: {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  formatTime: (date: string | null) => string;
}) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-border/50 hover:bg-muted/30 ${
        isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""
      }`}
    >
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary/20 text-primary text-sm">
          {conversation.contact.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "??"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm truncate">{conversation.contact.name || "Desconocido"}</p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {conversation.lastMessage ? formatTime(conversation.lastMessage.created_at) : ""}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate mt-0.5">
          {conversation.lastMessage?.content || "Sin mensajes"}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          {conversation.hasPaymentPending && (
            <DollarSign className="h-3 w-3 text-success" />
          )}
          {conversation.unreadCount > 0 && (
            <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
              {conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
