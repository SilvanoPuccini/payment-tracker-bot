import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Lun', pagos: 12, mensajes: 45 },
  { name: 'Mar', pagos: 19, mensajes: 62 },
  { name: 'Mié', pagos: 15, mensajes: 48 },
  { name: 'Jue', pagos: 25, mensajes: 78 },
  { name: 'Vie', pagos: 32, mensajes: 95 },
  { name: 'Sáb', pagos: 8, mensajes: 28 },
  { name: 'Dom', pagos: 5, mensajes: 15 },
];

export function ActivityChart() {
  return (
    <div className="rounded-xl bg-card border border-border p-6 shadow-card animate-slide-up" style={{ animationDelay: "150ms" }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Actividad Semanal</h3>
        <p className="text-sm text-muted-foreground">Pagos detectados vs mensajes recibidos</p>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
