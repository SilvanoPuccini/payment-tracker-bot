import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface FABProps {
  to?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function FAB({ to, onClick, icon, className }: FABProps) {
  const content = (
    <>
      {icon || <Plus className="h-6 w-6 text-white" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cn('stitch-fab', className)}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cn('stitch-fab', className)}>
      {content}
    </button>
  );
}
