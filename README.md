<p align="center">
  <img src="https://img.icons8.com/fluency/96/money-bag.png" alt="PayTrack Logo" width="80" height="80">
</p>

<h1 align="center">PayTrack</h1>

<p align="center">
  <strong>Sistema inteligente de seguimiento de pagos con integración WhatsApp</strong>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version"></a>
  <a href="#"><img src="https://img.shields.io/badge/build-passing-brightgreen.svg" alt="Build Status"></a>
  <a href="#"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
</p>

<p align="center">
  <a href="https://payment-tracker-bot.vercel.app">Ver Demo</a> •
  <a href="#instalación">Instalación</a> •
  <a href="#características">Características</a> •
  <a href="#documentación">Docs</a>
</p>

---

## El Problema

Las pequeñas y medianas empresas pierden tiempo valioso rastreando pagos manualmente a través de múltiples canales. Los mensajes de WhatsApp con comprobantes se pierden, los pagos quedan sin confirmar y el seguimiento de deudores es caótico.

## La Solución

**PayTrack** automatiza la detección y gestión de pagos usando IA para analizar mensajes de WhatsApp, identificar comprobantes de pago y mantener un registro ordenado de todas las transacciones.

---

## Características

| Característica | Descripción |
|----------------|-------------|
| 📊 **Dashboard Inteligente** | Métricas en tiempo real de pagos, tendencias y actividad |
| 💳 **Gestión de Pagos** | CRUD completo con estados (pendiente, confirmado, rechazado) |
| 👥 **Contactos** | Historial de pagos por cliente con scoring de confiabilidad |
| 💬 **WhatsApp Integration** | Detección automática de pagos via IA |
| 📱 **Multi-moneda** | Soporte para PEN, USD, EUR, ARS, CLP, MXN, COP, BRL |
| 📈 **Reportes** | Exportación CSV/PDF, gráficos de tendencias |
| 🔔 **Notificaciones** | Alertas de pagos pendientes y recordatorios |
| 🌙 **Modo Oscuro** | Interfaz moderna con tema oscuro por defecto |

---

## Tech Stack

| Categoría | Tecnología |
|-----------|------------|
| **Frontend** | React 18, TypeScript 5.8, Vite 5.4 |
| **Styling** | Tailwind CSS 3.4, shadcn/ui |
| **State** | TanStack Query (React Query) |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |
| **Deploy** | Vercel |

---

## Instalación

### Prerrequisitos

- Node.js 18+
- npm o pnpm
- Cuenta en [Supabase](https://supabase.com)

### Pasos

\`\`\`bash
# 1. Clonar el repositorio
git clone https://github.com/SilvanoPuccini/payment-tracker-bot.git
cd payment-tracker-bot

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Iniciar servidor de desarrollo
npm run dev
\`\`\`

---

## Variables de Entorno

Crea un archivo \`.env\` en la raíz del proyecto:

\`\`\`env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# WhatsApp Business API (opcional)
VITE_WHATSAPP_API_URL=https://graph.facebook.com/v17.0
VITE_WHATSAPP_PHONE_ID=tu-phone-id
VITE_WHATSAPP_TOKEN=tu-token
\`\`\`

---

## Estructura del Proyecto

```
src/
├── components/
│   ├── auth/           # Componentes de autenticación
│   ├── contacts/       # Gestión de contactos
│   ├── dashboard/      # Widgets del dashboard
│   ├── layout/         # Header, Sidebar, Layout principal
│   ├── payments/       # CRUD de pagos
│   └── ui/             # Componentes shadcn/ui
├── contexts/
│   └── AuthContext.tsx # Contexto de autenticación
├── hooks/
│   ├── usePayments.ts  # CRUD y stats de pagos
│   ├── useContacts.ts  # Gestión de contactos
│   ├── useDashboard.ts # Métricas del dashboard
│   ├── useMessages.ts  # Mensajes y conversaciones
│   └── useWhatsApp.ts  # Integración WhatsApp
├── integrations/
│   └── supabase/       # Cliente y tipos de Supabase
├── pages/
│   ├── Index.tsx       # Dashboard principal
│   ├── Payments.tsx    # Lista de pagos
│   ├── Contacts.tsx    # Gestión de contactos
│   ├── Messages.tsx    # Conversaciones
│   ├── Reports.tsx     # Reportes y analytics
│   ├── Profile.tsx     # Perfil de usuario
│   └── Settings.tsx    # Configuración
└── types/
    └── database.ts     # Tipos de TypeScript
```

---

## Scripts Disponibles

\`\`\`bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Ejecutar ESLint
\`\`\`

---

## Roadmap

- [x] Dashboard con métricas en tiempo real
- [x] CRUD de pagos y contactos
- [x] Exportación CSV
- [x] Multi-moneda
- [ ] PWA con notificaciones push
- [ ] Integración WhatsApp Business API completa
- [ ] Recordatorios automáticos de pago
- [ ] App móvil nativa (React Native)
- [ ] Integración con bancos (Open Banking)
- [ ] Facturación electrónica

---

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit tus cambios (\`git commit -m 'Add: nueva característica'\`)
4. Push a la branch (\`git push origin feature/AmazingFeature\`)
5. Abre un Pull Request

### Convención de Commits

\`\`\`
feat: nueva característica
fix: corrección de bug
docs: documentación
style: formateo, sin cambios de código
refactor: refactorización de código
test: agregar tests
chore: tareas de mantenimiento
\`\`\`

---

## Licencia

Distribuido bajo la Licencia MIT. Ver \`LICENSE\` para más información.

---

## Autor

**Silvano Puccini**

- GitHub: [@SilvanoPuccini](https://github.com/SilvanoPuccini)

---

<p align="center">
  Hecho con ❤️ usando React + Supabase
</p>
