import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useWeeklyActivity } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';

export function ActivityChart() {
  const { data: activity, isLoading } = useWeeklyActivity();

  // Transform data for chart
  const chartData = activity?.map(day => ({
    name: day.day,
    pagos: day.payments,
    mensajes: day.messages,
  })) || [];

  return (
    <div className="stitch-card animate-slide-up" style={{ animationDelay: "150ms" }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-stitch-text">Actividad Semanal</h3>
        <p className="text-sm text-stitch-muted">Pagos detectados vs mensajes recibidos</p>
      </div>

      <div className="h-[280px]">
        {isLoading ? (
          <div className="flex items-end justify-around gap-2 h-full p-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <Skeleton
                  className="w-full rounded-t-md bg-stitch-surface-elevated"
                  style={{ height: `${Math.random() * 50 + 30}%` }}
                />
                <Skeleton className="h-3 w-8 bg-stitch-surface-elevated" />
              </div>
            ))}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-stitch-surface-elevated flex items-center justify-center mb-4">
              <BarChart3 className="h-7 w-7 text-stitch-muted" />
            </div>
            <p className="text-stitch-text font-medium">No hay datos de actividad</p>
            <p className="text-sm text-stitch-muted mt-1">Los datos aparecerán cuando haya actividad</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPagos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#12ba66" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#12ba66" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMensajes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8aa394" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8aa394" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="name"
                stroke="#8aa394"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#8aa394"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1c2e26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
                }}
                labelStyle={{ color: '#e8efe9' }}
                itemStyle={{ color: '#8aa394' }}
              />
              <Area
                type="monotone"
                dataKey="mensajes"
                stroke="#8aa394"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMensajes)"
                name="Mensajes"
              />
              <Area
                type="monotone"
                dataKey="pagos"
                stroke="#12ba66"
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
          <div className="h-3 w-3 rounded-full bg-stitch-primary" />
          <span className="text-sm text-stitch-muted">Pagos Detectados</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-stitch-muted" />
          <span className="text-sm text-stitch-muted">Mensajes Recibidos</span>
        </div>
      </div>
    </div>
  );
}
