import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  usePayments,
  useConfirmPayment,
  useRejectPayment,
  useBulkConfirmPayments,
  useBulkRejectPayments,
} from "@/hooks/useSupabaseData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Download,
  DollarSign,
  TrendingUp,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const statusConfig = {
  detected: {
    label: "Detectado",
    icon: Clock,
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  confirmed: {
    label: "Confirmado",
    icon: CheckCircle2,
    color: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  rejected: {
    label: "Rechazado",
    icon: XCircle,
    color: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  duplicate: {
    label: "Duplicado",
    icon: AlertCircle,
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
};

const methodLabels: Record<string, string> = {
  yape: "Yape",
  plin: "Plin",
  transferencia: "Transferencia",
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  deposito: "Depósito",
};

const Payments = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirmDialogOpen, setBulkConfirmDialogOpen] = useState(false);
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);

  const { data: payments, isLoading, refetch } = usePayments({
    status: statusFilter !== "all" ? statusFilter : undefined,
    limit: 100,
  });

  const confirmPayment = useConfirmPayment();
  const rejectPayment = useRejectPayment();
  const bulkConfirm = useBulkConfirmPayments();
  const bulkReject = useBulkRejectPayments();

  const filteredPayments = payments?.filter((payment) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      payment.contacts?.name?.toLowerCase().includes(search) ||
      payment.contacts?.phone?.toLowerCase().includes(search) ||
      payment.reference?.toLowerCase().includes(search) ||
      payment.payment_method?.toLowerCase().includes(search)
    );
  });

  const handleConfirm = async () => {
    if (!selectedPayment) return;
    try {
      await confirmPayment.mutateAsync(selectedPayment.id);
      toast.success("Pago confirmado exitosamente");
      setConfirmDialogOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      toast.error("Error al confirmar el pago");
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    try {
      await rejectPayment.mutateAsync(selectedPayment.id);
      toast.success("Pago rechazado");
      setRejectDialogOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      toast.error("Error al rechazar el pago");
    }
  };

  // Bulk selection helpers
  const detectablePayments = filteredPayments?.filter((p) => p.status === "detected") || [];
  const allDetectableSelected =
    detectablePayments.length > 0 &&
    detectablePayments.every((p) => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allDetectableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(detectablePayments.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkConfirm = async () => {
    try {
      const result = await bulkConfirm.mutateAsync(Array.from(selectedIds));
      toast.success(`${result.success} pagos confirmados${result.failed > 0 ? `, ${result.failed} fallaron` : ""}`);
      setSelectedIds(new Set());
      setBulkConfirmDialogOpen(false);
    } catch (error) {
      toast.error("Error al confirmar los pagos");
    }
  };

  const handleBulkReject = async () => {
    try {
      const result = await bulkReject.mutateAsync(Array.from(selectedIds));
      toast.success(`${result.success} pagos rechazados${result.failed > 0 ? `, ${result.failed} fallaron` : ""}`);
      setSelectedIds(new Set());
      setBulkRejectDialogOpen(false);
    } catch (error) {
      toast.error("Error al rechazar los pagos");
    }
  };

  // Calculate bulk selection totals
  const selectedPayments = filteredPayments?.filter((p) => selectedIds.has(p.id)) || [];
  const selectedTotal = selectedPayments.reduce((sum, p) => sum + p.amount, 0);

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

  const exportToCSV = () => {
    if (!filteredPayments?.length) return;

    const headers = ["Fecha", "Contacto", "Monto", "Método", "Referencia", "Estado"];
    const rows = filteredPayments.map((p) => [
      p.payment_date,
      p.contacts?.name || p.contacts?.phone,
      `${p.currency} ${p.amount}`,
      p.payment_method || "",
      p.reference || "",
      statusConfig[p.status as keyof typeof statusConfig]?.label || p.status,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pagos-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("CSV exportado");
  };

  // Calculate summary stats
  const totalAmount = filteredPayments?.reduce((sum, p) => {
    if (p.status === "confirmed") return sum + p.amount;
    return sum;
  }, 0) || 0;

  const pendingCount = filteredPayments?.filter((p) => p.status === "detected").length || 0;
  const confirmedCount = filteredPayments?.filter((p) => p.status === "confirmed").length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pagos</h1>
            <p className="text-muted-foreground">
              Gestiona y confirma los pagos detectados
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Confirmado</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/20">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes de Revisión</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pagos Confirmados</p>
                  <p className="text-2xl font-bold">{confirmedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por contacto, referencia..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="detected">Detectado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                  <SelectItem value="duplicate">Duplicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {someSelected && (
          <Card className="glass-card border-primary/50 bg-primary/5">
            <CardContent className="py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <CheckCheck className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {selectedIds.size} pago{selectedIds.size !== 1 ? "s" : ""} seleccionado{selectedIds.size !== 1 ? "s" : ""}
                  </span>
                  <Badge variant="secondary">
                    Total: {formatCurrency(selectedTotal)}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Deseleccionar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkRejectDialogOpen(true)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar todos
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setBulkConfirmDialogOpen(true)}
                    className="gradient-primary text-primary-foreground"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirmar todos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payments Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Pagos Registrados
              {filteredPayments && (
                <Badge variant="secondary" className="ml-2">
                  {filteredPayments.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !filteredPayments?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No hay pagos</h3>
                <p className="text-sm text-muted-foreground">
                  Los pagos detectados aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={allDetectableSelected}
                          onCheckedChange={toggleSelectAll}
                          disabled={detectablePayments.length === 0}
                          aria-label="Seleccionar todos los pagos pendientes"
                        />
                      </TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Confianza</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => {
                      const status = statusConfig[payment.status as keyof typeof statusConfig];
                      const StatusIcon = status?.icon || Clock;
                      const isDetected = payment.status === "detected";
                      const isSelected = selectedIds.has(payment.id);

                      return (
                        <TableRow
                          key={payment.id}
                          className={`hover:bg-muted/50 ${isSelected ? "bg-primary/5" : ""}`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(payment.id)}
                              disabled={!isDetected}
                              aria-label={`Seleccionar pago de ${payment.contacts?.name || payment.contacts?.phone}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {format(new Date(payment.payment_date), "dd MMM yyyy", {
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {payment.contacts?.name || "Sin nombre"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {payment.contacts?.phone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-primary">
                              {formatCurrency(payment.amount, payment.currency)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {payment.payment_method && (
                              <Badge variant="outline">
                                {methodLabels[payment.payment_method] || payment.payment_method}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {payment.reference || "-"}
                          </TableCell>
                          <TableCell>
                            {payment.confidence !== null && (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-12 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      payment.confidence >= 0.7
                                        ? "bg-green-500"
                                        : payment.confidence >= 0.5
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{ width: `${payment.confidence * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs">
                                  {Math.round(payment.confidence * 100)}%
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={status?.color}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {status?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setSelectedPayment(payment)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver detalle
                                </DropdownMenuItem>
                                {payment.status === "detected" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedPayment(payment);
                                        setConfirmDialogOpen(true);
                                      }}
                                      className="text-green-400"
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Confirmar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedPayment(payment);
                                        setRejectDialogOpen(true);
                                      }}
                                      className="text-red-400"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Rechazar
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

        {/* Confirm Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Pago</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas confirmar este pago?
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-2 py-4">
                <p>
                  <span className="text-muted-foreground">Contacto:</span>{" "}
                  {selectedPayment.contacts?.name}
                </p>
                <p>
                  <span className="text-muted-foreground">Monto:</span>{" "}
                  <span className="font-bold text-primary">
                    {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Fecha:</span>{" "}
                  {format(new Date(selectedPayment.payment_date), "dd/MM/yyyy")}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={confirmPayment.isPending}>
                {confirmPayment.isPending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Confirmar Pago
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rechazar Pago</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas rechazar este pago?
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-2 py-4">
                <p>
                  <span className="text-muted-foreground">Contacto:</span>{" "}
                  {selectedPayment.contacts?.name}
                </p>
                <p>
                  <span className="text-muted-foreground">Monto:</span>{" "}
                  {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectPayment.isPending}
              >
                {rejectPayment.isPending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Rechazar Pago
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog
          open={!!selectedPayment && !confirmDialogOpen && !rejectDialogOpen}
          onOpenChange={() => setSelectedPayment(null)}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalle del Pago</DialogTitle>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Contacto</p>
                    <p className="font-medium">{selectedPayment.contacts?.name}</p>
                    <p className="text-sm">{selectedPayment.contacts?.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monto</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {format(new Date(selectedPayment.payment_date), "dd MMMM yyyy", {
                        locale: es,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Método</p>
                    <p className="font-medium">
                      {methodLabels[selectedPayment.payment_method] ||
                        selectedPayment.payment_method ||
                        "-"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Referencia</p>
                    <p className="font-medium">{selectedPayment.reference || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Confianza IA</p>
                    <p className="font-medium">
                      {selectedPayment.confidence
                        ? `${Math.round(selectedPayment.confidence * 100)}%`
                        : "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge
                    variant="outline"
                    className={
                      statusConfig[selectedPayment.status as keyof typeof statusConfig]?.color
                    }
                  >
                    {statusConfig[selectedPayment.status as keyof typeof statusConfig]?.label}
                  </Badge>
                </div>

                {selectedPayment.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notas</p>
                    <p className="text-sm">{selectedPayment.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Bulk Confirm Dialog */}
        <Dialog open={bulkConfirmDialogOpen} onOpenChange={setBulkConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Múltiples Pagos</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas confirmar todos los pagos seleccionados?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagos seleccionados:</span>
                  <span className="font-bold">{selectedIds.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto total:</span>
                  <span className="font-bold text-primary">{formatCurrency(selectedTotal)}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Esta acción confirmará todos los pagos seleccionados y los marcará como cobrados.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkConfirmDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleBulkConfirm}
                disabled={bulkConfirm.isPending}
                className="gradient-primary text-primary-foreground"
              >
                {bulkConfirm.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Confirmar {selectedIds.size} Pagos
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Reject Dialog */}
        <Dialog open={bulkRejectDialogOpen} onOpenChange={setBulkRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rechazar Múltiples Pagos</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas rechazar todos los pagos seleccionados?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagos seleccionados:</span>
                  <span className="font-bold">{selectedIds.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto total:</span>
                  <span className="font-bold">{formatCurrency(selectedTotal)}</span>
                </div>
              </div>
              <p className="text-sm text-amber-500">
                ⚠️ Esta acción rechazará todos los pagos seleccionados. Esta acción no se puede deshacer.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkRejectDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkReject}
                disabled={bulkReject.isPending}
              >
                {bulkReject.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Rechazar {selectedIds.size} Pagos
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Payments;
