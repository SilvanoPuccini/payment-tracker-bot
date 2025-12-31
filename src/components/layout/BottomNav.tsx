import { Link, useLocation } from 'react-router-dom';
import { Home, CreditCard, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  {
    label: 'Contactos',
    href: '/contacts',
    icon: Users,
  },
  {
    label: 'Ajustes',
    href: '/settings',
    icon: Settings,
  },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="pt-bottom-nav">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== '/' && location.pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'pt-nav-item',
                isActive && 'active'
              )}
            >
              <Icon className={cn(
                "w-6 h-6 transition-all",
                isActive && "scale-110"
              )} />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
