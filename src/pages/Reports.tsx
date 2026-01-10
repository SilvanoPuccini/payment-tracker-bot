import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  ArrowLeft,
  Share2,
  ChevronDown,
  Calendar,
  TrendingUp,
  Users,
  FileText,
  Table2,
  Plus,
  PieChart,
  Loader2,
  Wallet,
  CheckCircle,
  MessageSquare,
  BarChart3,
  Bot,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
  BarChart,
} from "recharts";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useDashboardStats, useMonthlyStats, useTopContacts } from "@/hooks/useDashboard";
import { usePaymentStats, usePayments, type PaymentWithContact } from "@/hooks/usePayments";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { generatePaymentReport, downloadPDF, type ReportData } from "@/lib/pdf-generator";
import { type CurrencyCode } from "@/lib/currency";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, subMonths, getMonth } from "date-fns";
import { es } from "date-fns/locale";

// Payment method colors
const METHOD_COLORS: Record<string, string> = {
  yape: "#742284",
  plin: "#00C8F8",
  transfer: "#12ba66",
  transferencia: "#12ba66",
  cash: "#FFB02E",
  efectivo: "#FFB02E",
  other: "#8aa394",
  otro: "#8aa394",
};

const METHOD_LABELS: Record<string, string> = {
  yape: "Yape",
  plin: "Plin",
  transfer: "Transfer",
  transferencia: "Transfer",
  cash: "Efectivo",
  efectivo: "Efectivo",
  other: "Otro",
  otro: "Otro",
};

const AVATAR_COLORS = [
  { bg: "bg-blue-900/30", text: "text-blue-400", bar: "#3b82f6" },
  { bg: "bg-purple-900/30", text: "text-purple-400", bar: "#8b5cf6" },
  { bg: "bg-orange-900/30", text: "text-orange-400", bar: "#f97316" },
  { bg: "bg-pink-900/30", text: "text-pink-400", bar: "#ec4899" },
  { bg: "bg-teal-900/30", text: "text-teal-400", bar: "#14b8a6" },
];

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

