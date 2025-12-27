import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  CreditCard,
  Users,
  BarChart3,
  Zap
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Mensajes", href: "/messages", icon: MessageSquare },
  { name: "Pagos", href: "/payments", icon: CreditCard },
  { name: "Contactos", href: "/contacts", icon: Users },
  { name: "Reportes", href: "/reports", icon: BarChart3 },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">PayTrack</h1>
            <p className="text-xs text-muted-foreground">WhatsApp Business</p>
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-glow/20"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                {item.name}
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Webhook Activo</p>
                <p className="text-xs text-success">● Conectado</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
