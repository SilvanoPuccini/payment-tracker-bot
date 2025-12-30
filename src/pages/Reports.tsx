import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  MessageSquare,
  CheckCircle2,
  Calendar,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";
import { toast } from "sonner";
import { useMonthlyStats, useWeeklyActivity, useTopContacts, useDashboardStats } from "@/hooks/useDashboard";
import { useContactStats } from "@/hooks/useContacts";
import { useMessageStats } from "@/hooks/useMessages";
import { usePaymentStats, usePayments, type PaymentWithContact } from "@/hooks/usePayments";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/ui/empty-state";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { ReportGenerator } from "@/components/reports/ReportGenerator";
import { generatePaymentReport, downloadPDF, type ReportData } from "@/lib/pdf-generator";
import { formatCurrency as formatCurrencyLib, type CurrencyCode } from "@/lib/currency";
import * as XLSX from "xlsx";

// Payment method colors
const METHOD_COLORS: Record<string, string> = {
  transfer: "hsl(173, 80%, 40%)",
  transferencia: "hsl(173, 80%, 40%)",
  cash: "hsl(142, 71%, 45%)",
  efectivo: "hsl(142, 71%, 45%)",
  deposit: "hsl(38, 92%, 50%)",
  deposito: "hsl(38, 92%, 50%)",
  depósito: "hsl(38, 92%, 50%)",
  debit: "hsl(222, 47%, 50%)",
  debito: "hsl(222, 47%, 50%)",
  débito: "hsl(222, 47%, 50%)",
  credit: "hsl(280, 60%, 50%)",
  credito: "hsl(280, 60%, 50%)",
  crédito: "hsl(280, 60%, 50%)",
  other: "hsl(222, 30%, 40%)",
  otro: "hsl(222, 30%, 40%)",
};

const METHOD_LABELS: Record<string, string> = {
  transfer: "Transferencia",
  transferencia: "Transferencia",
  cash: "Efectivo",
  efectivo: "Efectivo",
  deposit: "Depósito",
  deposito: "Depósito",
  depósito: "Depósito",
  debit: "Débito",
  debito: "Débito",
  débito: "Débito",
  credit: "Crédito",
  credito: "Crédito",
  crédito: "Crédito",
  other: "Otro",
  otro: "Otro",
};

