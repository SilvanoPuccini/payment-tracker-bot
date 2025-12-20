# Arquitectura Técnica - PayTrack MVP

## Resumen Ejecutivo

Sistema de detección automática de pagos y deudas a través de WhatsApp Business Cloud API, con procesamiento de IA y reglas de negocio.

---

## 1. Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WHATSAPP BUSINESS CLOUD API                       │
│                              (Meta Platform)                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Webhook (POST)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE EDGE FUNCTIONS                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │  whatsapp-webhook │─▶│ process-message  │─▶│  business-rules  │          │
│  │  (Verificación    │  │ (IA + OCR)       │  │  (Matching)       │          │
│  │   + Ingesta)      │  │                  │  │                   │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Persistencia
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE POSTGRESQL                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  users   │ │ contacts │ │ messages │ │ payments │ │  debts   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                                     │
│  │attachments│ │  events │ │ settings │                                     │
│  └──────────┘ └──────────┘ └──────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ REST API / Realtime
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Dashboard │ │ Messages │ │ Payments │ │ Contacts │ │ Reports  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Flujo de Datos Detallado

### 2.1 Recepción de Mensaje WhatsApp

```
Cliente envía mensaje
        │
        ▼
┌───────────────────────────────────────┐
│ Meta Platform (WhatsApp Business API) │
│ POST → webhook_url/whatsapp-webhook   │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 1. VERIFICACIÓN (GET)                  │
│    - hub.mode = "subscribe"            │
│    - hub.verify_token = config         │
│    - Retorna hub.challenge             │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 2. INGESTA (POST)                      │
│    - Validar signature (X-Hub-Sig)     │
│    - Extraer mensaje                   │
│    - Descargar media si existe         │
│    - Guardar en DB (raw)               │
│    - Responder 200 OK inmediatamente   │
└───────────────────────────────────────┘
        │
        ▼ (async)
┌───────────────────────────────────────┐
│ 3. PROCESAMIENTO IA                    │
│    - Clasificar intención              │
│    - Extraer entidades                 │
│    - OCR si es imagen                  │
│    - Calcular confidence score         │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 4. REGLAS DE NEGOCIO                   │
│    - Match con deudas existentes       │
│    - Validar montos                    │
│    - Detectar duplicados               │
│    - Actualizar estados                │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 5. PERSISTENCIA                        │
│    - Guardar análisis                  │
│    - Crear/actualizar payment          │
│    - Registrar evento                  │
│    - Notificar si requiere revisión    │
└───────────────────────────────────────┘
```

### 2.2 Estructura del Webhook Payload (Meta)

```typescript
interface WhatsAppWebhookPayload {
  object: "whatsapp_business_account";
  entry: Array<{
    id: string;                    // WhatsApp Business Account ID
    changes: Array<{
      value: {
        messaging_product: "whatsapp";
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;           // Número del contacto
        }>;
        messages?: Array<{
          from: string;            // Número del remitente
          id: string;              // Message ID único
          timestamp: string;       // Unix timestamp
          type: "text" | "image" | "audio" | "document" | "video";
          text?: { body: string };
          image?: {
            id: string;            // Media ID para descargar
            mime_type: string;
            sha256: string;
          };
          audio?: {
            id: string;
            mime_type: string;
          };
        }>;
        statuses?: Array<{         // Confirmaciones de entrega
          id: string;
          status: "sent" | "delivered" | "read";
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: "messages";
    }>;
  }>;
}
```

---

## 3. Esquema de Base de Datos

### 3.1 Diagrama ER

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   users     │       │  contacts   │       │   debts     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │───┐   │ id (PK)     │   ┌───│ id (PK)     │
│ email       │   │   │ user_id(FK) │◀──┘   │ user_id(FK) │
│ phone       │   │   │ wa_id       │       │ contact_id  │
│ business_   │   │   │ phone       │◀──────│ amount      │
│   name      │   │   │ name        │       │ currency    │
│ wa_phone_id │   │   │ created_at  │       │ due_date    │
│ wa_business │   │   └─────────────┘       │ status      │
│   _id       │   │          │              │ description │
│ settings    │   │          │              └─────────────┘
│ created_at  │   │          │                    │
└─────────────┘   │          │                    │
       │          │          ▼                    ▼
       │          │   ┌─────────────┐       ┌─────────────┐
       │          │   │  messages   │       │  payments   │
       │          │   ├─────────────┤       ├─────────────┤
       │          └──▶│ id (PK)     │       │ id (PK)     │
       │              │ user_id(FK) │       │ user_id(FK) │
       │              │ contact_id  │◀──────│ message_id  │
       │              │ wa_msg_id   │       │ debt_id(FK) │
       │              │ type        │       │ contact_id  │
       │              │ content     │       │ amount      │
       │              │ media_url   │       │ currency    │
       │              │ direction   │       │ date        │
       │              │ timestamp   │       │ method      │
       │              │ analysis    │       │ reference   │
       │              │ intent      │       │ status      │
       │              │ confidence  │       │ confidence  │
       │              │ status      │       │ source      │
       │              └─────────────┘       └─────────────┘
       │                    │
       │                    ▼
       │              ┌─────────────┐
       │              │ attachments │
       │              ├─────────────┤
       │              │ id (PK)     │
       │              │ message_id  │
       │              │ type        │
       │              │ url         │
       │              │ ocr_result  │
       │              └─────────────┘
       │
       └──────────────────────┐
                              ▼
                        ┌─────────────┐
                        │   events    │
                        ├─────────────┤
                        │ id (PK)     │
                        │ user_id(FK) │
                        │ type        │
                        │ entity_type │
                        │ entity_id   │
                        │ data        │
                        │ created_at  │
                        └─────────────┘
