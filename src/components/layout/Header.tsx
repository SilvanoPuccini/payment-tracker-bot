import { useState } from "react";
import { Menu, Bell, Settings, LogOut, User, Zap, Crown, Search, X, LayoutDashboard, MessageSquare, CreditCard, Users, BarChart3, HelpCircle } from "lucide-react";
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

// Menu items matching desktop Sidebar exactly
const menuItems = [
  { label: 'Inicio', href: '/', icon: LayoutDashboard },
  { label: 'Mensajes', href: '/messages', icon: MessageSquare },
  { label: 'Pagos', href: '/payments', icon: CreditCard },
  { label: 'Contactos', href: '/contacts', icon: Users },
  { label: 'Recordatorios', href: '/reminders', icon: Bell },
  { label: 'Reportes', href: '/reports', icon: BarChart3 },
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
    console.log("handleSignOut: Starting sign out...");
    try {
      // Close menu first
      setMobileMenuOpen(false);

      // Show loading toast
      const loadingToast = toast.loading("Cerrando sesión...");

      // Wait for sign out
      await signOut();

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Sesión cerrada correctamente");

      console.log("handleSignOut: Sign out successful, navigating to login");

      // Small delay to ensure state is cleared
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 100);
    } catch (error) {
      console.error("handleSignOut: Error signing out:", error);
      toast.error("Error al cerrar sesión");

      // Force navigate anyway
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 500);
    }
  };

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

  const handleNavClick = (href: string) => {
    navigate(href);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-[var(--pt-bg)]/95 backdrop-blur-md border-b border-[var(--pt-border)] px-4">
        {/* Mobile: Menu button */}
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

        {/* Right side */}
        <div className="flex items-center gap-2">
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
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-blue-500 to-blue-600">
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
                className="text-white hover:bg-[var(--pt-surface-elevated)] cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/settings")}
                className="text-white hover:bg-[var(--pt-surface-elevated)] cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              {isFree && (
                <DropdownMenuItem
                  onClick={() => navigate("/pricing")}
                  className="text-[var(--pt-primary)] hover:bg-[var(--pt-surface-elevated)] cursor-pointer"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Mejorar a Pro
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-[var(--pt-border)]" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-[var(--pt-red)] hover:bg-[var(--pt-surface-elevated)] cursor-pointer"
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
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer - Menú compacto al 80% */}
          <div className="absolute left-0 top-0 h-[80vh] w-[70%] max-w-[260px] bg-[#0d1f17] flex flex-col animate-slide-in-left rounded-br-3xl overflow-hidden">
            {/* Logo - compacto */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--pt-primary)] flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-lg">PayTrack</span>
              </div>
            </div>

            {/* User Info - compacto */}
            <div className="px-4 py-2 border-b border-[var(--pt-border)]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{getInitials()}</span>
                </div>
                <div>
                  <p className="text-[var(--pt-text-muted)] text-xs">Hola,</p>
                  <p className="text-white font-semibold text-sm">{profile?.full_name?.split(' ')[0] || 'Usuario'}</p>
                </div>
              </div>
            </div>

            {/* Navigation - compacto con scroll */}
            <nav className="flex-1 px-2 py-2 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavClick(item.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-0.5 transition-all",
                      isActive
                        ? "bg-[var(--pt-primary)]/20 text-[var(--pt-primary)]"
                        : "text-[var(--pt-text-muted)] hover:bg-[var(--pt-surface)]"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive && "text-[var(--pt-primary)]")} />
                    <span className={cn("text-sm font-medium", isActive && "text-[var(--pt-primary)]")}>{item.label}</span>
                  </button>
                );
              })}

              {/* Mejorar Plan Button */}
              {isFree && (
                <button
                  onClick={() => handleNavClick('/pricing')}
                  className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-2 rounded-full bg-[var(--pt-primary)] text-white text-sm font-semibold transition-all hover:bg-[var(--pt-primary-hover)]"
                >
                  <Zap className="w-4 h-4" />
                  <span>Mejorar Plan</span>
                </button>
              )}
            </nav>

            {/* Bottom Section - compacto */}
            <div className="px-2 py-2 border-t border-[var(--pt-border)]">
              <button
                onClick={() => handleNavClick('/settings')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[var(--pt-text-muted)] hover:bg-[var(--pt-surface)] transition-all"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Configuración</span>
              </button>
              <button
                onClick={() => handleNavClick('/help')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[var(--pt-text-muted)] hover:bg-[var(--pt-surface)] transition-all"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Ayuda</span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[var(--pt-red)] hover:bg-[var(--pt-red)]/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