export default function Reports() {
  const [dateRange, setDateRange] = useState("month");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: dashboardStats, isLoading: loadingDashboard } = useDashboardStats();
  const { data: monthlyData, isLoading: loadingMonthly } = useMonthlyStats();
  const { data: weeklyData, isLoading: loadingWeekly } = useWeeklyActivity();
  const { data: topContacts, isLoading: loadingContacts } = useTopContacts(5);
  const { data: contactStats } = useContactStats();
  const { data: messageStats } = useMessageStats();
  const { data: paymentStats } = usePaymentStats();
  const { data: payments, isLoading: loadingPayments } = usePayments();

  const hasNoData = !loadingPayments && (!payments || payments.length === 0);

  // Calculate payment method distribution from real data
  const paymentMethodData = React.useMemo(() => {
    if (!payments || payments.length === 0) return [];

    const methodCounts: Record<string, number> = {};
    payments.forEach(p => {
      const method = (p.method || 'otro').toLowerCase();
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });

    const total = payments.length;
    return Object.entries(methodCounts)
      .map(([method, count]) => ({
        name: METHOD_LABELS[method] || method.charAt(0).toUpperCase() + method.slice(1),
        value: Math.round((count / total) * 100),
        color: METHOD_COLORS[method] || METHOD_COLORS.other,
      }))
      .sort((a, b) => b.value - a.value);
  }, [payments]);

  // Calculate real system stats
  const systemStats = React.useMemo(() => {
    if (!payments || !paymentStats) {
      return [
        { label: "Pagos confirmados", value: 0, target: 80 },
        { label: "Tasa de detección", value: 0, target: 90 },
        { label: "Contactos activos", value: 0, target: 100 },
        { label: "Promedio confianza", value: 0, target: 85 },
      ];
    }

    const totalPayments = (paymentStats.confirmedCount || 0) + (paymentStats.pendingCount || 0) + (paymentStats.rejectedCount || 0);
    const confirmationRate = totalPayments > 0
      ? Math.round((paymentStats.confirmedCount || 0) / totalPayments * 100)
      : 0;

    // Calculate average confidence from payments
    const avgConfidence = payments.length > 0
      ? Math.round(payments.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / payments.length)
      : 0;

    const activeContactsRate = contactStats?.total
      ? Math.round((contactStats.active || 0) / contactStats.total * 100)
      : 0;

    return [
      { label: "Pagos confirmados", value: confirmationRate, target: 80 },
      { label: "Tasa de detección", value: avgConfidence, target: 85 },
      { label: "Contactos activos", value: activeContactsRate, target: 80 },
      { label: "Pagos este mes", value: Math.min(dashboardStats?.totalPaymentsThisMonth || 0, 100), target: 50 },
    ];
  }, [payments, paymentStats, contactStats, dashboardStats]);

  const formatCurrency = (amount: number) => {
    const currency = profile?.currency || 'PEN';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportPDF = () => {
    if (!payments || payments.length === 0) {
      toast.error("No hay pagos para exportar");
      return;
    }

    const currency = (profile?.currency || 'PEN') as CurrencyCode;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const confirmedPayments = payments.filter(p => p.status === 'confirmed');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const rejectedPayments = payments.filter(p => p.status === 'rejected');

    const reportData: ReportData = {
      title: 'Reporte de Pagos',
      subtitle: `Periodo: ${dateRange === 'week' ? 'Esta semana' : dateRange === 'month' ? 'Este mes' : dateRange === 'quarter' ? 'Este trimestre' : 'Este año'}`,
      dateRange: {
        from: startOfMonth,
        to: now,
      },
      summary: {
        totalPayments: payments.length,
        confirmedAmount: confirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        pendingAmount: pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        rejectedAmount: rejectedPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        contactsCount: contactStats?.total || 0,
      },
      payments: payments.slice(0, 50).map((p: PaymentWithContact) => ({
        date: p.payment_date || new Date(p.created_at).toLocaleDateString('es-PE'),
        contact: p.contact?.name || 'Sin contacto',
        amount: p.amount || 0,
        method: p.method || 'Otro',
        status: p.status === 'confirmed' ? 'Confirmado' : p.status === 'pending' ? 'Pendiente' : p.status === 'rejected' ? 'Rechazado' : 'Cancelado',
      })),
      currency,
      generatedBy: profile?.full_name || 'Usuario',
      businessName: profile?.business_name || undefined,
    };

    try {
      const doc = generatePaymentReport(reportData);
      downloadPDF(doc, `reporte_pagos_${now.toISOString().split('T')[0]}`);
      toast.success("Reporte PDF descargado");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Error al generar el PDF");
    }
  };

  const handleExportExcel = () => {
    if (!payments || payments.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    // Prepare payment data for Excel
    const paymentData = payments.map((p: PaymentWithContact) => ({
      'Fecha': p.payment_date || new Date(p.created_at).toLocaleDateString('es-PE'),
      'Contacto': p.contact?.name || 'Sin contacto',
      'Monto': p.amount || 0,
      'Moneda': p.currency || 'PEN',
      'Estado': p.status === 'confirmed' ? 'Confirmado' : p.status === 'pending' ? 'Pendiente' : p.status === 'rejected' ? 'Rechazado' : 'Cancelado',
      'Metodo': p.method || 'Otro',
      'Referencia': p.reference_number || '',
      'Banco': p.bank_name || '',
      'Notas': p.notes || '',
    }));

    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();

    // Payments sheet
    const wsPayments = XLSX.utils.json_to_sheet(paymentData);
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Pagos');

    // Summary sheet
    const confirmedPayments = payments.filter(p => p.status === 'confirmed');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const summaryData = [
      { 'Metrica': 'Total de Pagos', 'Valor': payments.length },
      { 'Metrica': 'Pagos Confirmados', 'Valor': confirmedPayments.length },
      { 'Metrica': 'Pagos Pendientes', 'Valor': pendingPayments.length },
      { 'Metrica': 'Monto Confirmado', 'Valor': confirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0) },
      { 'Metrica': 'Monto Pendiente', 'Valor': pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0) },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

    // Monthly stats sheet if available
    if (monthlyData && monthlyData.length > 0) {
      const monthlySheetData = monthlyData.map(item => ({
        'Mes': item.month,
        'Pagos': item.payments,
        'Confirmados': item.confirmed,
        'Mensajes': item.messages
      }));
      const wsMonthly = XLSX.utils.json_to_sheet(monthlySheetData);
      XLSX.utils.book_append_sheet(wb, wsMonthly, 'Mensual');
    }

    // Download file
    XLSX.writeFile(wb, `reporte_pagos_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Archivo Excel descargado");
  };

  const handleExportClients = () => {
    if (!topContacts || topContacts.length === 0) {
      toast.error("No hay contactos para exportar");
      return;
    }

    const data = topContacts.map(c => ({
      'Nombre': c.name,
      'Telefono': c.phone || '',
      'Email': c.email || '',
      'Total Pagado': c.total_paid || 0,
      'Pagos Realizados': c.payment_count || 0,
      'Confiabilidad': `${c.reliability_score || 100}%`,
      'Estado': c.status === 'active' ? 'Activo' : 'Inactivo',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Contactos');

    XLSX.writeFile(wb, `clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Cartera de clientes descargada");
  };

  const chartMonthlyData = monthlyData?.map(item => ({
    month: item.month,
    pagos: item.payments,
    confirmados: item.confirmed,
    mensajes: item.messages,
  })) || [];

  const chartWeeklyData = weeklyData?.map(day => ({
    day: day.day,
    pagos: day.payments,
    mensajes: day.messages,
  })) || [];

  const isLoading = loadingDashboard || loadingMonthly || loadingWeekly || loadingContacts;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
            <p className="text-muted-foreground">
              Analíticas y métricas del sistema de detección de pagos
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="quarter">Este trimestre</SelectItem>
                <SelectItem value="year">Este año</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {hasNoData ? (
          <EmptyState
            icon={<span role="img" aria-label="chart">📊</span>}
            title="Sin datos para reportar"
            description="Cuando tengas pagos registrados, podrás ver estadísticas detalladas aquí."
            action={{
              label: "Registrar primer pago",
              onClick: () => setDialogOpen(true),
              icon: <Plus className="h-4 w-4" />,
            }}
            secondaryAction={{
              label: "Ver Dashboard",
              onClick: () => navigate("/"),
            }}
          />
        ) : (
        <>
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Ingresos totales</p>
                  <p className="text-2xl font-bold mt-1">
                    {isLoading ? "---" : formatCurrency(dashboardStats?.totalAmountThisMonth || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {(dashboardStats?.paymentsTrend || 0) >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-success" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-destructive" />
                    )}
                    <span className={`text-xs ${(dashboardStats?.paymentsTrend || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {(dashboardStats?.paymentsTrend || 0) >= 0 ? '+' : ''}{dashboardStats?.paymentsTrend?.toFixed(1) || 0}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs mes anterior</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                  <DollarSign className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pagos procesados</p>
                  <p className="text-2xl font-bold mt-1">
                    {isLoading ? "---" : ((paymentStats?.confirmedCount || 0) + (paymentStats?.pendingCount || 0) + (paymentStats?.rejectedCount || 0))}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">+{dashboardStats?.confirmedTrend?.toFixed(1) || 0}%</span>
                    <span className="text-xs text-muted-foreground">vs mes anterior</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Mensajes totales</p>
                  <p className="text-2xl font-bold mt-1">
                    {isLoading ? "---" : (messageStats?.total || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {messageStats?.totalToday || 0} hoy
                    </span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Contactos activos</p>
                  <p className="text-2xl font-bold mt-1">
                    {isLoading ? "---" : (contactStats?.active || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">
                      de {contactStats?.total || 0} totales
                    </span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20">
                  <Users className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Chart */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ingresos por Mes</CardTitle>
                  <CardDescription>Evolución de pagos detectados vs confirmados</CardDescription>
                </div>
                <Badge variant="secondary">2024</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loadingMonthly ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : chartMonthlyData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartMonthlyData}>
                    <defs>
                      <linearGradient id="colorPagos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorConfirmados" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" />
                    <XAxis dataKey="month" stroke="hsl(222, 30%, 50%)" fontSize={12} />
                    <YAxis stroke="hsl(222, 30%, 50%)" fontSize={12} tickFormatter={(value) => `${value / 1000}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(222, 47%, 11%)",
                        border: "1px solid hsl(222, 30%, 20%)",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`S/. ${value.toLocaleString()}`, ""]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="pagos"
                      name="Detectados"
                      stroke="hsl(173, 80%, 40%)"
                      fillOpacity={1}
                      fill="url(#colorPagos)"
                    />
                    <Area
                      type="monotone"
                      dataKey="confirmados"
                      name="Confirmados"
                      stroke="hsl(142, 71%, 45%)"
                      fillOpacity={1}
                      fill="url(#colorConfirmados)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods Pie Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Métodos de Pago</CardTitle>
              <CardDescription>Distribución por canal</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethodData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[280px] text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No hay datos de métodos</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsPieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(222, 47%, 11%)",
                          border: "1px solid hsl(222, 30%, 20%)",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value}%`, ""]}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {paymentMethodData.map((method) => (
                      <div key={method.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: method.color }}
                          />
                          <span className="text-sm text-muted-foreground">{method.name}</span>
                        </div>
                        <span className="text-sm font-medium">{method.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekly Activity */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Actividad Semanal</CardTitle>
              <CardDescription>Pagos detectados por día</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingWeekly ? (
                <div className="flex items-center justify-center h-[250px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : chartWeeklyData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[250px] text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No hay datos de esta semana</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartWeeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" />
                    <XAxis dataKey="day" stroke="hsl(222, 30%, 50%)" fontSize={12} />
                    <YAxis stroke="hsl(222, 30%, 50%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(222, 47%, 11%)",
                        border: "1px solid hsl(222, 30%, 20%)",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [value, "Pagos"]}
                    />
                    <Bar dataKey="pagos" fill="hsl(173, 80%, 40%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Contacts */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Contactos</CardTitle>
                  <CardDescription>Por volumen de pagos</CardDescription>
                </div>
                <Button variant="outline" size="sm">Ver todos</Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingContacts ? (
                <div className="flex items-center justify-center h-[200px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !topContacts || topContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <Users className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No hay datos de contactos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topContacts.map((contact, index) => (
                    <div key={contact.id} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">{contact.name}</p>
                          <span className="font-semibold text-sm">{formatCurrency(contact.total_paid || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs text-muted-foreground">Top pagador</span>
                          <span className="text-xs flex items-center gap-0.5 text-success">
                            <TrendingUp className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Performance */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Rendimiento del Sistema</CardTitle>
                <CardDescription>Métricas basadas en tus datos reales</CardDescription>
              </div>
              <Badge variant="success">Activo</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {systemStats.map((stat) => (
                <div key={stat.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <span className="text-sm font-semibold">{stat.value}%</span>
                  </div>
                  <Progress value={stat.value} className="h-2" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Objetivo: {stat.target}%</span>
                    <span className={stat.value >= stat.target ? "text-success" : "text-warning"}>
                      {stat.value >= stat.target ? "Alcanzado" : `${Math.max(0, stat.target - stat.value)}% restante`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report Generator */}
        <ReportGenerator />

        {/* Quick Exports */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            className="glass-card hover:shadow-glow/20 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
            onClick={handleExportPDF}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Reporte Mensual</p>
                  <p className="text-xs text-muted-foreground">Descargar PDF</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className="glass-card hover:shadow-glow/20 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
            onClick={handleExportExcel}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">
                  <BarChart3 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-sm">Exportar Pagos</p>
                  <p className="text-xs text-muted-foreground">Descargar Excel</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className="glass-card hover:shadow-glow/20 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
            onClick={handleExportClients}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
                  <Users className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-sm">Cartera de Clientes</p>
                  <p className="text-xs text-muted-foreground">Descargar Excel</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </>
        )}
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payment={null}
      />
    </DashboardLayout>
  );
}
