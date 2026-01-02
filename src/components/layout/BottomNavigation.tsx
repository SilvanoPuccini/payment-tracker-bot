import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CreditCard, Users, BarChart3, Plus, Settings, User, LogOut, Menu, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PaymentDialog } from '@/components/payments/PaymentDialog';

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
  badge?: number;
}

// Nav items sin FAB central - 4 items totales
const leftNavItems: NavItem[] = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: CreditCard, label: 'Pagos', path: '/payments' },
];

const rightNavItems: NavItem[] = [
  { icon: BarChart3, label: 'Reportes', path: '/reports' },
];

const moreMenuItems: NavItem[] = [
  { icon: Users, label: 'Contactos', path: '/contacts' },
  { icon: Bell, label: 'Recordatorios', path: '/reminders' },
  { icon: Settings, label: 'Configuracion', path: '/settings' },
  { icon: User, label: 'Perfil', path: '/profile' },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
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

  const handleNavigate = (path: string) => {
    navigate(path);
    setMoreOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setMoreOpen(false);
    navigate('/login');
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <button
        onClick={() => handleNavigate(item.path)}
        className={cn(
          'flex flex-col items-center justify-center flex-1 py-2 transition-all duration-200',
          active
            ? 'text-emerald-400'
            : 'text-slate-400 hover:text-slate-300'
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
        <span className={cn('text-[10px] mt-1 font-medium', active && 'text-emerald-400')}>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <>
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur-lg border-t border-slate-700 md:hidden transition-transform duration-300',
          !isVisible && 'translate-y-full'
        )}
      >
        <div className="flex items-center h-16 px-2 safe-area-bottom">
          {/* Left Nav Items */}
          {leftNavItems.map((item) => (
            <NavButton key={item.path} item={item} />
          ))}

          {/* FAB Central - New Payment */}
          <div className="flex-1 flex justify-center">
            <button
              onClick={() => setPaymentDialogOpen(true)}
              className="w-14 h-14 -mt-6 bg-emerald-500 hover:bg-emerald-600 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Plus className="h-7 w-7 text-white" />
            </button>
          </div>

          {/* Right Nav Items */}
          {rightNavItems.map((item) => (
            <NavButton key={item.path} item={item} />
          ))}

          {/* More Menu Trigger */}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  'flex flex-col items-center justify-center flex-1 py-2 transition-all duration-200',
                  moreOpen
                    ? 'text-emerald-400'
                    : 'text-slate-400 hover:text-slate-300'
                )}
              >
                <Menu className="h-5 w-5" />
                <span className="text-[10px] mt-1 font-medium">Mas</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-xl bg-slate-900 border-slate-700">
              <SheetHeader className="text-left pb-4">
                <SheetTitle className="text-white">Menu</SheetTitle>
              </SheetHeader>
              <div className="space-y-1">
                {/* User Info */}
                {profile && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                        {profile.company_name?.[0] || profile.full_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-white">
                        {profile.company_name || profile.full_name || 'Usuario'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
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
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'hover:bg-slate-800 text-white'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}

                <div className="border-t border-slate-700 my-2" />

                {/* Sign Out */}
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 w-full justify-start p-3 h-auto text-red-400 hover:text-red-400 hover:bg-red-500/10"
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

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        payment={null}
      />
    </>
  );
}
