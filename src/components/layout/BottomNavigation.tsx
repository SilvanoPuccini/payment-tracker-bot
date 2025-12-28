import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CreditCard, MessageSquare, Users, Menu, BarChart3, Settings, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: CreditCard, label: 'Pagos', path: '/payments' },
  { icon: MessageSquare, label: 'Mensajes', path: '/messages' },
  { icon: Users, label: 'Contactos', path: '/contacts' },
];

const moreMenuItems: NavItem[] = [
  { icon: BarChart3, label: 'Reportes', path: '/reports' },
  { icon: Settings, label: 'Configuracion', path: '/settings' },
  { icon: User, label: 'Perfil', path: '/profile' },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY <= lastScrollY || currentScrollY < 50);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isMoreActive = moreMenuItems.some(item => isActive(item.path));

  const handleNavigate = (path: string) => {
    navigate(path);
    setMoreOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setMoreOpen(false);
    navigate('/login');
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border md:hidden transition-transform duration-300',
        !isVisible && 'translate-y-full'
      )}
    >
      <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center w-16 py-1 rounded-lg transition-all duration-200',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    active && 'scale-110'
                  )}
                />
                {item.badge && item.badge > 0 && (
                  <Badge
                    className="absolute -top-1.5 -right-1.5 h-4 min-w-4 p-0.5 text-[10px] flex items-center justify-center"
                    variant="destructive"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={cn('text-[10px] mt-1 font-medium', active && 'font-semibold')}>
                {item.label}
              </span>
              {active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}

        {/* More Menu */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center w-16 py-1 rounded-lg transition-all duration-200',
                isMoreActive || moreOpen
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Menu
                className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  (isMoreActive || moreOpen) && 'scale-110'
                )}
              />
              <span
                className={cn(
                  'text-[10px] mt-1 font-medium',
                  (isMoreActive || moreOpen) && 'font-semibold'
                )}
              >
                Mas
              </span>
              {(isMoreActive || moreOpen) && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader className="text-left pb-4">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="space-y-1">
              {/* User Info */}
              {profile && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {profile.business_name?.[0] || profile.full_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {profile.business_name || profile.full_name || 'Usuario'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile.full_name}
                    </p>
                  </div>
                </div>
              )}

              {/* Menu Items */}
              {moreMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={cn(
                      'flex items-center gap-3 w-full p-3 rounded-lg transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}

              <div className="border-t border-border my-2" />

              {/* Sign Out */}
              <Button
                variant="ghost"
                className="flex items-center gap-3 w-full justify-start p-3 h-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Cerrar sesion</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
