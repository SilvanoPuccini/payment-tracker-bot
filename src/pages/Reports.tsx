import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { usePayments, useContacts, useMessages, useDebts } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { format, subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    start: format(subMonths(new Date(), 3), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });
  const [reportType, setReportType] = useState("general");

  const { data: payments, isLoading: loadingPayments } = usePayments({ limit: 1000 });
  const { data: contacts, isLoading: loadingContacts } = useContacts({ limit: 100 });
  const { data: debts, isLoading: loadingDebts } = useDebts({ limit: 100 });
  const { data: messages, isLoading: loadingMessages } = useMessages({ limit: 1000 });

  const isLoading = loadingPayments || loadingContacts || loadingDebts || loadingMessages;

  // Filter payments by date range
  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    return payments.filter((p) => {
      if (!p.payment_date) return false;
      const paymentDate = parseISO(p.payment_date);
      return isWithinInterval(paymentDate, {
        start: parseISO(dateRange.start),
        end: parseISO(dateRange.end),
      });
    });
  }, [payments, dateRange]);

  // Monthly summary data
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { month: string; ingresos: number; count: number }>();

    filteredPayments
      .filter((p) => p.status === "confirmed")
      .forEach((payment) => {
        const monthKey = format(parseISO(payment.payment_date!), "yyyy-MM");
        const monthLabel = format(parseISO(payment.payment_date!), "MMM yy", { locale: es });

        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, { month: monthLabel, ingresos: 0, count: 0 });
        }
        const existing = monthMap.get(monthKey)!;
        existing.ingresos += payment.amount;
        existing.count += 1;
      });

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data);
  }, [filteredPayments]);

  // Payment method distribution
  const methodDistribution = useMemo(() => {
    const methodMap = new Map<string, number>();

    filteredPayments
      .filter((p) => p.status === "confirmed" && p.payment_method)
      .forEach((payment) => {
        const method = payment.payment_method || "Otro";
        methodMap.set(method, (methodMap.get(method) || 0) + payment.amount);
      });

    return Array.from(methodMap.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round(value * 100) / 100,
    }));
  }, [filteredPayments]);

  // Top contacts by payment amount
  const topContacts = useMemo(() => {
    const contactMap = new Map<string, { name: string; phone: string; total: number; count: number }>();

    filteredPayments
      .filter((p) => p.status === "confirmed" && p.contacts)
      .forEach((payment) => {
        const contactId = payment.contact_id;
        if (!contactMap.has(contactId)) {
          contactMap.set(contactId, {
            name: payment.contacts?.name || "Sin nombre",
            phone: payment.contacts?.phone || "",
            total: 0,
            count: 0,
          });
        }
        const existing = contactMap.get(contactId)!;
        existing.total += payment.amount;
        existing.count += 1;
      });

    return Array.from(contactMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredPayments]);

  // Summary stats
  const stats = useMemo(() => {
    const confirmedPayments = filteredPayments.filter((p) => p.status === "confirmed");
    const pendingPayments = filteredPayments.filter((p) => p.status === "detected");

    const totalConfirmed = confirmedPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    const avgPayment = confirmedPayments.length > 0 ? totalConfirmed / confirmedPayments.length : 0;

    // Compare with previous period
    const periodLength = Math.ceil(
      (parseISO(dateRange.end).getTime() - parseISO(dateRange.start).getTime()) / (1000 * 60 * 60 * 24)
    );
    const previousStart = format(subDays(parseISO(dateRange.start), periodLength), "yyyy-MM-dd");
    const previousEnd = format(subDays(parseISO(dateRange.start), 1), "yyyy-MM-dd");

    const previousPayments = payments?.filter((p) => {
      if (!p.payment_date || p.status !== "confirmed") return false;
      const paymentDate = parseISO(p.payment_date);
      return isWithinInterval(paymentDate, {
        start: parseISO(previousStart),
        end: parseISO(previousEnd),
      });
    }) || [];

    const previousTotal = previousPayments.reduce((sum, p) => sum + p.amount, 0);
    const percentChange = previousTotal > 0 ? ((totalConfirmed - previousTotal) / previousTotal) * 100 : 0;

    return {
      totalConfirmed,
      totalPending,
      avgPayment,
      paymentCount: confirmedPayments.length,
      pendingCount: pendingPayments.length,
      percentChange,
      activeContacts: new Set(confirmedPayments.map((p) => p.contact_id)).size,
    };
  }, [filteredPayments, payments, dateRange]);

  // Export report to CSV
  const handleExportReport = () => {
    try {
      let csvContent = "";
      let filename = "";

      if (reportType === "general") {
        // General summary report
        csvContent = [
          "Reporte General de Pagos",
          `Período: ${dateRange.start} a ${dateRange.end}`,
          "",
          "Resumen",
          `Total Confirmado,${stats.totalConfirmed.toFixed(2)}`,
          `Total Pendiente,${stats.totalPending.toFixed(2)}`,
          `Cantidad de Pagos,${stats.paymentCount}`,
          `Promedio por Pago,${stats.avgPayment.toFixed(2)}`,
          `Contactos Activos,${stats.activeContacts}`,
          "",
          "Pagos por Mes",
          "Mes,Ingresos,Cantidad",
          ...monthlyData.map((m) => `${m.month},${m.ingresos.toFixed(2)},${m.count}`),
          "",
          "Top Contactos",
          "Nombre,Teléfono,Total,Cantidad",
          ...topContacts.map((c) => `${c.name},${c.phone},${c.total.toFixed(2)},${c.count}`),
        ].join("\n");
        filename = `reporte-general-${dateRange.start}-${dateRange.end}.csv`;
      } else if (reportType === "contacts") {
        // Contacts detailed report
        csvContent = [
          "Reporte de Contactos",
          `Período: ${dateRange.start} a ${dateRange.end}`,
          "",
          "Contacto,Teléfono,Total Pagado,Cantidad Pagos",
          ...topContacts.map((c) => `"${c.name}","${c.phone}",${c.total.toFixed(2)},${c.count}`),
        ].join("\n");
        filename = `reporte-contactos-${dateRange.start}-${dateRange.end}.csv`;
      } else if (reportType === "methods") {
        // Payment methods report
        csvContent = [
          "Reporte por Método de Pago",
          `Período: ${dateRange.start} a ${dateRange.end}`,
          "",
          "Método,Total",
          ...methodDistribution.map((m) => `${m.name},${m.value.toFixed(2)}`),
        ].join("\n");
        filename = `reporte-metodos-${dateRange.start}-${dateRange.end}.csv`;
      }

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Reporte exportado correctamente");
    } catch (error) {
      toast.error("Error al exportar el reporte");
    }
  };

  // Quick date range presets
  const setPresetRange = (preset: string) => {
    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (preset) {
      case "7d":
        start = subDays(today, 7);
        break;
      case "30d":
        start = subDays(today, 30);
        break;
      case "90d":
        start = subDays(today, 90);
        break;
      case "thisMonth":
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case "lastMonth":
        start = startOfMonth(subMonths(today, 1));
        end = endOfMonth(subMonths(today, 1));
        break;
      case "6m":
        start = subMonths(today, 6);
        break;
      case "1y":
        start = subMonths(today, 12);
        break;
      default:
        return;
    }

    setDateRange({
      start: format(start, "yyyy-MM-dd"),
      end: format(end, "yyyy-MM-dd"),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
            <p className="text-muted-foreground">
              Análisis detallado de pagos y tendencias
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="contacts">Por Contacto</SelectItem>
                <SelectItem value="methods">Por Método</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Date Range Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período de Análisis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label>Desde</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-40"
                />
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-40"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setPresetRange("7d")}>
                  7 días
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPresetRange("30d")}>
                  30 días
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPresetRange("thisMonth")}>
                  Este mes
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPresetRange("lastMonth")}>
                  Mes anterior
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPresetRange("90d")}>
                  3 meses
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPresetRange("6m")}>
                  6 meses
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPresetRange("1y")}>
                  1 año
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Confirmado</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                S/ {stats.totalConfirmed.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stats.percentChange >= 0 ? (
                  <>
                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+{stats.percentChange.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                    <span className="text-red-500">{stats.percentChange.toFixed(1)}%</span>
                  </>
                )}
                <span className="ml-1">vs período anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Confirmados</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paymentCount}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingCount} pendientes de confirmar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Pago</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                S/ {stats.avgPayment.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Por transacción confirmada
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contactos Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeContacts}</div>
              <p className="text-xs text-muted-foreground">
                Con pagos en el período
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia Mensual</CardTitle>
              <CardDescription>Ingresos por mes en el período seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`,
                        "Ingresos",
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="ingresos" fill="#10B981" name="Ingresos" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No hay datos para el período seleccionado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Método</CardTitle>
              <CardDescription>Montos por método de pago</CardDescription>
            </CardHeader>
            <CardContent>
              {methodDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={methodDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {methodDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`,
                        "Total",
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No hay datos de métodos de pago
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Contacts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Contactos</CardTitle>
            <CardDescription>Contactos con mayores montos de pago en el período</CardDescription>
          </CardHeader>
          <CardContent>
            {topContacts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead className="text-right">Total Pagado</TableHead>
                    <TableHead className="text-right">N° Pagos</TableHead>
                    <TableHead className="text-right">Promedio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topContacts.map((contact, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell className="text-muted-foreground">{contact.phone}</TableCell>
                      <TableCell className="text-right font-medium">
                        S/ {contact.total.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">{contact.count}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        S/ {(contact.total / contact.count).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No hay datos de contactos para el período seleccionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