```

### 3.2 Tablas Detalladas

#### users
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| email | text | Email único |
| phone | text | Teléfono del negocio |
| business_name | text | Nombre del negocio |
| wa_phone_number_id | text | Phone Number ID de Meta |
| wa_business_account_id | text | Business Account ID |
| wa_access_token | text | Token de acceso (encriptado) |
| settings | jsonb | Configuraciones |
| created_at | timestamptz | Fecha creación |
| updated_at | timestamptz | Última actualización |

#### contacts
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| wa_id | text | ID WhatsApp del contacto |
| phone | text | Número normalizado |
| name | text | Nombre del contacto |
| email | text | Email (opcional) |
| notes | text | Notas |
| total_debt | decimal | Deuda total calculada |
| created_at | timestamptz | Primera interacción |
| updated_at | timestamptz | Última actualización |

#### messages
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| contact_id | uuid | FK → contacts |
| wa_message_id | text | ID único de WhatsApp |
| type | enum | text, image, audio, document |
| content | text | Contenido del mensaje |
| media_url | text | URL del archivo |
| direction | enum | inbound, outbound |
| timestamp | timestamptz | Fecha del mensaje |
| analysis | jsonb | Resultado del análisis IA |
| intent | enum | pago, promesa, consulta, otro |
| confidence | decimal | Score de confianza (0-1) |
| status | enum | pending, processed, review, error |
| processed_at | timestamptz | Fecha de procesamiento |
| created_at | timestamptz | Fecha de creación |

#### payments
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| contact_id | uuid | FK → contacts |
| message_id | uuid | FK → messages (origen) |
| debt_id | uuid | FK → debts (si aplica) |
| amount | decimal | Monto del pago |
| currency | text | Moneda (PEN, USD, etc.) |
| payment_date | date | Fecha del pago |
| payment_method | text | Método (yape, plin, transferencia) |
| reference | text | Número de operación |
| status | enum | detected, confirmed, rejected |
| confidence | decimal | Score de confianza |
| source | enum | ai_detected, manual, ocr |
| notes | text | Notas adicionales |
| reviewed_by | uuid | FK → users (quien revisó) |
| reviewed_at | timestamptz | Fecha de revisión |
| created_at | timestamptz | Fecha creación |

#### debts
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| contact_id | uuid | FK → contacts |
| amount | decimal | Monto original |
| currency | text | Moneda |
| due_date | date | Fecha de vencimiento |
| description | text | Descripción |
| status | enum | pending, partial, paid, overdue |
| paid_amount | decimal | Monto pagado |
| created_at | timestamptz | Fecha creación |
| updated_at | timestamptz | Última actualización |

#### attachments
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| message_id | uuid | FK → messages |
| type | enum | image, audio, document |
| mime_type | text | Tipo MIME |
| url | text | URL en storage |
| size | integer | Tamaño en bytes |
| ocr_result | jsonb | Resultado OCR |
| ocr_confidence | decimal | Confianza OCR |
| created_at | timestamptz | Fecha creación |

#### events
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| type | text | Tipo de evento |
| entity_type | text | Tipo de entidad |
| entity_id | uuid | ID de la entidad |
| data | jsonb | Datos del evento |
| created_at | timestamptz | Fecha del evento |

---

## 4. Servicios de IA

### 4.1 Clasificador de Intenciones

```typescript
interface MessageClassification {
  intent: 'pago' | 'promesa' | 'consulta' | 'otro';
  confidence: number;       // 0.0 - 1.0
  extractedData: {
    amount?: number;
    currency?: string;
    date?: string;          // ISO format
    paymentMethod?: string;
    reference?: string;
    dueDate?: string;       // Para promesas
  };
  summary: string;
  requiresReview: boolean;  // true si confidence < 0.7
}
```

### 4.2 Prompt del Sistema (Actualizado)

```
Eres un asistente experto en análisis de mensajes financieros para
detección de pagos en Latinoamérica.

CONTEXTO:
- Analizas mensajes de WhatsApp de clientes a negocios
- El negocio usa este sistema para trackear pagos recibidos
- Los clientes pueden enviar: confirmaciones de pago, promesas, consultas

CLASIFICACIÓN DE INTENCIÓN:
1. "pago": Confirmación de pago realizado
   - Palabras clave: pagué, transferí, deposité, ya pagué, ahí va el pago
   - Incluye: envío de comprobantes

2. "promesa": Compromiso de pago futuro
   - Palabras clave: te pago el, mañana te, la próxima semana
   - Incluye: fechas futuras

