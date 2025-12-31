import { Link, useLocation } from 'react-router-dom';
import { Home, CreditCard, Users, BarChart3 } from 'lucide-react';
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
    label: 'Reportes',
    href: '/reports',
    icon: BarChart3,
  },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="stitch-bottom-nav">
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
                'stitch-nav-item',
                isActive && 'active'
              )}
            >
              <Icon className="h-6 w-6" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
