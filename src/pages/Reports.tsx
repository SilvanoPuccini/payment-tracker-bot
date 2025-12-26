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
  TrendingDown,
  DollarSign,
  Users,
  MessageSquare,
  CheckCircle2,
  Calendar,
  FileText,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
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
import { useMonthlyStats, useWeeklyActivity, useTopContacts, useDashboardStats } from "@/hooks/useDashboard";
import { useContactStats } from "@/hooks/useContacts";
import { useMessageStats } from "@/hooks/useMessages";
import { usePaymentStats } from "@/hooks/usePayments";

const paymentMethodData = [
  { name: "Transferencia BCP", value: 45, color: "hsl(173, 80%, 40%)" },
  { name: "Yape", value: 28, color: "hsl(142, 71%, 45%)" },
  { name: "Plin", value: 15, color: "hsl(38, 92%, 50%)" },
  { name: "Interbank", value: 8, color: "hsl(222, 47%, 50%)" },
  { name: "Otros", value: 4, color: "hsl(222, 30%, 40%)" },
];

const detectionStats = [
  { label: "Precisión de detección", value: 94.2, target: 95 },
  { label: "Mensajes procesados", value: 98.5, target: 99 },
  { label: "Tiempo de respuesta", value: 87.3, target: 90 },
  { label: "Confirmaciones automáticas", value: 76.8, target: 80 },
];

export default function Reports() {
  const [dateRange, setDateRange] = useState("month");

  const { data: dashboardStats, isLoading: loadingDashboard } = useDashboardStats();
  const { data: monthlyData, isLoading: loadingMonthly } = useMonthlyStats();
  const { data: weeklyData, isLoading: loadingWeekly } = useWeeklyActivity();
  const { data: topContacts, isLoading: loadingContacts } = useTopContacts(5);
  const { data: contactStats } = useContactStats();
  const { data: messageStats } = useMessageStats();
  const { data: paymentStats } = usePaymentStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const chartMonthlyData = monthlyData?.map(item => ({
    month: item.month,
    pagos: item.total_amount,
    confirmados: item.confirmed_amount,
    mensajes: item.message_count,
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
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button size="sm" className="gradient-primary text-primary-foreground">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

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
                    {isLoading ? "---" : (paymentStats?.totalPayments || 0)}
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
                  <p className="text-xs text-muted-foreground">Mensajes analizados</p>
                  <p className="text-2xl font-bold mt-1">
                    {isLoading ? "---" : (messageStats?.totalMessagesToday || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">+12.8%</span>
                    <span className="text-xs text-muted-foreground">vs mes anterior</span>
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
                    {isLoading ? "---" : (contactStats?.activeContacts || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">+5.2%</span>
                    <span className="text-xs text-muted-foreground">vs mes anterior</span>
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
                          <span className="text-xs text-muted-foreground">{contact.payment_count || 0} pagos</span>
                          <span className="text-xs flex items-center gap-0.5 text-success">
                            <TrendingUp className="h-3 w-3" />
                            +{((contact.reliability_score || 0) / 10).toFixed(0)}%
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

        {/* Detection Performance */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Rendimiento del Sistema</CardTitle>
                <CardDescription>Métricas de detección y procesamiento de IA</CardDescription>
              </div>
              <Badge variant="success">Operativo</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {detectionStats.map((stat) => (
                <div key={stat.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <span className="text-sm font-semibold">{stat.value}%</span>
                  </div>
                  <Progress value={stat.value} className="h-2" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Objetivo: {stat.target}%</span>
                    <span className={stat.value >= stat.target ? "text-success" : "text-warning"}>
                      {stat.value >= stat.target ? "Alcanzado" : `${(stat.target - stat.value).toFixed(1)}% restante`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Reports */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card hover:shadow-glow/20 transition-all duration-300 cursor-pointer hover:scale-[1.02]">
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
          <Card className="glass-card hover:shadow-glow/20 transition-all duration-300 cursor-pointer hover:scale-[1.02]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">
                  <BarChart3 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-sm">Análisis de Pagos</p>
                  <p className="text-xs text-muted-foreground">Exportar Excel</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card hover:shadow-glow/20 transition-all duration-300 cursor-pointer hover:scale-[1.02]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
                  <PieChart className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-sm">Rendimiento IA</p>
                  <p className="text-xs text-muted-foreground">Ver métricas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card hover:shadow-glow/20 transition-all duration-300 cursor-pointer hover:scale-[1.02]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/50">
                  <Users className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Cartera de Clientes</p>
                  <p className="text-xs text-muted-foreground">Generar reporte</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
