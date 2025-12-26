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
  Trash2,
  Plus,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { usePayments, usePaymentStats, useConfirmPayment, useRejectPayment, useDeletePayment } from "@/hooks/usePayments";
import { PaymentStatus } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const getStatusBadge = (status: PaymentStatus) => {
  switch (status) {
    case "confirmed":
      return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" />Confirmado</Badge>;
    case "pending":
      return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
    case "rejected":
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rechazado</Badge>;
    case "cancelled":
      return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>;
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
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");

  const { data: payments, isLoading } = usePayments(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );
  const { data: stats } = usePaymentStats();
  const confirmPayment = useConfirmPayment();
  const rejectPayment = useRejectPayment();
  const deletePayment = useDeletePayment();

  const filteredPayments = payments?.filter((payment) => {
    const contactName = payment.contact?.name || '';
    const matchesSearch = contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  const formatCurrency = (amount: number, currency: string = 'PEN') => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleConfirm = async (id: string) => {
    await confirmPayment.mutateAsync(id);
  };

  const handleReject = async (id: string) => {
    await rejectPayment.mutateAsync(id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este pago?')) {
      await deletePayment.mutateAsync(id);
    }
  };

  const todayPayments = payments?.filter(p => {
    const today = new Date();
    const paymentDate = new Date(p.created_at);
    return paymentDate.toDateString() === today.toDateString();
  }) || [];

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
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats?.totalAmount || 0)}
                  </p>
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
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats?.confirmedAmount || 0)}
                  </p>
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
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats?.pendingAmount || 0)}
                  </p>
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
                  <p className="text-2xl font-bold">{(stats?.avgConfidence || 0).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Confianza promedio</p>
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
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PaymentStatus | "all")}>
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
                <TabsTrigger value="all">Todos ({payments?.length || 0})</TabsTrigger>
                <TabsTrigger value="today">Hoy ({todayPayments.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="m-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay pagos registrados</p>
                    <p className="text-xs text-muted-foreground mt-1">Los pagos aparecerán aquí cuando se detecten</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
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
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                      {payment.contact?.name
                                        ? payment.contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                                        : "??"
                                      }
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <span className="font-medium text-sm">{payment.contact?.name || 'Desconocido'}</span>
                                    <p className="text-xs text-muted-foreground">{payment.contact?.phone || ''}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-semibold text-foreground">
                                  {formatCurrency(payment.amount, payment.currency)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-sm">{payment.method_detail || payment.method || 'N/A'}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm">{format(new Date(payment.created_at), 'dd/MM/yyyy', { locale: es })}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(payment.created_at), 'HH:mm', { locale: es })}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={payment.confidence_score}
                                    className={`h-2 w-16 ${getConfidenceColor(payment.confidence_score)}`}
                                  />
                                  <span className="text-xs font-medium">{payment.confidence_score}%</span>
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
                                    {payment.status === 'pending' && (
                                      <>
                                        <DropdownMenuItem onClick={() => handleConfirm(payment.id)}>
                                          <CheckCircle2 className="h-4 w-4 mr-2" />
                                          Confirmar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleReject(payment.id)}>
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Rechazar
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => handleDelete(payment.id)}
                                    >
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

                    {/* Count */}
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Mostrando {filteredPayments.length} pagos
                      </p>
                    </div>
                  </>
                )}
              </TabsContent>
              <TabsContent value="today" className="m-0">
                {todayPayments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay pagos de hoy</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
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
                        {todayPayments.map((payment) => (
                          <TableRow key={payment.id} className="hover:bg-muted/20">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                    {payment.contact?.name
                                      ? payment.contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                                      : "??"
                                    }
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">{payment.contact?.name || 'Desconocido'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-foreground">
                                {formatCurrency(payment.amount, payment.currency)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{payment.method_detail || payment.method || 'N/A'}</span>
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(payment.created_at), 'HH:mm', { locale: es })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={payment.confidence_score}
                                  className={`h-2 w-16 ${getConfidenceColor(payment.confidence_score)}`}
                                />
                                <span className="text-xs font-medium">{payment.confidence_score}%</span>
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
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
