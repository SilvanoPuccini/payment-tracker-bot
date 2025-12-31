import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, CreditCard, Users, BarChart3, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { PaymentDialog } from '@/components/payments/PaymentDialog';

const navItems = [
  {
    label: 'Inicio',
    href: '/',
    icon: Home,
  },
  {
    label: 'Pagos',
    href: '/payments',
    icon: CreditCard,
  },
  // FAB will be inserted here
  {
    label: 'Contactos',
    href: '/contacts',
    icon: Users,
  },
  {
    label: 'Reportes',
    href: '/reports',
    icon: BarChart3,
  },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);

  return (
    <>
      <nav className="pt-bottom-nav">
        <div className="flex items-center justify-around max-w-md mx-auto px-2">
          {/* Left nav items */}
          {leftItems.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'pt-nav-item flex-1',
                  isActive && 'active'
                )}
              >
                <Icon className={cn(
                  "w-6 h-6 transition-all",
                  isActive && "scale-110"
                )} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}

          {/* Central FAB */}
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => setDialogOpen(true)}
              className="pt-fab-central"
              aria-label="Nuevo pago"
            >
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </button>
          </div>

          {/* Right nav items */}
          {rightItems.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'pt-nav-item flex-1',
                  isActive && 'active'
                )}
              >
                <Icon className={cn(
                  "w-6 h-6 transition-all",
                  isActive && "scale-110"
                )} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Payment Dialog */}
      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payment={null}
      />
    </>
  );
}
