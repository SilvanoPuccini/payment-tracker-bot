import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Star,
  MoreVertical,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  UserPlus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

const contacts = [
  {
    id: 1,
    name: "Juan Pérez",
    phone: "+51 999 888 777",
    email: "juan.perez@email.com",
    location: "Lima, Perú",
    status: "active",
    totalPayments: 12500.00,
    pendingAmount: 0,
    paymentCount: 8,
    lastPayment: "Hace 2 días",
    reliability: 98,
    starred: true,
  },
  {
    id: 2,
    name: "María García",
    phone: "+51 998 777 666",
    email: "maria.garcia@email.com",
    location: "Arequipa, Perú",
    status: "pending",
    totalPayments: 8300.50,
    pendingAmount: 2300.50,
    paymentCount: 5,
    lastPayment: "Hace 1 semana",
    reliability: 75,
    starred: false,
  },
  {
    id: 3,
    name: "Carlos López",
    phone: "+51 997 666 555",
    email: "carlos.lopez@email.com",
    location: "Cusco, Perú",
    status: "active",
    totalPayments: 4200.00,
    pendingAmount: 500.00,
    paymentCount: 3,
    lastPayment: "Hoy",
    reliability: 85,
    starred: true,
  },
  {
    id: 4,
    name: "Ana Rodríguez",
    phone: "+51 996 555 444",
    email: "ana.rodriguez@email.com",
    location: "Trujillo, Perú",
    status: "inactive",
    totalPayments: 1500.00,
    pendingAmount: 3200.00,
    paymentCount: 1,
    lastPayment: "Hace 1 mes",
    reliability: 45,
    starred: false,
  },
  {
    id: 5,
    name: "Pedro Sánchez",
    phone: "+51 995 444 333",
    email: "pedro.sanchez@email.com",
    location: "Lima, Perú",
    status: "active",
    totalPayments: 15800.00,
    pendingAmount: 0,
    paymentCount: 12,
    lastPayment: "Ayer",
    reliability: 100,
    starred: true,
  },
  {
    id: 6,
    name: "Laura Martínez",
    phone: "+51 994 333 222",
    email: "laura.martinez@email.com",
    location: "Piura, Perú",
    status: "pending",
    totalPayments: 6200.00,
    pendingAmount: 1800.00,
    paymentCount: 4,
    lastPayment: "Hace 3 días",
    reliability: 70,
    starred: false,
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" />Activo</Badge>;
    case "pending":
      return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
    case "inactive":
      return <Badge variant="secondary">Inactivo</Badge>;
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalContacts = contacts.length;
  const activeContacts = contacts.filter(c => c.status === "active").length;
  const totalRevenue = contacts.reduce((sum, c) => sum + c.totalPayments, 0);
  const totalPending = contacts.reduce((sum, c) => sum + c.pendingAmount, 0);

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
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
            <Button size="sm" className="gradient-primary text-primary-foreground">
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
                  <p className="text-2xl font-bold">{totalContacts}</p>
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
                  <p className="text-2xl font-bold">{activeContacts}</p>
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
                  <p className="text-2xl font-bold">S/. {totalRevenue.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold">S/. {totalPending.toLocaleString()}</p>
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
                        {contact.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{contact.name}</h3>
                        {contact.starred && (
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
                      <DropdownMenuItem>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Enviar mensaje
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Phone className="h-4 w-4 mr-2" />
                        Llamar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Star className="h-4 w-4 mr-2" />
                        {contact.starred ? "Quitar favorito" : "Agregar favorito"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{contact.location}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="rounded-lg bg-muted/30 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total pagado</span>
                    <span className="text-sm font-semibold text-success">
                      S/. {contact.totalPayments.toLocaleString()}
                    </span>
                  </div>
                  {contact.pendingAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Pendiente</span>
                      <span className="text-sm font-semibold text-warning">
                        S/. {contact.pendingAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Confiabilidad</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={contact.reliability}
                        className="h-2 w-16"
                      />
                      <span className={`text-xs font-medium ${getReliabilityColor(contact.reliability)}`}>
                        {contact.reliability}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Último pago: {contact.lastPayment}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    <span>{contact.paymentCount} pagos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredContacts.length === 0 && (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No se encontraron contactos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Intenta con otros términos de búsqueda
              </p>
              <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
                Limpiar búsqueda
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
