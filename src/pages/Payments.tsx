import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Building2,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

const payments = [
  {
    id: "PAY-001",
    contact: "Juan Pérez",
    amount: 1500.00,
    currency: "PEN",
    status: "confirmed",
    method: "Transferencia BCP",
    date: "2024-01-15",
    time: "10:32 AM",
    confidence: 94,
    reference: "78452136",
  },
  {
    id: "PAY-002",
    contact: "María García",
    amount: 2300.50,
    currency: "PEN",
    status: "pending",
    method: "Yape",
    date: "2024-01-15",
    time: "09:45 AM",
    confidence: 87,
    reference: "YAP-9823",
  },
  {
    id: "PAY-003",
    contact: "Carlos López",
    amount: 500.00,
    currency: "PEN",
    status: "confirmed",
    method: "Depósito BCP",
    date: "2024-01-15",
    time: "08:20 AM",
    confidence: 92,
    reference: "DEP-4521",
  },
  {
    id: "PAY-004",
    contact: "Ana Rodríguez",
    amount: 3200.00,
    currency: "PEN",
    status: "rejected",
    method: "Transferencia BBVA",
    date: "2024-01-14",
    time: "16:50 PM",
    confidence: 45,
    reference: "N/A",
  },
  {
    id: "PAY-005",
    contact: "Pedro Sánchez",
    amount: 750.00,
    currency: "PEN",
    status: "confirmed",
    method: "Plin",
    date: "2024-01-14",
    time: "14:30 PM",
    confidence: 98,
    reference: "PLIN-7821",
  },
  {
    id: "PAY-006",
    contact: "Laura Martínez",
    amount: 1800.00,
    currency: "PEN",
    status: "pending",
    method: "Transferencia Interbank",
    date: "2024-01-14",
    time: "11:15 AM",
    confidence: 72,
    reference: "INT-3456",
  },
  {
    id: "PAY-007",
    contact: "Roberto Díaz",
    amount: 4500.00,
    currency: "PEN",
    status: "confirmed",
    method: "Transferencia BCP",
    date: "2024-01-13",
    time: "17:20 PM",
    confidence: 96,
    reference: "BCP-9012",
  },
  {
    id: "PAY-008",
    contact: "Carmen Flores",
    amount: 620.00,
    currency: "PEN",
    status: "pending",
    method: "Yape",
    date: "2024-01-13",
    time: "10:05 AM",
    confidence: 68,
    reference: "YAP-5678",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "confirmed":
      return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" />Confirmado</Badge>;
    case "pending":
      return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
    case "rejected":
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rechazado</Badge>;
    default:
      return null;
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 90) return "bg-success";
  if (confidence >= 70) return "bg-warning";
  return "bg-destructive";
};

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = payment.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalConfirmed = payments.filter(p => p.status === "confirmed").reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);
  const totalRejected = payments.filter(p => p.status === "rejected").reduce((sum, p) => sum + p.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pagos</h1>
            <p className="text-muted-foreground">
              Gestiona y revisa todos los pagos detectados por el sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm" className="gradient-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Registrar pago
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                  <DollarSign className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">S/. {(totalConfirmed + totalPending).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total detectado</p>
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
                  <p className="text-2xl font-bold">S/. {totalConfirmed.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Confirmados</p>
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
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">94.2%</p>
                  <p className="text-xs text-muted-foreground">Tasa de detección</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Historial de Pagos</CardTitle>
                <CardDescription>Lista completa de pagos detectados y registrados</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar pagos..."
                    className="pl-9 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="confirmed">Confirmados</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="rejected">Rechazados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Todos ({payments.length})</TabsTrigger>
                <TabsTrigger value="today">Hoy ({payments.filter(p => p.date === "2024-01-15").length})</TabsTrigger>
                <TabsTrigger value="week">Esta semana</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="m-0">
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead>ID</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Confianza</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-muted/20">
                          <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                  {payment.contact.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{payment.contact}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-foreground">
                              S/. {payment.amount.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">{payment.method}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <div>
                                <p className="text-sm">{payment.date}</p>
                                <p className="text-xs text-muted-foreground">{payment.time}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={payment.confidence}
                                className={`h-2 w-16 ${getConfidenceColor(payment.confidence)}`}
                              />
                              <span className="text-xs font-medium">{payment.confidence}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalle
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Confirmar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {filteredPayments.length} de {payments.length} pagos
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm">
                      Siguiente
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="today" className="m-0">
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead>ID</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Confianza</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.filter(p => p.date === "2024-01-15").map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-muted/20">
                          <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                  {payment.contact.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{payment.contact}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-foreground">
                              S/. {payment.amount.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">{payment.method}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{payment.time}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={payment.confidence}
                                className={`h-2 w-16 ${getConfidenceColor(payment.confidence)}`}
                              />
                              <span className="text-xs font-medium">{payment.confidence}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="week" className="m-0">
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Vista de pagos semanales
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
