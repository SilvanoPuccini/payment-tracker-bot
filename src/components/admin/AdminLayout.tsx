import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  ArrowLeft,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNavItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    href: "/admin/users",
    label: "Usuarios",
    icon: Users,
  },
  {
    href: "/admin/subscriptions",
    label: "Suscripciones",
    icon: CreditCard,
  },
  {
    href: "/admin/logs",
    label: "Logs",
    icon: FileText,
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a PayTrack
          </Button>

          <div className="flex items-center gap-2 ml-4">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold">Panel de Administración</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="w-64 border-r border-border min-h-[calc(100vh-3.5rem)] p-4 hidden md:block">
          <nav className="space-y-1">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background p-2 flex justify-around z-50">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
