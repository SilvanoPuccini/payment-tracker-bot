import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  CreditCard,
  Users,
  BarChart3,
  Bell,
  Zap
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Mensajes", href: "/messages", icon: MessageSquare },
  { name: "Pagos", href: "/payments", icon: CreditCard },
  { name: "Contactos", href: "/contacts", icon: Users },
  { name: "Recordatorios", href: "/reminders", icon: Bell },
  { name: "Reportes", href: "/reports", icon: BarChart3 },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-stitch-surface border-r border-stitch">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-stitch px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-stitch-text">PayTrack</h1>
            <p className="text-xs text-stitch-muted">WhatsApp Business</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-stitch-primary/15 text-stitch-primary"
                    : "text-stitch-muted hover:bg-stitch-surface-elevated hover:text-stitch-text"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-stitch-primary")} />
                {item.name}
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-stitch-primary animate-pulse-glow" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-stitch p-4">
          <div className="rounded-xl bg-stitch-surface-elevated border border-stitch p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stitch-primary/15">
                <MessageSquare className="h-5 w-5 text-stitch-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-stitch-text">Webhook Activo</p>
                <p className="text-xs text-stitch-primary">● Conectado</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
