import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useWeeklyActivity } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export function ActivityChart() {
  const { data: activity, isLoading } = useWeeklyActivity();

  // Transform data for chart
  const chartData = activity?.map(day => ({
    name: day.day,
    pagos: day.payments,
    mensajes: day.messages,
  })) || [];

  return (
    <div className="rounded-xl bg-card border border-border p-6 shadow-card animate-slide-up" style={{ animationDelay: "150ms" }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Actividad Semanal</h3>
        <p className="text-sm text-muted-foreground">Pagos detectados vs mensajes recibidos</p>
      </div>

      <div className="h-[300px]">
        {isLoading ? (
          <div className="flex items-end justify-around gap-2 h-full p-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <Skeleton
                  className="w-full rounded-t-md"
                  style={{ height: `${Math.random() * 50 + 30}%` }}
                />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground">No hay datos de actividad</p>
            <p className="text-xs text-muted-foreground mt-1">Los datos aparecerán cuando haya actividad</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPagos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(173 80% 40%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(173 80% 40%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMensajes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(215 20% 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(215 20% 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
              <XAxis
                dataKey="name"
                stroke="hsl(215 20% 55%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(215 20% 55%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222 47% 10%)',
                  border: '1px solid hsl(222 30% 18%)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 24px hsl(222 47% 4% / 0.5)',
                }}
                labelStyle={{ color: 'hsl(210 40% 98%)' }}
                itemStyle={{ color: 'hsl(215 20% 55%)' }}
              />
              <Area
                type="monotone"
                dataKey="mensajes"
                stroke="hsl(215 20% 55%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMensajes)"
                name="Mensajes"
              />
              <Area
                type="monotone"
                dataKey="pagos"
                stroke="hsl(173 80% 40%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPagos)"
                name="Pagos"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Pagos Detectados</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-muted-foreground" />
          <span className="text-sm text-muted-foreground">Mensajes Recibidos</span>
        </div>
      </div>
    </div>
  );
}
