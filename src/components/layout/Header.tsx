import { Search, LogOut, Settings, User, Zap, Crown, Bell } from "lucide-react";
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

export function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { isFree, currentPlan } = useSubscription();
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sesion cerrada correctamente");
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

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuario";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-stitch-bg border-b border-stitch px-5">
      {/* Mobile: App title, Desktop: Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-lg font-semibold text-stitch-text">PayTrack</span>
        </div>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stitch-muted" />
          <Input
            type="search"
            placeholder="Buscar pagos, contactos..."
            className="w-80 pl-10 bg-stitch-surface border-stitch text-stitch-text placeholder:text-stitch-muted focus:border-stitch-primary rounded-xl"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Upgrade Button - Show for Free plan users */}
        {isFree && (
          <Button
            onClick={() => navigate("/pricing")}
            size="sm"
            className="hidden sm:flex gradient-primary text-white rounded-xl shadow-button"
          >
            <Zap className="h-4 w-4 mr-1" />
            Upgrade
          </Button>
        )}

        {/* Plan Badge for Pro/Business */}
        {!isFree && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stitch-primary/15 text-stitch-primary text-xs font-semibold">
            <Crown className="h-3.5 w-3.5" />
            {currentPlan.name}
          </div>
        )}

        {/* Notifications */}
        <Link to="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-stitch-muted hover:text-stitch-text hover:bg-stitch-surface rounded-xl"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-stitch-red text-white text-xs flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-xl bg-stitch-surface border border-stitch px-3 py-2 hover:bg-stitch-surface-elevated transition-colors">
              <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center text-sm font-bold text-white">
                {getInitials()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-stitch-text">{displayName}</p>
                <p className="text-xs text-stitch-muted">{user?.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-stitch-surface border-stitch">
            <DropdownMenuLabel className="text-stitch-text">Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-stitch-border" />
            <DropdownMenuItem onClick={() => navigate("/profile")} className="text-stitch-text hover:bg-stitch-surface-elevated focus:bg-stitch-surface-elevated">
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")} className="text-stitch-text hover:bg-stitch-surface-elevated focus:bg-stitch-surface-elevated">
              <Settings className="mr-2 h-4 w-4" />
              Configuracion
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-stitch-border" />
            <DropdownMenuItem onClick={handleSignOut} className="text-stitch-red hover:bg-stitch-surface-elevated focus:bg-stitch-surface-elevated focus:text-stitch-red">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
