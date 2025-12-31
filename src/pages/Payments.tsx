import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
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
  Pencil,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { usePayments, usePaymentStats, useConfirmPayment, useRejectPayment, useDeletePayment, PaymentWithContact } from "@/hooks/usePayments";
import type { PaymentStatus } from "@/types/database";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const getStatusConfig = (status: string) => {
  switch (status) {
    case "confirmed":
      return { label: "Confirmado", icon: CheckCircle2, className: "bg-stitch-primary/15 text-stitch-primary" };
    case "pending":
      return { label: "Pendiente", icon: Clock, className: "bg-stitch-yellow/15 text-stitch-yellow" };
    case "rejected":
      return { label: "Rechazado", icon: XCircle, className: "bg-stitch-red/15 text-stitch-red" };
    case "cancelled":
      return { label: "Cancelado", icon: XCircle, className: "bg-stitch-muted/15 text-stitch-muted" };
    default:
      return { label: "Desconocido", icon: Clock, className: "bg-stitch-muted/15 text-stitch-muted" };
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 90) return "bg-stitch-primary";
  if (confidence >= 70) return "bg-stitch-yellow";
  return "bg-stitch-red";
};

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithContact | null>(null);
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: payments, isLoading } = usePayments(
    statusFilter !== "all" ? { status: statusFilter as PaymentStatus } : undefined
  );
  const { data: stats } = usePaymentStats();
  const confirmPayment = useConfirmPayment();
  const rejectPayment = useRejectPayment();
  const deletePayment = useDeletePayment();

  const hasNoPayments = !isLoading && (!payments || payments.length === 0);

  const filteredPayments = payments?.filter((payment) => {
    const contactName = payment.contact?.name || '';
    const matchesSearch = contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.reference_number && payment.reference_number.includes(searchTerm));
    return matchesSearch;
  }) || [];

  const userCurrency = profile?.currency || 'PEN';

  const formatCurrency = (amount: number, currency?: string) => {
    const curr = currency || userCurrency;
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleExport = () => {
    if (!payments || payments.length === 0) {
      toast.error("No hay pagos para exportar");
      return;
    }

    const data = payments.map(p => ({
      Fecha: format(new Date(p.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
      Contacto: p.contact?.name || 'Desconocido',
      Telefono: p.contact?.phone || '',
      Monto: p.amount,
      Moneda: p.currency || 'PEN',
      Metodo: p.method || '',
      Detalle: p.method_detail || '',
      Estado: p.status === 'confirmed' ? 'Confirmado' : p.status === 'pending' ? 'Pendiente' : 'Rechazado',
      Confianza: `${p.confidence_score || 0}%`,
      Referencia: p.reference_number || '',
      Notas: p.notes || '',
    }));

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pagos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success("Archivo CSV descargado");
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

  const handleOpenCreate = () => {
    setSelectedPayment(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (payment: PaymentWithContact) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const todayPayments = payments?.filter(p => {
    const today = new Date();
    const paymentDate = new Date(p.created_at);
    return paymentDate.toDateString() === today.toDateString();
  }) || [];

  const statsCards = [
    {
      title: "Total detectado",
      value: formatCurrency(stats?.totalAmount || 0, userCurrency),
      icon: DollarSign,
      color: "bg-stitch-primary/15 text-stitch-primary",
    },
    {
      title: "Confirmados",
      value: formatCurrency(stats?.confirmedAmount || 0, userCurrency),
      icon: CheckCircle2,
      color: "bg-stitch-primary/15 text-stitch-primary",
    },
    {
      title: "Pendientes",
      value: formatCurrency(stats?.pendingAmount || 0, userCurrency),
      icon: Clock,
      color: "bg-stitch-yellow/15 text-stitch-yellow",
    },
    {
      title: "Confianza promedio",
      value: `${(stats?.avgConfidence || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: "bg-stitch-primary/15 text-stitch-primary",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-stitch-text">Pagos</h1>
            <p className="text-stitch-muted">
              Gestiona y revisa todos los pagos detectados
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="bg-stitch-surface border-stitch text-stitch-text hover:bg-stitch-surface-elevated rounded-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button
              size="sm"
              className="gradient-primary text-white rounded-xl shadow-button"
              onClick={handleOpenCreate}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo pago
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <div
              key={stat.title}
              className="stitch-card animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-stitch-text">{stat.value}</p>
                  <p className="text-xs text-stitch-muted">{stat.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payments List */}
        <div className="stitch-card animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stitch pb-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-stitch-text">Historial de Pagos</h3>
              <p className="text-sm text-stitch-muted">Lista completa de pagos detectados</p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stitch-muted" />
                <Input
                  placeholder="Buscar pagos..."
                  className="pl-9 w-full sm:w-64 bg-stitch-surface-elevated border-stitch text-stitch-text placeholder:text-stitch-muted rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                <SelectTrigger className="w-36 bg-stitch-surface-elevated border-stitch text-stitch-text rounded-xl">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="bg-stitch-surface border-stitch">
                  <SelectItem value="all" className="text-stitch-text hover:bg-stitch-surface-elevated">Todos</SelectItem>
                  <SelectItem value="confirmed" className="text-stitch-text hover:bg-stitch-surface-elevated">Confirmados</SelectItem>
                  <SelectItem value="pending" className="text-stitch-text hover:bg-stitch-surface-elevated">Pendientes</SelectItem>
                  <SelectItem value="rejected" className="text-stitch-text hover:bg-stitch-surface-elevated">Rechazados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4 bg-stitch-surface-elevated border border-stitch rounded-xl p-1">
              <TabsTrigger
                value="all"
                className="rounded-lg data-[state=active]:bg-stitch-primary data-[state=active]:text-white text-stitch-muted"
              >
                Todos ({payments?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="today"
                className="rounded-lg data-[state=active]:bg-stitch-primary data-[state=active]:text-white text-stitch-muted"
              >
                Hoy ({todayPayments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="m-0">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-4 rounded-xl bg-stitch-surface-elevated/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-stitch-surface-elevated" />
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-stitch-surface-elevated rounded" />
                          <div className="h-3 w-16 bg-stitch-surface-elevated rounded" />
                        </div>
                      </div>
                      <div className="h-6 w-20 bg-stitch-surface-elevated rounded-full" />
                    </div>
                  ))}
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="stitch-empty py-16">
                  <div className="stitch-empty-icon">
                    <CreditCard className="h-10 w-10 text-stitch-muted" />
                  </div>
                  <h2 className="text-xl font-semibold text-stitch-text mb-2">Sin pagos registrados</h2>
                  <p className="text-stitch-muted max-w-md mb-6">
                    Los pagos que detectemos aparecerán aquí. Puedes agregar uno manualmente o conectar WhatsApp.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      className="gradient-primary text-white rounded-xl shadow-button"
                      onClick={handleOpenCreate}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar primer pago
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-stitch-surface border-stitch text-stitch-text hover:bg-stitch-surface-elevated rounded-xl"
                      onClick={() => navigate("/settings")}
                    >
                      Conectar WhatsApp
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPayments.map((payment, index) => {
                    const status = getStatusConfig(payment.status);
                    const StatusIcon = status.icon;

                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 sm:p-4 rounded-xl hover:bg-stitch-surface-elevated transition-colors cursor-pointer group animate-fade-in"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-stitch-surface-elevated group-hover:bg-stitch-primary/15 transition-colors flex-shrink-0">
                            <span className="text-sm font-semibold text-stitch-text group-hover:text-stitch-primary transition-colors">
                              {payment.contact?.name
                                ? payment.contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                                : "??"
                              }
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-stitch-text truncate">
                                {payment.contact?.name || 'Desconocido'}
                              </span>
                              {payment.method && (
                                <span className="hidden sm:flex items-center gap-1 text-xs text-stitch-muted">
                                  <Building2 className="h-3 w-3" />
                                  {payment.method_detail || payment.method}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-stitch-muted">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-stitch-text">
                              {formatCurrency(payment.amount, payment.currency)}
                            </p>
                            <div className="hidden sm:flex items-center gap-1 justify-end">
                              <div className="h-1.5 w-12 rounded-full bg-stitch-surface-elevated overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full", getConfidenceColor(payment.confidence_score))}
                                  style={{ width: `${payment.confidence_score}%` }}
                                />
                              </div>
                              <span className="text-xs text-stitch-muted">{payment.confidence_score}%</span>
                            </div>
                          </div>

                          <span className={cn("stitch-badge text-xs whitespace-nowrap", status.className)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">{status.label}</span>
                          </span>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-stitch-muted hover:text-stitch-text hover:bg-stitch-surface-elevated rounded-lg"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-stitch-surface border-stitch">
                              <DropdownMenuItem
                                onClick={() => handleOpenEdit(payment)}
                                className="text-stitch-text hover:bg-stitch-surface-elevated"
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-stitch-text hover:bg-stitch-surface-elevated">
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalle
                              </DropdownMenuItem>
                              {payment.status === 'pending' && (
                                <>
                                  <DropdownMenuSeparator className="bg-stitch-border" />
                                  <DropdownMenuItem
                                    onClick={() => handleConfirm(payment.id)}
                                    className="text-stitch-primary hover:bg-stitch-surface-elevated"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Confirmar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleReject(payment.id)}
                                    className="text-stitch-yellow hover:bg-stitch-surface-elevated"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Rechazar
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator className="bg-stitch-border" />
                              <DropdownMenuItem
                                className="text-stitch-red hover:bg-stitch-surface-elevated"
                                onClick={() => handleDelete(payment.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}

                  {/* Count */}
                  <div className="flex items-center justify-between pt-4 border-t border-stitch">
                    <p className="text-sm text-stitch-muted">
                      Mostrando {filteredPayments.length} pagos
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="today" className="m-0">
              {todayPayments.length === 0 ? (
                <div className="stitch-empty py-16">
                  <div className="stitch-empty-icon">
                    <Calendar className="h-10 w-10 text-stitch-muted" />
                  </div>
                  <h2 className="text-xl font-semibold text-stitch-text mb-2">Sin pagos hoy</h2>
                  <p className="text-stitch-muted max-w-md mb-6">
                    Aún no hay pagos registrados para hoy.
                  </p>
                  <Button
                    className="gradient-primary text-white rounded-xl shadow-button"
                    onClick={handleOpenCreate}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar pago
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayPayments.map((payment, index) => {
                    const status = getStatusConfig(payment.status);
                    const StatusIcon = status.icon;

                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 sm:p-4 rounded-xl hover:bg-stitch-surface-elevated transition-colors cursor-pointer group animate-fade-in"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stitch-surface-elevated group-hover:bg-stitch-primary/15 transition-colors flex-shrink-0">
                            <span className="text-sm font-semibold text-stitch-text group-hover:text-stitch-primary transition-colors">
                              {payment.contact?.name
                                ? payment.contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                                : "??"
                              }
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-sm text-stitch-text truncate block">
                              {payment.contact?.name || 'Desconocido'}
                            </span>
                            <span className="text-xs text-stitch-muted">
                              {format(new Date(payment.created_at), 'HH:mm', { locale: es })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-stitch-text">
                              {formatCurrency(payment.amount, payment.currency)}
                            </p>
                          </div>

                          <span className={cn("stitch-badge text-xs", status.className)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">{status.label}</span>
                          </span>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-stitch-muted hover:text-stitch-text hover:bg-stitch-surface-elevated rounded-lg"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-stitch-surface border-stitch">
                              <DropdownMenuItem
                                onClick={() => handleOpenEdit(payment)}
                                className="text-stitch-text hover:bg-stitch-surface-elevated"
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {payment.status === 'pending' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleConfirm(payment.id)}
                                    className="text-stitch-primary hover:bg-stitch-surface-elevated"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Confirmar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleReject(payment.id)}
                                    className="text-stitch-yellow hover:bg-stitch-surface-elevated"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Rechazar
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator className="bg-stitch-border" />
                              <DropdownMenuItem
                                className="text-stitch-red hover:bg-stitch-surface-elevated"
                                onClick={() => handleDelete(payment.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payment={selectedPayment}
      />
    </DashboardLayout>
  );
}
