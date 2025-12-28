# Documentación de Componentes

## Componentes de Layout

### DashboardLayout

Layout principal para todas las páginas autenticadas.

```tsx
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function MyPage() {
  return (
    <DashboardLayout>
      <div>Contenido de la página</div>
    </DashboardLayout>
  );
}
```

## Componentes de Dashboard

### StatsCard

Tarjeta de estadísticas con icono, valor y tendencia.

```tsx
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DollarSign } from 'lucide-react';

<StatsCard
  title="Pagos Este Mes"
  value="S/ 15,000"
  change="+12.5%"
  changeType="positive"
  icon={DollarSign}
  delay={0}
/>
```

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| title | string | Título de la métrica |
| value | string | Valor a mostrar |
| change | string | Cambio porcentual |
| changeType | 'positive' \| 'negative' | Tipo de cambio |
| icon | LucideIcon | Icono a mostrar |
| delay | number | Delay de animación (ms) |

### QuickActions

Barra de acciones rápidas del dashboard.

```tsx
import { QuickActions } from '@/components/dashboard/QuickActions';

<QuickActions />
```

Incluye:
- Registrar Pago (abre PaymentDialog)
- Filtros (dropdown con opciones)
- Sincronizar (refresca datos)
- Exportar CSV (descarga pagos)

### PendingPayments

Lista de pagos pendientes con prioridad.

```tsx
import { PendingPayments } from '@/components/dashboard/PendingPayments';

<PendingPayments />
```

## Componentes de Pagos

### PaymentDialog

Diálogo para crear/editar pagos.

```tsx
import { PaymentDialog } from '@/components/payments/PaymentDialog';
import { useState } from 'react';

const [open, setOpen] = useState(false);

<PaymentDialog
  open={open}
  onOpenChange={setOpen}
  payment={null} // null para crear, payment object para editar
/>
```

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| open | boolean | Estado del diálogo |
| onOpenChange | (open: boolean) => void | Callback de cambio |
| payment | PaymentWithContact \| null | Pago a editar (null para nuevo) |

## Componentes de Contactos

### ContactDialog

Diálogo para crear/editar contactos.

```tsx
import { ContactDialog } from '@/components/contacts/ContactDialog';

<ContactDialog
  open={open}
  onOpenChange={setOpen}
  contact={null}
/>
```

## Custom Hooks

### usePayments

Hook para gestión de pagos.

```tsx
import { usePayments, useCreatePayment, useConfirmPayment } from '@/hooks/usePayments';

// Obtener pagos
const { data: payments, isLoading } = usePayments({ status: 'pending' });

// Crear pago
const createPayment = useCreatePayment();
createPayment.mutate({
  contact_id: 'uuid',
  amount: 1000,
  currency: 'PEN',
  method: 'transfer',
  status: 'pending',
});

// Confirmar pago
const confirmPayment = useConfirmPayment();
confirmPayment.mutate('payment-id');
```

### useContacts

Hook para gestión de contactos.

```tsx
import { useContacts, useCreateContact } from '@/hooks/useContacts';

// Obtener contactos
const { data: contacts, isLoading } = useContacts({ status: 'active' });

// Crear contacto
const createContact = useCreateContact();
createContact.mutate({
  name: 'Juan Pérez',
  phone: '+51999999999',
  email: 'juan@email.com',
});
```

### useDashboard

Hook para estadísticas del dashboard.

```tsx
import { useDashboardStats, useWeeklyActivity } from '@/hooks/useDashboard';

// Stats generales
const { data: stats } = useDashboardStats();
console.log(stats?.totalAmountThisMonth);

// Actividad semanal
const { data: activity } = useWeeklyActivity();
```

### useAuth

Hook de autenticación (desde AuthContext).

```tsx
import { useAuth } from '@/contexts/AuthContext';

const { user, profile, loading, signOut } = useAuth();

if (loading) return <Spinner />;
if (!user) return <Navigate to="/login" />;

// Acceder al perfil
console.log(profile?.currency); // 'PEN'
```

## Componentes UI (shadcn/ui)

El proyecto usa shadcn/ui. Documentación completa en: https://ui.shadcn.com

Componentes disponibles:
- Button, Card, Badge, Avatar
- Dialog, Sheet, Dropdown
- Form, Input, Select, Switch
- Table, Tabs, Progress
- Toast (Sonner), Tooltip
