import { Menu, Bell, Settings, LogOut, User, Zap, Crown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
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

export function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { isFree, currentPlan } = useSubscription();
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sesión cerrada correctamente");
    navigate("/login");
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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-[var(--pt-bg)]/95 backdrop-blur-md border-b border-[var(--pt-border)] px-4">
      {/* Mobile: Menu button only */}
      <div className="flex items-center gap-3">
        <button className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--pt-surface)] transition-colors">
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
        <Link to="/notifications">
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
  );
}
