# Arquitectura de PayTrack

## Visión General

PayTrack es una aplicación web SPA (Single Page Application) construida con React y TypeScript, que utiliza Supabase como backend-as-a-service.

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   React     │  │  TanStack   │  │      shadcn/ui          │ │
│  │   Router    │  │   Query     │  │   (Components)          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                          │                                       │
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Custom Hooks                            │ │
│  │  usePayments │ useContacts │ useDashboard │ useMessages   │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │    Auth     │  │  Database   │  │       Storage           │ │
│  │  (Users)    │  │ (PostgreSQL)│  │      (Files)            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Edge Functions                             ││
│  │           (WhatsApp Webhooks, AI Processing)                 ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │  WhatsApp Business API  │  │      OpenAI API             │  │
│  │   (Mensajes entrantes)  │  │  (Detección de pagos)       │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Estructura de Carpetas

```
src/
├── components/           # Componentes React
│   ├── auth/            # Login, Register, ProtectedRoute
│   ├── contacts/        # ContactDialog, ContactCard
│   ├── dashboard/       # StatsCard, ActivityChart, QuickActions
│   ├── layout/          # DashboardLayout, Sidebar, Header
│   ├── payments/        # PaymentDialog, PaymentCard
│   └── ui/              # Componentes shadcn/ui (Button, Card, etc.)
│
├── contexts/            # React Contexts
│   └── AuthContext.tsx  # Estado de autenticación global
│
├── hooks/               # Custom Hooks (lógica de negocio)
│   ├── usePayments.ts   # CRUD de pagos
│   ├── useContacts.ts   # CRUD de contactos
│   ├── useDashboard.ts  # Estadísticas del dashboard
│   ├── useMessages.ts   # Gestión de mensajes
│   ├── useSettings.ts   # Configuración del usuario
│   └── useWhatsApp.ts   # Integración WhatsApp
│
├── integrations/        # Integraciones externas
│   └── supabase/        # Cliente y tipos de Supabase
│
├── lib/                 # Utilidades
│   └── utils.ts         # Funciones helper (cn, formatters)
│
├── pages/               # Páginas/Rutas
│   ├── Index.tsx        # Dashboard principal
│   ├── Payments.tsx     # Lista de pagos
│   ├── Contacts.tsx     # Lista de contactos
│   ├── Messages.tsx     # Conversaciones
│   ├── Reports.tsx      # Reportes y analytics
│   ├── Profile.tsx      # Perfil del usuario
│   ├── Settings.tsx     # Configuración
│   ├── Login.tsx        # Inicio de sesión
│   ├── Register.tsx     # Registro
│   └── NotFound.tsx     # 404
│
├── test/                # Testing
│   ├── setup.ts         # Configuración de tests
│   ├── test-utils.tsx   # Utilidades de testing
│   └── mocks/           # Mocks para tests
│
└── types/               # TypeScript types
    └── database.ts      # Tipos de la base de datos
```

## Flujo de Datos

### 1. Autenticación

```
Usuario → Login Form → Supabase Auth → AuthContext → App
```

- El `AuthContext` mantiene el estado del usuario logueado
- `ProtectedRoute` verifica el estado antes de renderizar páginas protegidas

### 2. Operaciones CRUD

```
Componente → Custom Hook → TanStack Query → Supabase → PostgreSQL
```

- Los hooks encapsulan la lógica de negocio
- TanStack Query maneja cache, refetch y estados de loading
- Supabase proporciona el cliente para operaciones en la DB

### 3. Detección de Pagos (WhatsApp)

```
WhatsApp → Webhook → Edge Function → AI Analysis → Database → UI Update
```

- Los mensajes llegan via webhook a Supabase Edge Functions
- Se procesan con IA para detectar información de pago
- Se almacenan en la base de datos
- TanStack Query actualiza la UI automáticamente

## Patrones Utilizados

### Custom Hooks Pattern
Toda la lógica de negocio está encapsulada en hooks personalizados.

```typescript
// Ejemplo: usePayments.ts
export function usePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: () => fetchPayments(filters),
  });
}
```

### Compound Components
Los componentes UI complejos usan el patrón de compound components.

```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>Contenido</CardContent>
</Card>
```

### Context Pattern
Estado global mínimo usando React Context (solo autenticación).

### Optimistic Updates
Las mutaciones usan actualizaciones optimistas para mejor UX.

## Consideraciones de Seguridad

1. **Row Level Security (RLS)**: Todas las tablas tienen políticas RLS
2. **API Keys**: Las keys de Supabase son públicas pero RLS protege los datos
3. **Validación**: Zod valida los datos antes de enviar al backend
4. **HTTPS**: Todo el tráfico está encriptado
