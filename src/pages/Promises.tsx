import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  XCircle,
  CalendarClock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  usePaymentPromises,
  useCreatePaymentPromise,
  useMarkPromiseFulfilled,
  useMarkPromiseExpired,
  useContacts,
} from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { format, differenceInDays, parseISO, isPast, isToday } from "date-fns";
import { es } from "date-fns/locale";

const statusConfig = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    className: "bg-warning/10 text-warning border-warning/20",
  },
  fulfilled: {
    label: "Cumplida",
    icon: CheckCircle2,
    className: "bg-success/10 text-success border-success/20",
  },
  expired: {
    label: "Vencida",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export default function Promises() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPromise, setNewPromise] = useState({
    contactId: "",
    amount: "",
    currency: "PEN",
    promisedDate: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  const { data: promises, isLoading } = usePaymentPromises(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );
  const { data: contacts } = useContacts({ limit: 100 });
  const createPromise = useCreatePaymentPromise();
  const markFulfilled = useMarkPromiseFulfilled();
  const markExpired = useMarkPromiseExpired();

  // Filter promises by search
  const filteredPromises = promises?.filter((promise) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      promise.contacts?.name?.toLowerCase().includes(query) ||
      promise.contacts?.phone?.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const stats = {
    total: promises?.length || 0,
    pending: promises?.filter((p) => p.status === "pending").length || 0,
    fulfilled: promises?.filter((p) => p.status === "fulfilled").length || 0,
    expired: promises?.filter((p) => p.status === "expired").length || 0,
    totalAmount: promises
      ?.filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + (p.promised_amount || 0), 0) || 0,
    overdueCount: promises?.filter((p) => {
      if (p.status !== "pending") return false;
      return isPast(parseISO(p.promised_date)) && !isToday(parseISO(p.promised_date));
    }).length || 0,
  };

  // Get urgency badge
  const getUrgencyBadge = (promisedDate: string, status: string) => {
    if (status !== "pending") return null;

    const date = parseISO(promisedDate);
    const daysUntil = differenceInDays(date, new Date());

    if (daysUntil < 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Vencida hace {Math.abs(daysUntil)} días
        </Badge>
      );
    }
    if (daysUntil === 0) {
      return (
        <Badge className="gap-1 bg-warning text-warning-foreground">
          <AlertTriangle className="h-3 w-3" />
          Vence hoy
        </Badge>
      );
    }
    if (daysUntil <= 3) {
      return (
        <Badge variant="outline" className="gap-1 text-warning border-warning">
          <Clock className="h-3 w-3" />
          {daysUntil} días
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Calendar className="h-3 w-3" />
        {daysUntil} días
      </Badge>
    );
  };

  // Handle create promise
  const handleCreatePromise = async () => {
    if (!newPromise.contactId || !newPromise.amount || !newPromise.promisedDate) {
      toast.error("Completa todos los campos requeridos");
      return;
    }

    const amount = parseFloat(newPromise.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    const contact = contacts?.find((c) => c.id === newPromise.contactId);
    if (!contact) {
      toast.error("Contacto no encontrado");
      return;
    }

    try {
      await createPromise.mutateAsync({
        user_id: contact.user_id,
        contact_id: newPromise.contactId,
        promised_amount: amount,
        currency: newPromise.currency,
        promised_date: newPromise.promisedDate,
        notes: newPromise.notes || null,
        status: "pending",
        source: "manual",
      });

      toast.success("Promesa de pago creada");
      setIsCreateModalOpen(false);
      setNewPromise({
        contactId: "",
        amount: "",
        currency: "PEN",
        promisedDate: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });
    } catch (error) {
      toast.error("Error al crear la promesa");
    }
  };

  // Handle mark as fulfilled
  const handleMarkFulfilled = async (id: string) => {
    try {
      await markFulfilled.mutateAsync(id);
      toast.success("Promesa marcada como cumplida");
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  // Handle mark as expired
  const handleMarkExpired = async (id: string) => {
    try {
      await markExpired.mutateAsync(id);
      toast.success("Promesa marcada como vencida");
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Promesas de Pago</h1>
            <p className="text-muted-foreground">
              Gestiona las promesas de pago de tus contactos
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Promesa
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                S/ {stats.totalAmount.toLocaleString("es-PE")}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.pending} promesas activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cumplidas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.fulfilled}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.fulfilled / stats.total) * 100) : 0}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.expired}</div>
              <p className="text-xs text-muted-foreground">
                Promesas no cumplidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.overdueCount}</div>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por contacto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="fulfilled">Cumplidas</SelectItem>
                <SelectItem value="expired">Vencidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !filteredPromises?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarClock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No hay promesas</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Crea una nueva promesa de pago para comenzar
                </p>
                <Button
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Nueva Promesa
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha Prometida</TableHead>
                    <TableHead>Urgencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPromises.map((promise) => {
                    const status = statusConfig[promise.status as keyof typeof statusConfig] || statusConfig.pending;
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={promise.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                              <span className="text-sm font-medium">
                                {promise.contacts?.name?.[0]?.toUpperCase() || "?"}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{promise.contacts?.name || "Sin nombre"}</p>
                              <p className="text-xs text-muted-foreground">{promise.contacts?.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            S/ {promise.promised_amount?.toLocaleString("es-PE")}
                          </span>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(promise.promised_date), "d MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>
                          {getUrgencyBadge(promise.promised_date, promise.status)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={status.className}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {promise.notes || "-"}
                        </TableCell>
                        <TableCell>
                          {promise.status === "pending" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleMarkFulfilled(promise.id)}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                                  Marcar como cumplida
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleMarkExpired(promise.id)}
                                  className="text-destructive"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Marcar como vencida
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Promise Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Promesa de Pago</DialogTitle>
            <DialogDescription>
              Registra una nueva promesa de pago de un contacto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Contacto *</Label>
              <Select
                value={newPromise.contactId}
                onValueChange={(value) => setNewPromise({ ...newPromise, contactId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar contacto" />
                </SelectTrigger>
                <SelectContent>
                  {contacts?.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name || contact.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newPromise.amount}
                  onChange={(e) => setNewPromise({ ...newPromise, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select
                  value={newPromise.currency}
                  onValueChange={(value) => setNewPromise({ ...newPromise, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PEN">PEN (Soles)</SelectItem>
                    <SelectItem value="USD">USD (Dólares)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fecha Prometida *</Label>
              <Input
                type="date"
                value={newPromise.promisedDate}
                onChange={(e) => setNewPromise({ ...newPromise, promisedDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Input
                placeholder="Notas adicionales..."
                value={newPromise.notes}
                onChange={(e) => setNewPromise({ ...newPromise, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePromise} disabled={createPromise.isPending}>
              {createPromise.isPending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Crear Promesa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
