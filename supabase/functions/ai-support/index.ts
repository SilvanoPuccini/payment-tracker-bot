import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// CORS Configuration
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean);

function getCorsHeaders(origin?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (!origin) {
    headers['Access-Control-Allow-Origin'] = '*';
    return headers;
  }

  // En desarrollo permitir todo, en producción solo orígenes permitidos
  if (ALLOWED_ORIGINS.length === 0) {
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else {
    headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGINS[0] || '*';
  }

  return headers;
}

// Supabase Admin Client for logging
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// ============================================================================
// RATE LIMITING & DEDUPLICATION CONFIGURATION
// ============================================================================

// Rate limit: requests per window
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;  // 5 requests per minute per user/IP
const RATE_LIMIT_ANONYMOUS_MAX = 3; // 3 requests per minute for anonymous

// Idempotency cache TTL
const IDEMPOTENCY_TTL_MS = 300000; // 5 minutes

// Payload deduplication TTL
const DEDUP_TTL_MS = 30000; // 30 seconds - don't process same query within 30s

// In-memory caches (will reset on cold start, which is acceptable for rate limiting)
const rateLimitCache = new Map<string, { count: number; windowStart: number }>();
const idempotencyCache = new Map<string, { response: unknown; timestamp: number }>();
const payloadDeduplicationCache = new Map<string, { response: unknown; timestamp: number }>();

// Cleanup old entries periodically
function cleanupCaches() {
  const now = Date.now();

  // Cleanup rate limit entries older than window
  for (const [key, value] of rateLimitCache.entries()) {
    if (now - value.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitCache.delete(key);
    }
  }

  // Cleanup idempotency entries older than TTL
  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > IDEMPOTENCY_TTL_MS) {
      idempotencyCache.delete(key);
    }
  }

  // Cleanup dedup entries older than TTL
  for (const [key, value] of payloadDeduplicationCache.entries()) {
    if (now - value.timestamp > DEDUP_TTL_MS) {
      payloadDeduplicationCache.delete(key);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupCaches, 60000);

// ============================================================================
// RATE LIMITER
// ============================================================================

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

function checkRateLimit(identifier: string, isAuthenticated: boolean): RateLimitResult {
  const now = Date.now();
  const maxRequests = isAuthenticated ? RATE_LIMIT_MAX_REQUESTS : RATE_LIMIT_ANONYMOUS_MAX;

  const entry = rateLimitCache.get(identifier);

  if (!entry || (now - entry.windowStart > RATE_LIMIT_WINDOW_MS)) {
    // New window
    rateLimitCache.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

// ============================================================================
// INTERFACES
// ============================================================================

interface SupportRequest {
  problem: string;
  context?: {
    contactName?: string;
    amount?: number;
    date?: string;
    paymentId?: string;
  };
  userEmail?: string;
  idempotencyKey?: string;
  payloadHash?: string;
}

interface SupportAnalysis {
  diagnosis: string;
  explanation: string;
  recommendation: string;
  resolved: boolean;
  confidence: number;
  category: 'payment' | 'whatsapp' | 'account' | 'technical' | 'other';
  suggestedActions?: string[];
}

interface LogPayload {
  user_id: string | null;
  user_email: string | null;
  request: { problem: string; context?: SupportRequest['context'] };
  response: SupportAnalysis | null;
  status: string;
  error: string | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Insert log asynchronously (fire and forget)
async function insertLog(payload: LogPayload): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('ai_support_logs').insert([payload]);
    if (error) {
      console.error('Failed to insert log:', error.message);
    }
  } catch (e) {
    console.error('Error inserting log:', e);
  }
}

// Verify user token using Supabase Auth
async function verifyToken(token: string): Promise<{ id: string; email?: string } | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
      },
    });

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    return user?.id ? { id: user.id, email: user.email } : null;
  } catch {
    return null;
  }
}

// Get client IP for rate limiting anonymous users
function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

