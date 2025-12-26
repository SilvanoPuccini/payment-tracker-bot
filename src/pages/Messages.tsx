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
  Paperclip
} from "lucide-react";
import { useState } from "react";

const conversations = [
  {
    id: 1,
    name: "Juan Pérez",
    phone: "+51 999 888 777",
    lastMessage: "Te confirmo el pago de S/. 1,500 realizado hoy",
    time: "Hace 5 min",
    unread: 2,
    hasPayment: true,
    status: "confirmed",
  },
  {
    id: 2,
    name: "María García",
    phone: "+51 998 777 666",
    lastMessage: "Mañana te hago la transferencia del saldo pendiente",
    time: "Hace 15 min",
    unread: 0,
    hasPayment: false,
    status: "promise",
  },
  {
    id: 3,
    name: "Carlos López",
    phone: "+51 997 666 555",
    lastMessage: "Ya hice el depósito de 500 soles en BCP",
    time: "Hace 1 hora",
    unread: 1,
    hasPayment: true,
    status: "pending",
  },
  {
    id: 4,
    name: "Ana Rodríguez",
    phone: "+51 996 555 444",
    lastMessage: "Ok, entendido. Reviso y te confirmo",
    time: "Hace 2 horas",
    unread: 0,
    hasPayment: false,
    status: "none",
  },
  {
    id: 5,
    name: "Pedro Sánchez",
    phone: "+51 995 444 333",
    lastMessage: "Adjunto el voucher del pago de hoy",
    time: "Hace 3 horas",
    unread: 0,
    hasPayment: true,
    status: "confirmed",
  },
  {
    id: 6,
    name: "Laura Martínez",
    phone: "+51 994 333 222",
    lastMessage: "El viernes sin falta te pago todo",
    time: "Hace 5 horas",
    unread: 0,
    hasPayment: false,
    status: "promise",
  },
];

const messages = [
  {
    id: 1,
    sender: "contact",
    text: "Hola, te confirmo que acabo de realizar la transferencia",
    time: "10:30 AM",
  },
  {
    id: 2,
    sender: "contact",
    text: "Te confirmo el pago de S/. 1,500 realizado hoy por BCP a la cuenta terminada en 4532",
    time: "10:31 AM",
    isPayment: true,
  },
  {
    id: 3,
    sender: "system",
    text: "Pago detectado automáticamente: S/. 1,500.00 - Confianza: 94%",
    time: "10:31 AM",
    isSystem: true,
  },
  {
    id: 4,
    sender: "contact",
    text: "El número de operación es 78452136",
    time: "10:32 AM",
  },
  {
    id: 5,
    sender: "user",
    text: "Perfecto Juan, recibido. Gracias por confirmar.",
    time: "10:35 AM",
  },
];

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
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [searchTerm, setSearchTerm] = useState("");

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
                  <p className="text-2xl font-bold">156</p>
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
                  <p className="text-2xl font-bold">23</p>
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
                  <p className="text-2xl font-bold">8</p>
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
                  <p className="text-2xl font-bold">S/. 45,200</p>
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
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-border/50 hover:bg-muted/30 ${
                          selectedConversation.id === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                        }`}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20 text-primary text-sm">
                            {conv.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">{conv.name}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{conv.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {conv.hasPayment && (
                              <DollarSign className="h-3 w-3 text-success" />
                            )}
                            {getStatusBadge(conv.status)}
                            {conv.unread > 0 && (
                              <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                                {conv.unread}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="payments" className="m-0">
                  <ScrollArea className="h-[500px]">
                    {conversations.filter(c => c.hasPayment).map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-border/50 hover:bg-muted/30 ${
                          selectedConversation.id === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                        }`}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20 text-primary text-sm">
                            {conv.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">{conv.name}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{conv.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <DollarSign className="h-3 w-3 text-success" />
                            {getStatusBadge(conv.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="unread" className="m-0">
                  <ScrollArea className="h-[500px]">
                    {conversations.filter(c => c.unread > 0).map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-border/50 hover:bg-muted/30 ${
                          selectedConversation.id === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                        }`}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20 text-primary text-sm">
                            {conv.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">{conv.name}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{conv.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {conv.hasPayment && <DollarSign className="h-3 w-3 text-success" />}
                            {getStatusBadge(conv.status)}
                            <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                              {conv.unread}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {selectedConversation.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{selectedConversation.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {selectedConversation.phone}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedConversation.status)}
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages */}
              <ScrollArea className="h-[400px] p-4">
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
                            : msg.isSystem
                            ? "bg-success/10 border border-success/30 text-success rounded-bl-md"
                            : msg.isPayment
                            ? "bg-warning/10 border border-warning/30 text-foreground rounded-bl-md"
                            : "bg-muted/50 text-foreground rounded-bl-md"
                        }`}
                      >
                        {msg.isPayment && (
                          <div className="flex items-center gap-1.5 mb-1.5 text-warning">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Pago detectado</span>
                          </div>
                        )}
                        {msg.isSystem && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Sistema</span>
                          </div>
                        )}
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
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
                  />
                  <Button size="icon" className="gradient-primary text-primary-foreground shrink-0">
                    <Send className="h-4 w-4" />
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