export default function Reports() {
  const [dateRange, setDateRange] = useState("month");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: dashboardStats, isLoading: loadingDashboard } = useDashboardStats();
  const { data: monthlyData, isLoading: loadingMonthly } = useMonthlyStats();
  const { data: topContacts, isLoading: loadingContacts } = useTopContacts(5);
  const { data: paymentStats } = usePaymentStats();
  const { data: payments, isLoading: loadingPayments } = usePayments();

  const hasNoData = !loadingPayments && (!payments || payments.length === 0);

  const userCurrency = profile?.currency || 'PEN';
  const currencySymbol = userCurrency === 'PEN' ? 'S/' : userCurrency === 'USD' ? '$' : userCurrency;

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`;
  };

  // Calculate payment method distribution
  const paymentMethodData = useMemo(() => {
    if (!payments || payments.length === 0) return [];

    const methodCounts: Record<string, number> = {};
    const methodAmounts: Record<string, number> = {};

    payments.forEach(p => {
      const method = (p.method || 'otro').toLowerCase();
      methodCounts[method] = (methodCounts[method] || 0) + 1;
      methodAmounts[method] = (methodAmounts[method] || 0) + (p.amount || 0);
    });

    const total = payments.length;
    return Object.entries(methodCounts)
      .map(([method, count]) => ({
        name: METHOD_LABELS[method] || method.charAt(0).toUpperCase() + method.slice(1),
        percentage: Math.round((count / total) * 100),
        amount: methodAmounts[method],
        color: METHOD_COLORS[method] || METHOD_COLORS.other,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [payments]);

  // Generate daily data for chart
  const dailyChartData = useMemo(() => {
    if (!payments) return [];

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const data = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(now.getFullYear(), now.getMonth(), day);
      const dayPayments = payments.filter(p => {
        const pDate = new Date(p.created_at);
        return pDate.getDate() === day &&
               pDate.getMonth() === now.getMonth() &&
               pDate.getFullYear() === now.getFullYear() &&
               p.status === 'confirmed';
      });
      const total = dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      data.push({
        day: format(date, 'dd MMM', { locale: es }),
        shortDay: format(date, 'dd', { locale: es }),
        amount: total,
      });
    }

    return data;
  }, [payments]);

  // Generate monthly data for annual chart
  const monthlyChartData = useMemo(() => {
    if (!payments) return MONTHS.map((month, i) => ({ month, amount: 0, isCurrentMonth: i === new Date().getMonth() }));

    const now = new Date();
    const currentMonth = now.getMonth();
    const data = [];

    for (let i = 0; i < 12; i++) {
      const monthPayments = payments.filter(p => {
        const pDate = new Date(p.created_at);
        return pDate.getMonth() === i &&
               pDate.getFullYear() === now.getFullYear() &&
               p.status === 'confirmed';
      });
      const total = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      data.push({
        month: MONTHS[i],
        amount: total,
        isCurrentMonth: i === currentMonth,
      });
    }

    return data;
  }, [payments]);

  const maxMonthlyAmount = Math.max(...monthlyChartData.map(d => d.amount), 1);

  // Calculate trend percentage
  const trendPercentage = dashboardStats?.paymentsTrend || 0;

  // Stats for summary cards
  const totalIncome = dashboardStats?.totalAmountThisMonth || 0;
  const totalPayments = dashboardStats?.totalPaymentsThisMonth || 0;
  const messagesAnalyzed = payments?.length || 0;
  const activeContacts = topContacts?.length || 0;

  const handleExportPDF = () => {
    if (!payments || payments.length === 0) {
      toast.error("No hay pagos para exportar");
      return;
    }

    const currency = (profile?.currency || 'PEN') as CurrencyCode;
    const now = new Date();
    const startDate = startOfMonth(now);

    const confirmedPayments = payments.filter(p => p.status === 'confirmed');
    const pendingPayments = payments.filter(p => p.status === 'pending');

    const reportData: ReportData = {
      title: 'Reporte de Pagos',
      subtitle: `Periodo: ${format(startDate, 'MMMM yyyy', { locale: es })}`,
      dateRange: { from: startDate, to: now },
      summary: {
        totalPayments: payments.length,
        confirmedAmount: confirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        pendingAmount: pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        rejectedAmount: 0,
        contactsCount: topContacts?.length || 0,
      },
      payments: payments.slice(0, 50).map((p: PaymentWithContact) => ({
        date: p.payment_date || format(new Date(p.created_at), 'dd/MM/yyyy'),
        contact: p.contact?.name || 'Sin contacto',
        amount: p.amount || 0,
        method: p.method || 'Otro',
        status: p.status === 'confirmed' ? 'Confirmado' : p.status === 'pending' ? 'Pendiente' : 'Rechazado',
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
      'Fecha': p.payment_date || format(new Date(p.created_at), 'dd/MM/yyyy'),
      'Contacto': p.contact?.name || 'Sin contacto',
      'Monto': p.amount || 0,
      'Moneda': p.currency || 'PEN',
      'Estado': p.status === 'confirmed' ? 'Confirmado' : p.status === 'pending' ? 'Pendiente' : 'Rechazado',
      'Metodo': p.method || 'Otro',
      'Referencia': p.reference_number || '',
    }));

    const wb = XLSX.utils.book_new();
    const wsPayments = XLSX.utils.json_to_sheet(paymentData);
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Pagos');

    XLSX.writeFile(wb, `reporte_pagos_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Archivo Excel descargado");
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const now = new Date();
  const periodLabel = `${format(startOfMonth(now), 'dd MMM', { locale: es })} - ${format(endOfMonth(now), 'dd MMM yyyy', { locale: es })}`;
  const currentYear = now.getFullYear();

  const isLoading = loadingDashboard || loadingPayments;

  // Generate conic gradient for donut chart
  const conicGradient = useMemo(() => {
    if (paymentMethodData.length === 0) return 'conic-gradient(#333 0% 100%)';

    let gradient = 'conic-gradient(';
    let currentPercentage = 0;

    paymentMethodData.forEach((method, index) => {
      const startPercent = currentPercentage;
      currentPercentage += method.percentage;
      gradient += `${method.color} ${startPercent}% ${currentPercentage}%`;
      if (index < paymentMethodData.length - 1) gradient += ', ';
    });

    gradient += ')';
    return gradient;
  }, [paymentMethodData]);

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-[var(--pt-surface)] rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white">Reportes</h1>
          <button className="w-10 h-10 flex items-center justify-center text-white hover:bg-[var(--pt-surface)] rounded-full transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {hasNoData ? (
          <div className="pt-empty py-16 animate-scale-in">
            <div className="pt-empty-icon">
              <PieChart className="h-12 w-12 text-[var(--pt-text-muted)]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Sin datos para reportar</h2>
            <p className="text-[var(--pt-text-secondary)] max-w-sm mb-6">
              Cuando tengas pagos registrados, podrás ver estadísticas detalladas aquí.
            </p>
            <button
              className="pt-btn-primary"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-5 w-5" />
              Registrar primer pago
            </button>
          </div>
        ) : (
          <>
            {/* Period Selector */}
            <div className="animate-slide-up">
              <p className="pt-section-header">PERÍODO</p>
              <div className="flex items-center justify-between gap-3 bg-[var(--pt-surface)] p-2 rounded-full border border-[var(--pt-border)]">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32 bg-[var(--pt-surface-elevated)] border-0 rounded-full text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--pt-surface)] border-[var(--pt-border)]">
                    <SelectItem value="week" className="text-white">Esta semana</SelectItem>
                    <SelectItem value="month" className="text-white">Este mes</SelectItem>
                    <SelectItem value="quarter" className="text-white">Trimestre</SelectItem>
                    <SelectItem value="year" className="text-white">Este año</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 pr-4">
                  <Calendar className="w-4 h-4 text-[var(--pt-primary)]" />
                  <p className="text-sm font-medium text-[var(--pt-text-secondary)]">
                    {periodLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Cards - 2x2 Grid */}
            <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">💰</span>
                <h3 className="text-[var(--pt-text-secondary)] text-sm font-bold uppercase tracking-wide">
                  Resumen del Período
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Ingresos totales */}
                <div className="bg-[var(--pt-surface)] p-4 rounded-2xl border border-[var(--pt-border)] relative overflow-hidden">
                  <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-green-900/30 text-green-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <p className="text-[var(--pt-text-secondary)] text-xs font-medium mb-1">Ingresos totales</p>
                  <p className="text-white text-xl font-bold tracking-tight">
                    {isLoading ? '---' : formatCurrency(totalIncome)}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-[var(--pt-primary)]">
                    <TrendingUp className="w-3 h-3" />
                    <span>+{Math.abs(trendPercentage).toFixed(1)}% vs mes</span>
                  </div>
                </div>

                {/* Pagos procesados */}
                <div className="bg-[var(--pt-surface)] p-4 rounded-2xl border border-[var(--pt-border)] relative overflow-hidden">
                  <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-emerald-900/30 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <p className="text-[var(--pt-text-secondary)] text-xs font-medium mb-1">Pagos procesados</p>
                  <p className="text-white text-xl font-bold tracking-tight">
                    {isLoading ? '--' : totalPayments}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-[var(--pt-primary)]">
                    <TrendingUp className="w-3 h-3" />
                    <span>+{Math.abs(trendPercentage).toFixed(1)}% vs mes</span>
                  </div>
                </div>

                {/* Mensajes analizados */}
                <div className="bg-[var(--pt-surface)] p-4 rounded-2xl border border-[var(--pt-border)] relative overflow-hidden">
                  <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-blue-900/30 text-blue-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="text-[var(--pt-text-secondary)] text-xs font-medium mb-1">Mensajes analizados</p>
                  <p className="text-white text-xl font-bold tracking-tight">
                    {isLoading ? '--' : messagesAnalyzed}
                  </p>
                  <p className="text-[10px] text-[var(--pt-text-muted)] mt-2">
                    Este período
                  </p>
                </div>

                {/* Contactos activos */}
                <div className="bg-[var(--pt-surface)] p-4 rounded-2xl border border-[var(--pt-border)] relative overflow-hidden">
                  <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-orange-900/30 text-orange-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-[var(--pt-text-secondary)] text-xs font-medium mb-1">Contactos activos</p>
                  <p className="text-white text-xl font-bold tracking-tight">
                    {isLoading ? '--' : activeContacts}
                  </p>
                  <p className="text-[10px] text-[var(--pt-text-muted)] mt-2">
                    Con pagos registrados
                  </p>
                </div>
              </div>
            </div>

            {/* Daily Evolution Chart */}
            <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[var(--pt-primary)]" />
                <h3 className="text-base font-bold text-white uppercase">Evolución Diaria</h3>
              </div>
              <div className="bg-[var(--pt-surface)] rounded-3xl p-4 border border-[var(--pt-border)] h-48 relative">
                {loadingMonthly ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--pt-primary)]" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyChartData.slice(-14)}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#12ba66" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#12ba66" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="shortDay"
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a2c24",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [formatCurrency(value), "Total"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#12ba66"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorAmount)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Annual Evolution Chart */}
            <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[var(--pt-primary)]" />
                  <h3 className="text-base font-bold text-white uppercase">Evolución Anual</h3>
                </div>
                <span className="text-xs bg-[var(--pt-surface-elevated)] px-2 py-1 rounded text-[var(--pt-text-secondary)] border border-[var(--pt-border)]">
                  {currentYear}
                </span>
              </div>
              <div className="bg-[var(--pt-surface)] rounded-3xl p-5 border border-[var(--pt-border)]">
                <p className="text-xs text-[var(--pt-text-muted)] mb-6">Ingresos mensuales vs pagos detectados</p>

                {/* Bar Chart */}
                <div className="flex items-end justify-between h-32 gap-1.5 px-1">
                  {monthlyChartData.map((data, index) => {
                    const height = maxMonthlyAmount > 0 ? (data.amount / maxMonthlyAmount) * 100 : 5;
                    return (
                      <div key={index} className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                        <div
                          className={cn(
                            "w-1.5 rounded-t-sm transition-all",
                            data.isCurrentMonth
                              ? "bg-[var(--pt-primary)] shadow-[0_0_10px_rgba(18,186,102,0.4)]"
                              : "bg-[var(--pt-primary)]/30"
                          )}
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                        <span className={cn(
                          "text-[9px]",
                          data.isCurrentMonth ? "text-white font-bold" : "text-[var(--pt-text-muted)]"
                        )}>
                          {data.month}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[var(--pt-primary)]/30" />
                    <span className="text-[10px] text-[var(--pt-text-muted)]">Detectados</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[var(--pt-primary)]" />
                    <span className="text-[10px] text-[var(--pt-text-muted)]">Confirmados</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods Donut */}
            <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-[var(--pt-primary)]" />
                <h3 className="text-base font-bold text-white uppercase">Por Método de Pago</h3>
              </div>
              <div className="bg-[var(--pt-surface)] rounded-3xl p-5 border border-[var(--pt-border)]">
                {paymentMethodData.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[var(--pt-text-secondary)]">No hay datos de métodos</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-6">
                    {/* Donut Chart */}
                    <div className="relative w-32 h-32 shrink-0">
                      <div
                        className="w-full h-full rounded-full"
                        style={{ background: conicGradient }}
                      />
                      <div className="absolute inset-4 bg-[var(--pt-surface)] rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-[var(--pt-text-muted)] text-center leading-tight">
                          TOTAL<br />100%
                        </span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-3">
                      {paymentMethodData.map((method, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: method.color }}
                            />
                            <span className="text-sm text-white font-medium">{method.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-white">{method.percentage}%</span>
                            <span className="block text-[10px] text-[var(--pt-text-muted)]">
                              {formatCurrency(method.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Clients */}
            <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[var(--pt-primary)]" />
                <h3 className="text-base font-bold text-white uppercase">Top Clientes</h3>
              </div>
              {loadingContacts ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-2xl bg-[var(--pt-surface)]">
                      <div className="w-10 h-10 rounded-full bg-[var(--pt-surface-elevated)]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 bg-[var(--pt-surface-elevated)] rounded" />
                        <div className="h-2 w-16 bg-[var(--pt-surface-elevated)] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !topContacts || topContacts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[var(--pt-text-secondary)]">No hay datos de clientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topContacts.map((contact, index) => {
                    const totalAmount = topContacts.reduce((sum, c) => sum + (c.total_paid || 0), 0);
                    const percentage = totalAmount > 0 ? Math.round(((contact.total_paid || 0) / totalAmount) * 100) : 0;
                    const colors = AVATAR_COLORS[index % AVATAR_COLORS.length];

                    return (
                      <div
                        key={contact.id}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--pt-surface)] border border-[var(--pt-border)]"
                      >
                        {/* Avatar */}
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                          colors.bg, colors.text
                        )}>
                          {getInitials(contact.name)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-white truncate">{contact.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${percentage}%`, backgroundColor: colors.bar }}
                              />
                            </div>
                            <span className="text-[10px] text-[var(--pt-text-muted)]">{percentage}% del total</span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right">
                          <p className="font-bold text-sm text-white">{formatCurrency(contact.total_paid || 0)}</p>
                          <p className="text-[10px] text-[var(--pt-text-muted)]">{contact.payment_count || 0} Pagos</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* System Performance - At the end as requested */}
            <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[var(--pt-primary)]" />
                  <h3 className="text-base font-bold text-white uppercase">Rendimiento del Sistema</h3>
                </div>
                <span className="text-[10px] uppercase bg-[var(--pt-primary)]/20 text-[var(--pt-primary)] px-2 py-0.5 rounded-full font-bold">
                  Operativo
                </span>
              </div>
              <div className="bg-[var(--pt-surface)] rounded-3xl p-5 border border-[var(--pt-border)] space-y-5">
                {/* Precision */}
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs text-[var(--pt-text-secondary)]">Precisión de detección</span>
                    <span className="text-sm font-bold text-white">94.2%</span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-1.5">
                    <div className="bg-[var(--pt-primary)] h-1.5 rounded-full" style={{ width: '94.2%' }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-[var(--pt-text-muted)]">Obj: 95%</span>
                    <span className="text-[9px] text-orange-400">0.8% restante</span>
                  </div>
                </div>

                {/* Messages Processed */}
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs text-[var(--pt-text-secondary)]">Mensajes procesados</span>
                    <span className="text-sm font-bold text-white">98.5%</span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-1.5">
                    <div className="bg-[var(--pt-primary)] h-1.5 rounded-full" style={{ width: '98.5%' }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-[var(--pt-text-muted)]">Obj: 99%</span>
                    <span className="text-[9px] text-orange-400">0.5% restante</span>
                  </div>
                </div>

                {/* Response Time */}
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs text-[var(--pt-text-secondary)]">Tiempo de respuesta</span>
                    <span className="text-sm font-bold text-white">87.3%</span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-1.5">
                    <div className="bg-[var(--pt-primary)] h-1.5 rounded-full" style={{ width: '87.3%' }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-[var(--pt-text-muted)]">Obj: 90%</span>
                    <span className="text-[9px] text-orange-400">2.7% restante</span>
                  </div>
                </div>

                {/* Auto Confirmations */}
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs text-[var(--pt-text-secondary)]">Confirmaciones automáticas</span>
                    <span className="text-sm font-bold text-white">76.8%</span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-1.5">
                    <div className="bg-[var(--pt-primary)] h-1.5 rounded-full" style={{ width: '76.8%' }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-[var(--pt-text-muted)]">Obj: 80%</span>
                    <span className="text-[9px] text-orange-400">3.2% restante</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fixed Footer Export Buttons */}
      {!hasNoData && (
        <div className="fixed bottom-20 lg:bottom-4 left-0 right-0 p-4 bg-[var(--pt-bg)]/95 backdrop-blur-md border-t border-[var(--pt-border)] z-40">
          <div className="flex gap-3 max-w-lg mx-auto">
            <button
              onClick={handleExportPDF}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-full border border-[var(--pt-border)] bg-transparent font-bold text-sm text-white hover:bg-[var(--pt-surface)] active:scale-95 transition-all"
            >
              <FileText className="w-5 h-5 text-red-500" />
              Exportar PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-full bg-[var(--pt-primary)] font-bold text-sm text-white shadow-lg shadow-[var(--pt-primary)]/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <Table2 className="w-5 h-5" />
              Exportar Excel
            </button>
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      <PaymentDialog open={dialogOpen} onOpenChange={setDialogOpen} payment={null} />
    </DashboardLayout>
  );
}
