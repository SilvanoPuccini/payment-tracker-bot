import { useState } from "react";
import { Menu, Bell, Settings, LogOut, User, Zap, Crown, Search, X, Home, CreditCard, Users, BarChart3, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

const menuItems = [
  { label: 'Inicio', href: '/', icon: Home },
  { label: 'Pagos', href: '/payments', icon: CreditCard },
  { label: 'Contactos', href: '/contacts', icon: Users },
  { label: 'Reportes', href: '/reports', icon: BarChart3 },
  { label: 'Mensajes', href: '/messages', icon: MessageSquare },
];

export function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isFree, currentPlan } = useSubscription();
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter(n => !n.read).length || 0;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Sesión cerrada correctamente");
      navigate("/login");
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  };

  // Get initials from name or email
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-[var(--pt-bg)]/95 backdrop-blur-md border-b border-[var(--pt-border)] px-4">
        {/* Mobile: Menu button only */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--pt-surface)] transition-colors"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>

          {/* Desktop: Search bar */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pt-text-muted)]" />
              <Input
                type="search"
                placeholder="Buscar pagos, contactos..."
                className="w-72 pl-10 bg-[var(--pt-surface)] border-[var(--pt-border)] text-white placeholder:text-[var(--pt-text-muted)] focus:border-[var(--pt-primary)] rounded-xl h-10"
              />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Upgrade Button - desktop only */}
          {isFree && (
            <Button
              onClick={() => navigate("/pricing")}
              size="sm"
              className="hidden lg:flex gradient-primary text-white rounded-full shadow-button text-xs px-3 h-8"
            >
              <Zap className="h-3.5 w-3.5 mr-1" />
              Mejorar Plan
            </Button>
          )}

          {/* Plan Badge - desktop only */}
          {!isFree && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--pt-primary)]/15 text-[var(--pt-primary)] text-xs font-semibold">
              <Crown className="h-3.5 w-3.5" />
              {currentPlan.name}
            </div>
          )}

          {/* Notifications */}
          <Link to="/reminders">
            <button className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--pt-surface)] transition-colors">
              <Bell className="h-5 w-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[var(--pt-red)] text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </Link>

          {/* User Avatar Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[var(--pt-border)] hover:ring-[var(--pt-primary)]/50 transition-all">
                <div className={cn(
                  "w-full h-full flex items-center justify-center text-sm font-bold text-white",
                  "bg-gradient-to-br from-blue-500 to-blue-600"
                )}>
                  {getInitials()}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[var(--pt-surface)] border-[var(--pt-border)]">
              <DropdownMenuLabel className="text-white">
                <div>
                  <p className="font-semibold">{profile?.full_name || 'Usuario'}</p>
                  <p className="text-xs text-[var(--pt-text-muted)] font-normal">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[var(--pt-border)]" />
              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="text-white hover:bg-[var(--pt-surface-elevated)] focus:bg-[var(--pt-surface-elevated)] cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/settings")}
                className="text-white hover:bg-[var(--pt-surface-elevated)] focus:bg-[var(--pt-surface-elevated)] cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              {isFree && (
                <DropdownMenuItem
                  onClick={() => navigate("/pricing")}
                  className="text-[var(--pt-primary)] hover:bg-[var(--pt-surface-elevated)] focus:bg-[var(--pt-surface-elevated)] cursor-pointer"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Mejorar a Pro
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-[var(--pt-border)]" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-[var(--pt-red)] hover:bg-[var(--pt-surface-elevated)] focus:bg-[var(--pt-surface-elevated)] focus:text-[var(--pt-red)] cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Drawer */}
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-[var(--pt-bg)] border-r border-[var(--pt-border)] animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--pt-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--pt-primary)] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <span className="text-white font-bold text-xl">PayTrack</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--pt-surface)] transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-[var(--pt-border)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                  {getInitials()}
                </div>
                <div>
                  <p className="text-white font-semibold">{profile?.full_name || 'Usuario'}</p>
                  <p className="text-[var(--pt-text-muted)] text-sm">{user?.email}</p>
                </div>
              </div>
              {isFree && (
                <button
                  onClick={() => { navigate('/pricing'); setMobileMenuOpen(false); }}
                  className="mt-3 w-full py-2 px-4 rounded-xl bg-[var(--pt-primary)] text-white font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Mejorar a Pro
                </button>
              )}
            </div>

            {/* Menu Items */}
            <nav className="p-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => { navigate(item.href); setMobileMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                      isActive
                        ? "bg-[var(--pt-primary)]/15 text-[var(--pt-primary)]"
                        : "text-white hover:bg-[var(--pt-surface)]"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Bottom Section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--pt-border)]">
              <button
                onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-[var(--pt-surface)] transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Mi Perfil</span>
              </button>
              <button
                onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-[var(--pt-surface)] transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Configuración</span>
              </button>
              <button
                onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--pt-red)] hover:bg-[var(--pt-surface)] transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
