import { Bell, Search, LogOut, Settings, User, CreditCard, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Demo notifications - in production these would come from the database
const demoNotifications = [
  {
    id: 1,
    type: "payment",
    title: "Nuevo pago detectado",
    description: "Se detect&oacute; un pago de S/. 150.00 de Juan P&eacute;rez",
    time: "Hace 5 min",
    read: false,
  },
  {
    id: 2,
    type: "message",
    title: "Nuevo mensaje",
    description: "Mar&iacute;a Garc&iacute;a envi&oacute; un comprobante de pago",
    time: "Hace 15 min",
    read: false,
  },
  {
    id: 3,
    type: "alert",
    title: "Promesa de pago vencida",
    description: "Carlos L&oacute;pez no cumpli&oacute; su promesa de pago",
    time: "Hace 1 hora",
    read: true,
  },
];

export function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(demoNotifications);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sesi&oacute;n cerrada correctamente");
    navigate("/login");
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success("Notificaciones marcadas como le&iacute;das");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <CreditCard className="h-4 w-4 text-success" />;
      case "message":
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case "alert":
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return <Bell className="h-4 w-4" />;
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

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuario";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-lg px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar pagos, contactos..."
            className="w-80 pl-10 bg-secondary border-border focus:border-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h4 className="font-semibold">Notificaciones</h4>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                  Marcar todas como leídas
                </Button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No hay notificaciones
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 border-b p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                      !notif.read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      setNotifications(notifications.map(n =>
                        n.id === notif.id ? { ...n, read: true } : n
                      ));
                      setNotifOpen(false);
                    }}
                  >
                    <div className="mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notif.title}
                        {!notif.read && (
                          <Badge variant="default" className="ml-2 h-4 px-1 text-[10px]">
                            Nuevo
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{notif.description}</p>
                      <p className="text-xs text-muted-foreground/60">{notif.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t p-2">
              <Button variant="ghost" className="w-full text-sm" onClick={() => setNotifOpen(false)}>
                Ver todas las notificaciones
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2 hover:bg-secondary/80 transition-colors">
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                {getInitials()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
