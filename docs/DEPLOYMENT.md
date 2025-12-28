# Guía de Deployment

## Requisitos

- Cuenta en [Vercel](https://vercel.com) (frontend)
- Cuenta en [Supabase](https://supabase.com) (backend)
- Cuenta en [Meta for Developers](https://developers.facebook.com) (WhatsApp, opcional)

---

## 1. Configurar Supabase

### Crear proyecto

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
2. Anota el **Project URL** y **anon key** de Settings > API

### Crear tablas

En SQL Editor, ejecuta las migraciones:

```sql
-- Profiles (extiende auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  company_name TEXT,
  currency TEXT DEFAULT 'PEN',
  timezone TEXT DEFAULT 'America/Lima',
  language TEXT DEFAULT 'es',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'active',
  company TEXT,
  location TEXT,
  total_paid NUMERIC DEFAULT 0,
  total_debt NUMERIC DEFAULT 0,
  reliability_score NUMERIC DEFAULT 100,
  is_starred BOOLEAN DEFAULT FALSE,
  notes TEXT,
  last_payment_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phone)
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  contact_id UUID REFERENCES contacts,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'PEN',
  method TEXT,
  method_detail TEXT,
  bank_name TEXT,
  account_number TEXT,
  reference_number TEXT,
  status TEXT DEFAULT 'pending',
  confidence_score NUMERIC DEFAULT 100,
  payment_date DATE,
  payment_time TIME,
  notes TEXT,
  confirmed_by UUID REFERENCES auth.users,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  contact_id UUID REFERENCES contacts,
  whatsapp_id TEXT,
  direction TEXT DEFAULT 'incoming',
  content TEXT,
  media_type TEXT,
  media_url TEXT,
  is_payment_related BOOLEAN DEFAULT FALSE,
  detected_amount NUMERIC,
  requires_review BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (usuarios solo ven sus datos)
CREATE POLICY "Users can manage own profiles"
ON profiles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own contacts"
ON contacts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own payments"
ON payments FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own messages"
ON messages FOR ALL USING (auth.uid() = user_id);
```

### Configurar Storage

1. Ve a Storage y crea un bucket llamado `avatars`
2. Configúralo como público
3. Agrega políticas para upload/view

---

## 2. Deploy en Vercel

### Opción A: Deploy desde GitHub

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automático en cada push a main

### Opción B: Deploy manual

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## 3. Variables de Entorno

### Vercel (Settings > Environment Variables)

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Local (.env)

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4. Configurar WhatsApp (Opcional)

### Crear App en Meta

1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Crea una app tipo "Business"
3. Agrega el producto "WhatsApp"
4. Configura un número de teléfono de prueba

### Configurar Webhook

1. URL: `https://<tu-proyecto>.supabase.co/functions/v1/whatsapp-webhook`
2. Verify Token: El que definas en tu Edge Function
3. Suscribirse a: `messages`

### Variables adicionales

```env
VITE_WHATSAPP_API_URL=https://graph.facebook.com/v17.0
VITE_WHATSAPP_PHONE_ID=123456789
VITE_WHATSAPP_TOKEN=EAAxxxxx
```

---

## 5. Dominio Personalizado

### En Vercel

1. Settings > Domains
2. Agregar tu dominio
3. Configurar DNS según instrucciones

### En Supabase (opcional)

Custom domains disponibles en plan Pro.

---

## Troubleshooting

### Build falla

```bash
# Verificar build local
npm run build

# Ver errores de TypeScript
npx tsc --noEmit
```

### Errores de Supabase

- Verificar que las tablas existen
- Verificar políticas RLS
- Verificar que el anon key es correcto

### WhatsApp no recibe mensajes

- Verificar URL del webhook
- Verificar verify token
- Ver logs en Supabase Dashboard > Edge Functions
