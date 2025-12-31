import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { useAdminStats, useRegistrationStats } from "@/hooks/useAdmin";

export default function Admin() {
  const { data: stats, isLoading: loadingStats } = useAdminStats();
  const { data: registrations, isLoading: loadingRegistrations } = useRegistrationStats(30);

  if (loadingStats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Métricas globales de PayTrack
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Usuarios
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeUsers || 0} activos (últimos 30 días)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pagos Procesados
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalPayments || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total histórico
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Revenue Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats?.totalRevenue?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                De pagos confirmados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuarios Activos
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 días
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Registrations Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Registros Recientes</CardTitle>
            <CardDescription>
              Últimos 30 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRegistrations ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {/* Simple bar chart */}
                <div className="flex items-end gap-1 h-32">
                  {registrations?.slice(-14).map((day) => {
                    const maxCount = Math.max(...(registrations?.map(d => d.count) || [1]));
                    const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

                    return (
                      <div
                        key={day.date}
                        className="flex-1 bg-primary/20 hover:bg-primary/30 rounded-t transition-colors relative group"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      >
                        {day.count > 0 && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover px-2 py-1 rounded text-xs hidden group-hover:block shadow">
                            {day.count}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Hace 14 días</span>
                  <span>Hoy</span>
                </div>

                {/* Summary */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total registros (30d)</span>
                    <span className="font-medium">
                      {registrations?.reduce((sum, d) => sum + d.count, 0) || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Ver todos los usuarios
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Exportar datos
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Ver logs del sistema
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