// Create error response with proper typing
function errorResponse(
  message: string,
  status: number,
  corsHeaders: Record<string, string>,
  extra?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({ error: message, ...extra }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Create rate limit response
function rateLimitResponse(
  retryAfter: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'rate_limit',
      message: `Demasiadas solicitudes. Por favor espera ${retryAfter} segundos.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
      }
    }
  );
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const systemPrompt = `Eres el Asistente de Soporte IA de PayTrack, una aplicación para gestionar y rastrear pagos recibidos por WhatsApp.

## SOBRE PAYTRACK:
PayTrack es una app que:
- Recibe mensajes de WhatsApp de clientes
- Detecta automáticamente pagos usando IA (analizando texto y comprobantes)
- Extrae montos, fechas, métodos de pago y referencias
- Organiza contactos y su historial de pagos
- Envía recordatorios de cobro
- Genera reportes financieros

## PROBLEMAS COMUNES Y SOLUCIONES:

### PAGOS NO DETECTADOS:
- **Causa común**: Imagen borrosa o de baja calidad
- **Solución**: Pedir al cliente una foto más clara del comprobante
- **Alternativa**: Si es transferencia bancaria, pedir el PDF del banco o captura de pantalla nítida

### MONTO INCORRECTO:
- **Causa**: La IA puede confundir comisiones, impuestos o totales parciales
- **Solución**: Corregir manualmente desde "Detalle del pago" > "Editar monto"
- **Nota**: La IA aprende de correcciones para mejorar futuras detecciones

### CONEXIÓN WHATSAPP:
- **Síntomas**: No llegan mensajes, sesión expirada
- **Solución**: Ir a Configuración > WhatsApp > Reconectar
- **Importante**: Mantener el teléfono con WhatsApp conectado a internet

### CONTACTOS DUPLICADOS:
- **Causa**: Mismo contacto con diferentes números
- **Solución**: Ir a Contactos > seleccionar > "Fusionar contactos"

### RECORDATORIOS NO ENVIADOS:
- **Verificar**: Que WhatsApp esté conectado
- **Verificar**: Que el contacto tenga número válido
- **Verificar**: Horario configurado para envíos

### ERRORES DE SISTEMA:
- **Primer paso**: Cerrar sesión y volver a entrar
- **Segundo paso**: Limpiar caché del navegador
- **Si persiste**: Crear ticket de soporte técnico

## INSTRUCCIONES:
1. Analiza el problema descrito por el usuario
2. Identifica la categoría del problema
3. Proporciona un diagnóstico claro y conciso
4. Explica la causa probable del problema
5. Da recomendaciones paso a paso para solucionarlo
6. Si no puedes resolver, sugiere crear un ticket

## FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con JSON válido:
{
  "diagnosis": "Resumen del problema en una oración",
  "explanation": "Explicación detallada de por qué ocurre (2-3 oraciones)",
  "recommendation": "Pasos claros para solucionar el problema",
  "resolved": true/false (true si das una solución, false si necesita soporte humano),
  "confidence": 0.0 a 1.0,
  "category": "payment" | "whatsapp" | "account" | "technical" | "other",
  "suggestedActions": ["Acción 1", "Acción 2"]
}`;

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let userId: string | null = null;
  let userEmail: string | null = null;
  let rateLimitIdentifier: string;
  let isAuthenticated = false;

  try {
    // ========================================================================
    // AUTHENTICATION (optional but recommended)
    // ========================================================================
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token) {
      const user = await verifyToken(token);
      if (user) {
        userId = user.id;
        userEmail = user.email || null;
        rateLimitIdentifier = `user:${userId}`;
        isAuthenticated = true;
        console.log('Usuario autenticado:', userId);
      } else {
        console.log('Token inválido, continuando sin autenticación');
        rateLimitIdentifier = `ip:${getClientIP(req)}`;
      }
    } else {
      console.log('Sin token de autenticación, continuando como anónimo');
      rateLimitIdentifier = `ip:${getClientIP(req)}`;
    }

    // ========================================================================
    // RATE LIMITING
    // ========================================================================
    const rateLimitResult = checkRateLimit(rateLimitIdentifier, isAuthenticated);

    if (!rateLimitResult.allowed) {
      console.log('Rate limit exceeded for:', rateLimitIdentifier);

      // Log rate limit hit
      insertLog({
        user_id: userId,
        user_email: userEmail,
        request: { problem: 'rate_limited' },
        response: null,
        status: 'rate_limited',
        error: `Rate limit exceeded. Retry after ${rateLimitResult.retryAfter}s`,
      });

      return rateLimitResponse(rateLimitResult.retryAfter || 60, corsHeaders);
    }

    // ========================================================================
    // PARSE REQUEST
    // ========================================================================
    const { problem, context, userEmail: bodyEmail, idempotencyKey, payloadHash }: SupportRequest = await req.json();

    if (!problem) {
      return errorResponse('Se requiere describir el problema', 400, corsHeaders);
    }

    // ========================================================================
    // IDEMPOTENCY CHECK
    // ========================================================================
    if (idempotencyKey) {
      const cachedResponse = idempotencyCache.get(idempotencyKey);
      if (cachedResponse) {
        console.log('Returning cached response for idempotency key:', idempotencyKey);
        return new Response(
          JSON.stringify(cachedResponse.response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Idempotent': 'true' } }
        );
      }
    }

    // ========================================================================
    // PAYLOAD DEDUPLICATION
    // ========================================================================
    if (payloadHash) {
      const dedupKey = `${rateLimitIdentifier}:${payloadHash}`;
      const cachedDedup = payloadDeduplicationCache.get(dedupKey);
      if (cachedDedup) {
        console.log('Returning cached response for duplicate payload');
        return new Response(
          JSON.stringify(cachedDedup.response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Deduplicated': 'true' } }
        );
      }
    }

    // ========================================================================
    // GEMINI API CALL
    // ========================================================================
    const GEMINI_SUPPORT_KEY = Deno.env.get('GEMINI_SUPPORT_API_KEY');
    if (!GEMINI_SUPPORT_KEY) {
      console.error('GEMINI_SUPPORT_API_KEY no está configurada');
      return errorResponse('Error de configuración del servidor', 500, corsHeaders);
    }

    // Build context message
    let userMessage = problem;
    if (context) {
      const contextParts = [];
      if (context.contactName) contextParts.push(`Contacto: ${context.contactName}`);
      if (context.amount) contextParts.push(`Monto: $${context.amount}`);
      if (context.date) contextParts.push(`Fecha: ${context.date}`);
      if (context.paymentId) contextParts.push(`ID Pago: ${context.paymentId}`);

      if (contextParts.length > 0) {
        userMessage = `[Contexto del pago]\n${contextParts.join('\n')}\n\n[Problema reportado]\n${problem}`;
      }
    }

    console.log('Procesando solicitud de soporte IA para usuario:', userId || rateLimitIdentifier);

    // Call Gemini API - usando gemini-3-flash (modelo más nuevo)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${GEMINI_SUPPORT_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n---\n\nConsulta del usuario:\n${userMessage}` }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });

    // ========================================================================
    // HANDLE GEMINI ERRORS
    // ========================================================================
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de Gemini API:', response.status, errorText);

      // Log error
      insertLog({
        user_id: userId,
        user_email: bodyEmail || userEmail,
        request: { problem, context },
        response: null,
        status: 'gemini_error',
        error: `${response.status}: ${errorText.substring(0, 500)}`,
      });

      // Gemini rate limit
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: 'external_rate_limit',
            message: 'El servicio de IA está temporalmente sobrecargado. Intente más tarde.',
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return errorResponse('Error al procesar la consulta con IA', 500, corsHeaders);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      console.error('Respuesta vacía de la IA');

      insertLog({
        user_id: userId,
        user_email: bodyEmail || userEmail,
        request: { problem, context },
        response: null,
        status: 'empty_response',
        error: 'No AI response content',
      });

      return errorResponse('No se recibió respuesta del modelo', 500, corsHeaders);
    }

    // ========================================================================
    // PARSE AI RESPONSE
    // ========================================================================
    let analysis: SupportAnalysis;
    try {
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();

      analysis = JSON.parse(cleanedResponse);

      // Validate and normalize
      analysis = {
        diagnosis: analysis.diagnosis || 'Análisis del problema',
        explanation: analysis.explanation || 'No se pudo determinar la causa exacta.',
        recommendation: analysis.recommendation || 'Te recomendamos crear un ticket de soporte.',
        resolved: typeof analysis.resolved === 'boolean' ? analysis.resolved : false,
        confidence: typeof analysis.confidence === 'number' ? Math.min(Math.max(analysis.confidence, 0), 1) : 0.5,
        category: ['payment', 'whatsapp', 'account', 'technical', 'other'].includes(analysis.category)
          ? analysis.category
          : 'other',
        suggestedActions: Array.isArray(analysis.suggestedActions) ? analysis.suggestedActions : [],
      };
    } catch (parseError) {
      console.error('Error al parsear respuesta de IA:', parseError);
      analysis = {
        diagnosis: 'Análisis completado',
        explanation: aiResponse.substring(0, 300),
        recommendation: 'Por favor, revisa la explicación o crea un ticket para asistencia personalizada.',
        resolved: false,
        confidence: 0.4,
        category: 'other',
        suggestedActions: ['Crear ticket de soporte'],
      };
    }

    // ========================================================================
    // BUILD SUCCESS RESPONSE
    // ========================================================================
    const successResponse = {
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
      rateLimitRemaining: rateLimitResult.remaining,
    };

    // Cache for idempotency
    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, { response: successResponse, timestamp: Date.now() });
    }

    // Cache for deduplication
    if (payloadHash) {
      const dedupKey = `${rateLimitIdentifier}:${payloadHash}`;
      payloadDeduplicationCache.set(dedupKey, { response: successResponse, timestamp: Date.now() });
    }

    // Log successful request
    insertLog({
      user_id: userId,
      user_email: bodyEmail || userEmail,
      request: { problem, context },
      response: analysis,
      status: 'success',
      error: null,
    });

    console.log('Análisis de soporte completado para usuario:', userId || rateLimitIdentifier);

    return new Response(
      JSON.stringify(successResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en ai-support:', error);

    // Log error
    if (userId) {
      insertLog({
        user_id: userId,
        user_email: userEmail,
        request: { problem: 'unknown' },
        response: null,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Differentiate error types
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    if (errorMessage.includes('JSON')) {
      return errorResponse('Error al procesar la solicitud. Verifica el formato.', 400, corsHeaders);
    }

    return errorResponse(errorMessage, 500, corsHeaders);
  }
});
