import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
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
  Loader2,
  Plus,
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
import { useNavigate } from "react-router-dom";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { ReportGenerator } from "@/components/reports/ReportGenerator";
import { generatePaymentReport, downloadPDF, type ReportData } from "@/lib/pdf-generator";
import { type CurrencyCode } from "@/lib/currency";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

// Payment method colors - Stitch palette
const METHOD_COLORS: Record<string, string> = {
  transfer: "#12ba66",
  transferencia: "#12ba66",
  cash: "#facc15",
  efectivo: "#facc15",
  deposit: "#3b82f6",
  deposito: "#3b82f6",
  depósito: "#3b82f6",
  debit: "#8b5cf6",
  debito: "#8b5cf6",
  débito: "#8b5cf6",
  credit: "#f97316",
  credito: "#f97316",
  crédito: "#f97316",
  other: "#8aa394",
  otro: "#8aa394",
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
      dateRange: { from: startOfMonth, to: now },
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

    const wb = XLSX.utils.book_new();
    const wsPayments = XLSX.utils.json_to_sheet(paymentData);
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Pagos');

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

  const kpiCards = [
    {
      title: "Ingresos totales",
      value: isLoading ? "---" : formatCurrency(dashboardStats?.totalAmountThisMonth || 0),
      trend: dashboardStats?.paymentsTrend || 0,
      icon: DollarSign,
      color: "bg-stitch-primary/15 text-stitch-primary",
    },
    {
      title: "Pagos procesados",
      value: isLoading ? "---" : String((paymentStats?.confirmedCount || 0) + (paymentStats?.pendingCount || 0) + (paymentStats?.rejectedCount || 0)),
      trend: dashboardStats?.confirmedTrend || 0,
      icon: CheckCircle2,
      color: "bg-stitch-primary/15 text-stitch-primary",
    },
    {
      title: "Mensajes totales",
      value: isLoading ? "---" : String(messageStats?.total || 0),
      subtitle: `${messageStats?.totalToday || 0} hoy`,
      icon: MessageSquare,
      color: "bg-stitch-primary/15 text-stitch-primary",
    },
    {
      title: "Contactos activos",
      value: isLoading ? "---" : String(contactStats?.active || 0),
      subtitle: `de ${contactStats?.total || 0} totales`,
      icon: Users,
      color: "bg-stitch-yellow/15 text-stitch-yellow",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-stitch-text">Reportes</h1>
            <p className="text-stitch-muted">
              Analíticas y métricas del sistema de detección
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-36 bg-stitch-surface border-stitch text-stitch-text rounded-xl">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent className="bg-stitch-surface border-stitch">
                <SelectItem value="week" className="text-stitch-text hover:bg-stitch-surface-elevated">Esta semana</SelectItem>
                <SelectItem value="month" className="text-stitch-text hover:bg-stitch-surface-elevated">Este mes</SelectItem>
                <SelectItem value="quarter" className="text-stitch-text hover:bg-stitch-surface-elevated">Este trimestre</SelectItem>
                <SelectItem value="year" className="text-stitch-text hover:bg-stitch-surface-elevated">Este año</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="gradient-primary text-white rounded-xl shadow-button"
              onClick={handleExportPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Exportar PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </div>

        {hasNoData ? (
          <div className="stitch-card">
            <div className="stitch-empty py-16">
              <div className="stitch-empty-icon">
                <BarChart3 className="h-10 w-10 text-stitch-muted" />
              </div>
              <h2 className="text-xl font-semibold text-stitch-text mb-2">Sin datos para reportar</h2>
              <p className="text-stitch-muted max-w-md mb-6">
                Cuando tengas pagos registrados, podrás ver estadísticas detalladas aquí.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="gradient-primary text-white rounded-xl shadow-button"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar primer pago
                </Button>
                <Button
                  variant="outline"
                  className="bg-stitch-surface border-stitch text-stitch-text hover:bg-stitch-surface-elevated rounded-xl"
                  onClick={() => navigate("/")}
                >
                  Ver Dashboard
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {kpiCards.map((kpi, index) => (
                <div
                  key={kpi.title}
                  className="stitch-card animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-stitch-muted">{kpi.title}</p>
                      <p className="text-xl sm:text-2xl font-bold text-stitch-text mt-1">{kpi.value}</p>
                      {kpi.trend !== undefined && (
                        <div className="flex items-center gap-1 mt-1">
                          {kpi.trend >= 0 ? (
                            <ArrowUpRight className="h-3 w-3 text-stitch-primary" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-stitch-red" />
                          )}
                          <span className={cn("text-xs", kpi.trend >= 0 ? "text-stitch-primary" : "text-stitch-red")}>
                            {kpi.trend >= 0 ? "+" : ""}{kpi.trend.toFixed(1)}%
                          </span>
                          <span className="text-xs text-stitch-muted hidden sm:inline">vs mes anterior</span>
                        </div>
                      )}
                      {kpi.subtitle && (
                        <span className="text-xs text-stitch-muted">{kpi.subtitle}</span>
                      )}
                    </div>
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", kpi.color)}>
                      <kpi.icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Revenue Chart */}
              <div className="stitch-card lg:col-span-2 animate-slide-up" style={{ animationDelay: "200ms" }}>
                <div className="flex items-center justify-between border-b border-stitch pb-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-stitch-text">Ingresos por Mes</h3>
                    <p className="text-sm text-stitch-muted">Evolución de pagos detectados vs confirmados</p>
                  </div>
                  <span className="stitch-badge bg-stitch-primary/15 text-stitch-primary text-xs">2024</span>
                </div>
                {loadingMonthly ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-stitch-primary" />
                  </div>
                ) : chartMonthlyData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <BarChart3 className="h-10 w-10 text-stitch-muted mb-3" />
                    <p className="text-stitch-muted">No hay datos disponibles</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartMonthlyData}>
                      <defs>
                        <linearGradient id="colorPagos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#12ba66" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#12ba66" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorConfirmados" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="#8aa394" fontSize={12} />
                      <YAxis stroke="#8aa394" fontSize={12} tickFormatter={(value) => `${value / 1000}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1c2e26",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                        }}
                        formatter={(value: number) => [`S/. ${value.toLocaleString()}`, ""]}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="pagos" name="Detectados" stroke="#12ba66" fillOpacity={1} fill="url(#colorPagos)" />
                      <Area type="monotone" dataKey="confirmados" name="Confirmados" stroke="#facc15" fillOpacity={1} fill="url(#colorConfirmados)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Payment Methods Pie Chart */}
              <div className="stitch-card animate-slide-up" style={{ animationDelay: "250ms" }}>
                <div className="border-b border-stitch pb-4 mb-4">
                  <h3 className="text-lg font-semibold text-stitch-text">Métodos de Pago</h3>
                  <p className="text-sm text-stitch-muted">Distribución por canal</p>
                </div>
                {paymentMethodData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[280px] text-center">
                    <BarChart3 className="h-10 w-10 text-stitch-muted mb-3" />
                    <p className="text-stitch-muted">No hay datos de métodos</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <RechartsPieChart>
                        <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                          {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#1c2e26", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                          formatter={(value: number) => [`${value}%`, ""]}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-4">
                      {paymentMethodData.map((method) => (
                        <div key={method.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: method.color }} />
                            <span className="text-sm text-stitch-muted">{method.name}</span>
                          </div>
                          <span className="text-sm font-medium text-stitch-text">{method.value}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Second Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Weekly Activity */}
              <div className="stitch-card animate-slide-up" style={{ animationDelay: "300ms" }}>
                <div className="border-b border-stitch pb-4 mb-4">
                  <h3 className="text-lg font-semibold text-stitch-text">Actividad Semanal</h3>
                  <p className="text-sm text-stitch-muted">Pagos detectados por día</p>
                </div>
                {loadingWeekly ? (
                  <div className="flex items-center justify-center h-[250px]">
                    <Loader2 className="h-8 w-8 animate-spin text-stitch-primary" />
                  </div>
                ) : chartWeeklyData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[250px] text-center">
                    <BarChart3 className="h-10 w-10 text-stitch-muted mb-3" />
                    <p className="text-stitch-muted">No hay datos de esta semana</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartWeeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="day" stroke="#8aa394" fontSize={12} />
                      <YAxis stroke="#8aa394" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1c2e26", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                        formatter={(value: number) => [value, "Pagos"]}
                      />
                      <Bar dataKey="pagos" fill="#12ba66" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Top Contacts */}
              <div className="stitch-card animate-slide-up" style={{ animationDelay: "350ms" }}>
                <div className="flex items-center justify-between border-b border-stitch pb-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-stitch-text">Top Contactos</h3>
                    <p className="text-sm text-stitch-muted">Por volumen de pagos</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-stitch-surface-elevated border-stitch text-stitch-text hover:bg-stitch-surface rounded-xl"
                    onClick={() => navigate("/contacts")}
                  >
                    Ver todos
                  </Button>
                </div>
                {loadingContacts ? (
                  <div className="flex items-center justify-center h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-stitch-primary" />
                  </div>
                ) : !topContacts || topContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center">
                    <Users className="h-10 w-10 text-stitch-muted mb-3" />
                    <p className="text-stitch-muted">No hay datos de contactos</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topContacts.map((contact, index) => (
                      <div key={contact.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-stitch-surface-elevated transition-colors">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stitch-primary/15 text-stitch-primary text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm text-stitch-text truncate">{contact.name}</p>
                            <span className="font-semibold text-sm text-stitch-text">{formatCurrency(contact.total_paid || 0)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs text-stitch-muted">{contact.payment_count || 0} pagos</span>
                            <span className="text-xs flex items-center gap-0.5 text-stitch-primary">
                              <TrendingUp className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* System Performance */}
            <div className="stitch-card animate-slide-up" style={{ animationDelay: "400ms" }}>
              <div className="flex items-center justify-between border-b border-stitch pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-stitch-text">Rendimiento del Sistema</h3>
                  <p className="text-sm text-stitch-muted">Métricas basadas en tus datos reales</p>
                </div>
                <span className="stitch-badge bg-stitch-primary/15 text-stitch-primary text-xs">Activo</span>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {systemStats.map((stat) => (
                  <div key={stat.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stitch-muted">{stat.label}</span>
                      <span className="text-sm font-semibold text-stitch-text">{stat.value}%</span>
                    </div>
                    <div className="stitch-progress">
                      <div
                        className="stitch-progress-bar"
                        style={{ width: `${stat.value}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stitch-muted">Objetivo: {stat.target}%</span>
                      <span className={stat.value >= stat.target ? "text-stitch-primary" : "text-stitch-yellow"}>
                        {stat.value >= stat.target ? "Alcanzado" : `${Math.max(0, stat.target - stat.value)}% restante`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Report Generator */}
            <ReportGenerator />

            {/* Quick Exports */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div
                className="stitch-card hover:border-stitch-primary/30 transition-all duration-300 cursor-pointer group animate-slide-up"
                style={{ animationDelay: "450ms" }}
                onClick={handleExportPDF}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stitch-primary/15 group-hover:bg-stitch-primary/25 transition-colors">
                    <FileText className="h-5 w-5 text-stitch-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-stitch-text">Reporte Mensual</p>
                    <p className="text-xs text-stitch-muted">Descargar PDF</p>
                  </div>
                </div>
              </div>
              <div
                className="stitch-card hover:border-stitch-primary/30 transition-all duration-300 cursor-pointer group animate-slide-up"
                style={{ animationDelay: "500ms" }}
                onClick={handleExportExcel}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stitch-primary/15 group-hover:bg-stitch-primary/25 transition-colors">
                    <BarChart3 className="h-5 w-5 text-stitch-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-stitch-text">Exportar Pagos</p>
                    <p className="text-xs text-stitch-muted">Descargar Excel</p>
                  </div>
                </div>
              </div>
              <div
                className="stitch-card hover:border-stitch-primary/30 transition-all duration-300 cursor-pointer group animate-slide-up"
                style={{ animationDelay: "550ms" }}
                onClick={handleExportClients}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stitch-yellow/15 group-hover:bg-stitch-yellow/25 transition-colors">
                    <Users className="h-5 w-5 text-stitch-yellow" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-stitch-text">Cartera de Clientes</p>
                    <p className="text-xs text-stitch-muted">Descargar Excel</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Dialog */}
      <PaymentDialog open={dialogOpen} onOpenChange={setDialogOpen} payment={null} />
    </DashboardLayout>
  );
}
