# PayTrack Backend - Guía de Configuración

## Requisitos Previos

1. Cuenta de Supabase (gratuita en supabase.com)
2. Cuenta de Meta Business (para WhatsApp Business API)
3. API Key de Gemini (gratuita en ai.google.dev)

---

## 1. Configuración de Supabase

### 1.1 Variables de Entorno del Proyecto

En el Dashboard de Supabase → Settings → Edge Functions, configura:

```env
# REQUERIDO: API Key de Gemini 2.0 Flash (GRATUITO)
# Obtener en: https://ai.google.dev/
GEMINI_API_KEY=tu_api_key_de_gemini

# OPCIONAL: Verificación de webhook de WhatsApp
WHATSAPP_VERIFY_TOKEN=tu_token_personalizado
WHATSAPP_APP_SECRET=tu_app_secret_de_meta

# ALTERNATIVAS DE IA (opcionales)
LOVABLE_API_KEY=tu_lovable_key
OPENAI_API_KEY=tu_openai_key
```

### 1.2 Deploy de Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link proyecto
supabase link --project-ref TU_PROJECT_REF

# Deploy todas las funciones
supabase functions deploy whatsapp-webhook
supabase functions deploy process-message
supabase functions deploy health
```

---

## 2. Configuración de WhatsApp Business API

### 2.1 Crear App en Meta for Developers

1. Ir a developers.facebook.com
2. Crear nueva app → Tipo: Business
3. Agregar producto: WhatsApp
4. Configurar número de teléfono de prueba

### 2.2 Configurar Webhook

En Meta Developers → WhatsApp → Configuration:

- **Callback URL**: `https://TU_PROJECT.supabase.co/functions/v1/whatsapp-webhook`
- **Verify Token**: El mismo valor que `WHATSAPP_VERIFY_TOKEN`
- **Webhook Fields**: Seleccionar `messages`

### 2.3 Obtener Credenciales

Guardar estos valores en la tabla `users`:

| Campo | Dónde encontrarlo |
|-------|-------------------|
| `wa_phone_number_id` | WhatsApp → API Setup → Phone number ID |
| `wa_business_account_id` | WhatsApp → API Setup → WhatsApp Business Account ID |
| `wa_access_token` | WhatsApp → API Setup → Temporary access token (o System User Token para producción) |

---

## 3. Configuración de Gemini (GRATUITO)

### 3.1 Obtener API Key

1. Ir a https://ai.google.dev/
2. Click en "Get API key"
3. Crear nueva API key
4. Copiar y guardar en `GEMINI_API_KEY`

### 3.2 Límites del Free Tier

- **60 requests/minuto** (suficiente para MVP)
- **1500 requests/día**
- Soporta texto e imágenes (multimodal)
- Modelo: `gemini-2.0-flash-exp`

---

## 4. Seguridad

### 4.1 Verificación de Firma (Recomendado)

Para producción, habilitar verificación de firma HMAC-SHA256:

1. En Meta Developers → Settings → Basic → App Secret
2. Copiar el "App Secret"
3. Configurar como `WHATSAPP_APP_SECRET`

### 4.2 Rate Limiting

El sistema incluye rate limiting automático:
- 100 requests/minuto por IP
- Headers de respuesta incluyen `X-RateLimit-Remaining`

### 4.3 Row Level Security (RLS)

La base de datos usa RLS para aislar datos por usuario:
- Cada usuario solo ve sus propios datos
- Las Edge Functions usan `service_role` para bypass

---

## 5. Testing

### 5.1 Verificar Health

```bash
curl https://TU_PROJECT.supabase.co/functions/v1/health
```

Respuesta esperada:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "ok" },
    "gemini_api": { "status": "ok" },
    "webhook_config": { "status": "ok" }
  }
}
```

### 5.2 Probar Procesamiento de Mensajes

```bash
curl -X POST https://TU_PROJECT.supabase.co/functions/v1/process-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -d '{
    "message": "Ya te transferí 500 soles por Yape",
    "contactName": "Juan Pérez"
  }'
```

### 5.3 Simular Webhook de WhatsApp

```bash
# Verificación
curl "https://TU_PROJECT.supabase.co/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=TU_TOKEN&hub.challenge=test123"

# Debería responder: test123
```

---

## 6. Monitoreo

### 6.1 Logs en Supabase

Dashboard → Edge Functions → Logs

Filtrar por:
- `whatsapp-webhook` - Mensajes entrantes
- `process-message` - Análisis de IA
- `health` - Estado del sistema

### 6.2 Eventos en Base de Datos

```sql
-- Ver últimos eventos
SELECT * FROM events ORDER BY created_at DESC LIMIT 20;

-- Mensajes con errores
SELECT * FROM messages WHERE status = 'error' ORDER BY created_at DESC;

-- Pagos detectados hoy
SELECT * FROM payments WHERE created_at >= CURRENT_DATE;
```

---

## 7. Troubleshooting

### Error: "No AI API key configured"

Solución: Configurar `GEMINI_API_KEY` en Edge Functions secrets.

### Error: "Webhook verification failed"

Solución: Verificar que `WHATSAPP_VERIFY_TOKEN` coincida con el configurado en Meta.

### Error: "User not found for phone_number_id"

Solución: Crear usuario en tabla `users` con `wa_phone_number_id` correcto.

### Mensajes no se procesan

1. Verificar logs de `whatsapp-webhook`
2. Verificar que `auto_process` esté en `true` en settings del usuario
3. Verificar que el mensaje no sea duplicado (mismo `wa_message_id`)

---

## 8. Arquitectura

```
WhatsApp Business API
         │
         ▼
┌─────────────────────────┐
│   whatsapp-webhook      │  ← Recibe mensajes
│   (Edge Function)       │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│   process-message       │  ← Análisis con Gemini 2.0
│   (Edge Function)       │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│   PostgreSQL            │  ← Almacenamiento seguro
│   (Supabase)            │
│   - messages            │
│   - payments            │
│   - contacts            │
│   - debts               │
└─────────────────────────┘
           │
           ▼
┌─────────────────────────┐
│   Frontend React        │  ← Dashboard
└─────────────────────────┘
```

---

## Contacto y Soporte

Para problemas o preguntas:
1. Revisar logs en Supabase Dashboard
2. Verificar configuración con endpoint `/health`
3. Crear issue en el repositorio