3. "consulta": Pregunta sobre deuda/estado
   - Palabras clave: cuánto debo, cuál es mi saldo

4. "otro": Mensajes no relacionados

EXTRACCIÓN DE DATOS:
- amount: Solo números (1500.50, no "mil quinientos")
- currency: PEN, USD, ARS, MXN, COP, BOB, CLP
- date: Formato YYYY-MM-DD
- paymentMethod: yape, plin, transferencia, efectivo, tarjeta
- reference: Número de operación
- dueDate: Fecha prometida (solo para promesas)

REGLAS:
- Si confidence < 0.7, requiresReview = true
- Detectar formatos: $100, 100 soles, S/100, S/.100
- Fechas relativas: "ayer" = fecha - 1 día, "hoy" = fecha actual
```

### 4.3 OCR para Comprobantes

Cuando se recibe una imagen:
1. Enviar a modelo multimodal (Gemini Vision / GPT-4V)
2. Extraer:
   - Monto
   - Fecha
   - Banco/Institución
   - Número de operación
   - Tipo de operación

---

## 5. Reglas de Negocio

### 5.1 Matching de Pagos

```typescript
interface MatchingRule {
  // Si el pago detectado coincide con una deuda
  matchPaymentToDebt(payment: DetectedPayment, debts: Debt[]): Match | null;
}

// Reglas de matching:
// 1. Mismo contacto
// 2. Monto exacto = match perfecto (confidence boost +0.2)
// 3. Monto ± 5% = match probable
// 4. Fecha dentro del rango de vencimiento = match probable
```

### 5.2 Detección de Duplicados

```typescript
// Un pago es duplicado si:
// - Mismo contacto
// - Mismo monto (±1%)
// - Misma fecha (±1 día)
// - Misma referencia (si existe)
```

### 5.3 Estados y Transiciones

```
Mensaje recibido → pending
        │
        ▼ (IA procesa)
    processed
        │
        ├─ confidence ≥ 0.7 → auto_confirmed
        │
        └─ confidence < 0.7 → needs_review
                                    │
                                    ├─ usuario confirma → confirmed
                                    │
                                    └─ usuario rechaza → rejected
```

---

## 6. API Endpoints

### 6.1 Edge Functions

| Función | Método | Descripción |
|---------|--------|-------------|
| `whatsapp-webhook` | GET/POST | Webhook de Meta |
| `process-message` | POST | Procesar mensaje con IA |
| `download-media` | POST | Descargar media de WhatsApp |
| `send-message` | POST | Enviar mensaje (opcional) |

### 6.2 Supabase REST API

```
GET    /rest/v1/messages       - Listar mensajes
GET    /rest/v1/payments       - Listar pagos
GET    /rest/v1/contacts       - Listar contactos
GET    /rest/v1/debts          - Listar deudas
POST   /rest/v1/payments       - Crear pago manual
PATCH  /rest/v1/payments/:id   - Actualizar pago
```

---

## 7. Seguridad

### 7.1 Verificación de Webhook

```typescript
const verifyWebhookSignature = (
  payload: string,
  signature: string,
  appSecret: string
): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');
  return `sha256=${expectedSignature}` === signature;
};
```

### 7.2 Encriptación de Datos

- Access tokens: Encriptados con AES-256
- Datos sensibles: Column-level encryption en Supabase
- Comunicación: HTTPS obligatorio

### 7.3 Rate Limiting

- Webhook: Sin límite (Meta controla)
- API: 100 requests/minuto por usuario
- IA: Basado en plan (Lovable/OpenAI)

---

## 8. Monitoreo y Observabilidad

### 8.1 Logs

```typescript
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  message: string;
  data?: object;
  trace_id?: string;
}
```

### 8.2 Métricas

- Mensajes procesados/hora
- Tiempo promedio de procesamiento
- Tasa de detección exitosa
- Mensajes que requieren revisión
- Errores de IA

---

## 9. Suposiciones y Riesgos

### Suposiciones
1. El usuario ya tiene cuenta de WhatsApp Business verificada
2. El usuario puede configurar webhooks en Meta Dashboard
3. Lovable AI Gateway está disponible para procesamiento
4. Los clientes envían mensajes en español

### Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Rate limit de IA | Media | Alto | Queue + backoff |
| Falsos positivos | Media | Medio | Revisión manual |
| Downtime Meta | Baja | Alto | Buffer local |
| Pérdida de mensajes | Baja | Alto | Logs + retry |

---

## 10. Roadmap de Implementación

### Semana 1-2: Foundation
- [ ] Esquema de base de datos
- [ ] Webhook handler completo
- [ ] Persistencia de mensajes

### Semana 3-4: Core
- [ ] Procesamiento IA robusto
- [ ] OCR para comprobantes
- [ ] Reglas de matching

### Semana 5-6: Dashboard
- [ ] Página de mensajes
- [ ] Página de pagos
- [ ] Página de contactos

### Semana 7-8: Polish
- [ ] Reportes básicos
- [ ] Alertas
- [ ] Testing

### Semana 9-12: Producción
- [ ] Seguridad hardening
- [ ] Documentación
- [ ] Deploy producción
