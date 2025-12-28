# Documentación de API

## Supabase Database

### Esquema de Tablas

#### profiles
Perfil de usuario (extensión de auth.users).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK a auth.users |
| full_name | text | Nombre completo |
| avatar_url | text | URL del avatar |
| phone | text | Teléfono del usuario |
| company_name | text | Nombre de empresa |
| currency | text | Moneda preferida (PEN, USD, etc.) |
| timezone | text | Zona horaria |
| language | text | Idioma preferido |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Última actualización |

#### contacts
Contactos/clientes del usuario.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK a auth.users |
| name | text | Nombre del contacto |
| phone | text | Teléfono (único por usuario) |
| email | text | Email |
| status | text | active, inactive, blocked |
| company | text | Empresa del contacto |
| location | text | Ubicación |
| total_paid | numeric | Total pagado históricamente |
| total_debt | numeric | Deuda actual |
| reliability_score | numeric | Puntaje de confiabilidad (0-100) |
| is_starred | boolean | Marcado como favorito |
| notes | text | Notas adicionales |
| last_payment_at | timestamp | Último pago |
| last_message_at | timestamp | Último mensaje |
| created_at | timestamp | Fecha de creación |

#### payments
Registro de pagos.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK a auth.users |
| contact_id | uuid | FK a contacts |
| amount | numeric | Monto del pago |
| currency | text | Moneda (PEN, USD, etc.) |
| method | text | transfer, cash, deposit, debit, credit, other |
| method_detail | text | Detalle del método |
| bank_name | text | Nombre del banco |
| account_number | text | Número de cuenta |
| reference_number | text | Número de referencia |
| status | text | pending, confirmed, rejected, cancelled |
| confidence_score | numeric | Score de confianza IA (0-100) |
| payment_date | date | Fecha del pago |
| payment_time | time | Hora del pago |
| notes | text | Notas adicionales |
| confirmed_by | uuid | Usuario que confirmó |
| confirmed_at | timestamp | Fecha de confirmación |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Última actualización |

#### messages
Mensajes de WhatsApp.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK a auth.users |
| contact_id | uuid | FK a contacts |
| whatsapp_id | text | ID del mensaje en WhatsApp |
| direction | text | incoming, outgoing |
| content | text | Contenido del mensaje |
| media_type | text | Tipo de media (image, document, etc.) |
| media_url | text | URL del archivo |
| is_payment_related | boolean | Relacionado con pago |
| detected_amount | numeric | Monto detectado por IA |
| requires_review | boolean | Requiere revisión manual |
| processed_at | timestamp | Fecha de procesamiento |
| created_at | timestamp | Fecha de recepción |

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Políticas:

```sql
-- Ejemplo: users can only see their own payments
CREATE POLICY "Users can view own payments"
ON payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
ON payments FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## Edge Functions

### whatsapp-webhook

Recibe mensajes de WhatsApp Business API.

**Endpoint:** `POST /functions/v1/whatsapp-webhook`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <SUPABASE_ANON_KEY>
```

**Body (ejemplo):**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "51999999999",
          "text": { "body": "Te transferí S/500 al BCP" }
        }]
      }
    }]
  }]
}
```

### process-payment

Procesa un mensaje para detectar pagos usando IA.

**Endpoint:** `POST /functions/v1/process-payment`

**Body:**
```json
{
  "message_id": "uuid",
  "content": "Te deposité 1000 soles"
}
```

**Response:**
```json
{
  "is_payment": true,
  "amount": 1000,
  "currency": "PEN",
  "method": "deposit",
  "confidence": 0.95
}
```

## Webhooks

### WhatsApp Business API

Configurar en Facebook Business:

1. **Verify Token:** Definido en variables de entorno
2. **Callback URL:** `https://<project>.supabase.co/functions/v1/whatsapp-webhook`
3. **Subscribed Fields:** messages, message_deliveries, message_reads
