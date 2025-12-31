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
import { format, startOfMonth, endOfMonth } from "date-fns";
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

const getAvatarColor = (index: number) => {
  const colors = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-orange-500 to-orange-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-gradient-to-br from-teal-500 to-teal-600',
  ];
  return colors[index % colors.length];
};

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

  const formatCurrencyFull = (amount: number) => {
    return `${currencySymbol} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
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
        amount: total,
      });
    }

    return data;
  }, [payments]);

  // Calculate trend percentage
  const trendPercentage = dashboardStats?.paymentsTrend || 0;

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

  const isLoading = loadingDashboard || loadingPayments;

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-[var(--pt-surface)] rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Reportes</h1>
          <button className="w-10 h-10 flex items-center justify-center text-white hover:bg-[var(--pt-surface)] rounded-full">
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

            {/* Hero Summary Card */}
            <div className="pt-card-glow animate-slide-up relative overflow-hidden" style={{ animationDelay: '50ms' }}>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--pt-primary)]/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">💰</span>
                  <span className="text-xs font-bold text-[var(--pt-text-secondary)] uppercase tracking-wider">
                    RESUMEN DEL PERÍODO
                  </span>
                </div>

                <div className="mt-3 mb-6">
                  <span className="text-[var(--pt-text-muted)] text-2xl align-top font-medium">{currencySymbol}</span>
                  <span className="text-5xl font-bold text-white tracking-tight">
                    {isLoading ? '---' : (dashboardStats?.totalAmountThisMonth || 0).toLocaleString()}
                  </span>
                  <span className="block text-sm text-[var(--pt-text-secondary)] mt-1">Total cobrado</span>
                </div>

                <div className="grid grid-cols-3 gap-2 divide-x divide-[var(--pt-border)]">
                  <div className="pr-2">
                    <span className="font-bold text-lg text-white">
                      {isLoading ? '--' : dashboardStats?.totalPaymentsThisMonth || 0}
                    </span>
                    <span className="block text-[10px] text-[var(--pt-text-secondary)] uppercase font-bold tracking-wide">
                      PAGOS
                    </span>
                  </div>
                  <div className="px-2">
                    <span className="font-bold text-lg text-white">
                      {isLoading ? '--' : formatCurrency(paymentStats?.pendingAmount || 0)}
                    </span>
                    <span className="block text-[10px] text-[var(--pt-yellow)] uppercase font-bold tracking-wide">
                      PENDIENTE
                    </span>
                  </div>
                  <div className="pl-2">
                    <span className={cn(
                      "font-bold text-lg",
                      trendPercentage >= 0 ? "text-[var(--pt-primary)]" : "text-[var(--pt-red)]"
                    )}>
                      {trendPercentage >= 0 ? '+' : ''}{trendPercentage.toFixed(0)}%
                    </span>
                    <span className="block text-[10px] text-[var(--pt-text-secondary)] uppercase font-bold tracking-wide">
                      VS MES
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Evolution Chart */}
            <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[var(--pt-primary)]" />
                <h3 className="text-base font-bold text-white">EVOLUCIÓN DIARIA</h3>
              </div>
              <div className="pt-card h-48">
                {loadingMonthly ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--pt-primary)]" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyChartData.slice(-14)}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#12ba66" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#12ba66" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="day"
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${currencySymbol}${(value/1000).toFixed(0)}k`}
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

            {/* Payment Methods Donut */}
            <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-[var(--pt-primary)]" />
                <h3 className="text-base font-bold text-white">POR MÉTODO DE PAGO</h3>
              </div>
              <div className="pt-card">
                {paymentMethodData.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[var(--pt-text-secondary)]">No hay datos de métodos</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-6">
                    {/* Donut Chart */}
                    <div className="relative w-32 h-32 shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {(() => {
                          let currentAngle = 0;
                          return paymentMethodData.map((method, index) => {
                            const angle = (method.percentage / 100) * 360;
                            const startAngle = currentAngle;
                            currentAngle += angle;

                            const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                            const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                            const x2 = 50 + 40 * Math.cos(((startAngle + angle) * Math.PI) / 180);
                            const y2 = 50 + 40 * Math.sin(((startAngle + angle) * Math.PI) / 180);
                            const largeArcFlag = angle > 180 ? 1 : 0;

                            return (
                              <path
                                key={index}
                                d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                fill={method.color}
                                stroke="#112119"
                                strokeWidth="1"
                              />
                            );
                          });
                        })()}
                        <circle cx="50" cy="50" r="25" fill="#1a2c24" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-[var(--pt-text-muted)] text-center">
                          TOTAL<br/>100%
                        </span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-3">
                      {paymentMethodData.map((method, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: method.color }}
                            />
                            <span className="text-sm text-[var(--pt-text-secondary)]">{method.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-white">{method.percentage}%</span>
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
            <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[var(--pt-primary)]" />
                <h3 className="text-base font-bold text-white">TOP CLIENTES</h3>
              </div>
              {loadingContacts ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl bg-[var(--pt-surface)]">
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

                    return (
                      <div
                        key={contact.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[var(--pt-surface)] border border-[var(--pt-border)]"
                      >
                        {/* Avatar */}
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm",
                          getAvatarColor(index)
                        )}>
                          {getInitials(contact.name)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-white truncate">{contact.name}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-[var(--pt-surface-elevated)] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: getAvatarColor(index).includes('blue') ? '#3b82f6' :
                                    getAvatarColor(index).includes('purple') ? '#8b5cf6' :
                                    getAvatarColor(index).includes('orange') ? '#f97316' : '#12ba66'
                                }}
                              />
                            </div>
                            <span className="text-xs text-[var(--pt-text-muted)]">{percentage}% del total</span>
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
          </>
        )}
      </div>

      {/* Fixed Footer Export Buttons */}
      {!hasNoData && (
        <div className="fixed bottom-20 md:bottom-4 left-0 right-0 p-4 bg-[var(--pt-bg)]/95 backdrop-blur-md border-t border-[var(--pt-border)] z-40">
          <div className="flex gap-3 max-w-lg mx-auto">
            <button
              onClick={handleExportPDF}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-full border border-[var(--pt-border)] bg-[var(--pt-surface)] font-bold text-sm text-white hover:bg-[var(--pt-surface-elevated)] active:scale-95 transition-all"
            >
              <FileText className="w-5 h-5 text-[var(--pt-red)]" />
              Exportar PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-full bg-[var(--pt-primary)] font-bold text-sm text-white shadow-button hover:brightness-110 active:scale-95 transition-all"
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
