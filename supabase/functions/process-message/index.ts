/**
 * Message Processor with AI Analysis and Business Rules
 *
 * UPDATED: Now uses Gemini 2.0 Flash (free tier) as primary AI model
 *
 * This function:
 * 1. Receives a message ID or content directly
 * 2. Downloads media if needed (images, documents)
 * 3. Runs AI analysis (classification + extraction) with Gemini
 * 4. Applies business rules (matching, validation)
 * 5. Creates payments/promises if detected
 * 6. Updates message status
 *
 * Security:
 * - Rate limiting per user
 * - Input validation and sanitization
 * - Secure API key handling
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting store (in-memory, resets on function restart)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 100; // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// ============================================
// Types
// ============================================

interface MessagePayload {
  // Either messageId (from webhook) or direct content (from frontend)
  messageId?: string;
  message?: string;
  content?: string;
  imageBase64?: string;
  mediaId?: string;
  messageType?: string;
  contactName?: string;
  contactPhone?: string;
}

interface PaymentAnalysis {
  intent: 'pago' | 'promesa' | 'consulta' | 'otro';
  confidence: number;
  extractedData: {
    amount?: number;
    currency?: string;
    date?: string;
    paymentMethod?: string;
    reference?: string;
    dueDate?: string;
  };
  summary: string;
  requiresReview: boolean;
}

interface BusinessRuleResult {
  matchedDebtId?: string;
  isDuplicate: boolean;
  duplicatePaymentId?: string;
  adjustedConfidence: number;
  validationNotes: string[];
}

// ============================================
// AI Prompts
// ============================================

const systemPrompt = `Eres un asistente experto en análisis de mensajes financieros para detección de pagos en Latinoamérica.

CONTEXTO:
- Analizas mensajes de WhatsApp de clientes a negocios
- El negocio usa este sistema para trackear pagos recibidos
- Los clientes pueden enviar: confirmaciones de pago, promesas de pago, consultas

CLASIFICACIÓN DE INTENCIÓN:
1. "pago": Confirmación de pago realizado
   - Palabras clave: pagué, transferí, deposité, ya pagué, ahí va el pago, te envié, hice la transferencia
   - Incluye: envío de comprobantes, capturas de transferencias

2. "promesa": Compromiso de pago futuro
   - Palabras clave: te pago el, mañana te, la próxima semana, el viernes te, apenas pueda
   - Incluye: fechas futuras, plazos

3. "consulta": Pregunta sobre deuda/estado
   - Palabras clave: cuánto debo, cuál es mi saldo, ya llegó mi pago, a cuánto asciende

4. "otro": Mensajes no relacionados con pagos/deudas
   - Saludos, preguntas generales, otros temas

EXTRACCIÓN DE DATOS (extraer SOLO si hay información clara):
- amount: Número decimal (1500.50, 200, etc). NO inventar montos.
- currency: PEN (soles), USD (dólares), ARS (pesos argentinos), MXN (pesos mexicanos), COP (pesos colombianos), BOB (bolivianos), CLP (pesos chilenos). Por defecto PEN si está en soles o no especifica.
- date: Formato YYYY-MM-DD. Para "hoy" usa la fecha actual, "ayer" resta un día.
- paymentMethod: yape, plin, transferencia, efectivo, tarjeta, deposito, billetera_digital
- reference: Número de operación, código de transacción (solo si está explícito)
- dueDate: Fecha prometida de pago (solo para promesas), formato YYYY-MM-DD

REGLAS IMPORTANTES:
1. Si la confianza es menor a 0.7, marca requiresReview = true
2. NO inventes datos que no estén en el mensaje
3. Detecta montos con diferentes formatos: $100, 100 soles, S/100, S/.100, 100.00, cien soles
4. Para fechas relativas: "ayer" = fecha actual - 1 día, "hoy" = fecha actual
5. Si es una imagen/comprobante sin texto, analiza la imagen para extraer datos visibles

EJEMPLOS:
- "Ya te transferí los 500 soles por Yape" → pago, amount: 500, currency: PEN, paymentMethod: yape
- "Te pago el viernes sin falta" → promesa, dueDate: próximo viernes
- "Cuánto te debo del mes pasado?" → consulta
- "Hola, cómo estás?" → otro

Responde ÚNICAMENTE con un JSON válido (sin markdown):
{
  "intent": "pago" | "promesa" | "consulta" | "otro",
  "confidence": 0.0 a 1.0,
  "extractedData": {
    "amount": number o null,
    "currency": string o null,
    "date": "YYYY-MM-DD" o null,
    "paymentMethod": string o null,
    "reference": string o null,
    "dueDate": "YYYY-MM-DD" o null
  },
  "summary": "resumen breve en español (máximo 50 palabras)",
  "requiresReview": boolean
}`;

// ============================================
// Security Functions
// ============================================

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

function sanitizeInput(input: string): string {
  if (!input) return '';
  // Remove potential injection attempts and limit length
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .slice(0, 10000); // Max 10KB of text
}

function validatePayload(payload: MessagePayload): { valid: boolean; error?: string } {
  // Must have either messageId or content
  if (!payload.messageId && !payload.message && !payload.content && !payload.imageBase64) {
    return { valid: false, error: 'Se requiere messageId, message, content o imageBase64' };
  }

  // Validate UUID format if messageId provided
  if (payload.messageId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.messageId)) {
    return { valid: false, error: 'messageId debe ser un UUID válido' };
  }

  // Validate image base64 if provided
  if (payload.imageBase64 && payload.imageBase64.length > 10 * 1024 * 1024) { // 10MB limit
    return { valid: false, error: 'Imagen demasiado grande (máximo 10MB)' };
  }

  return { valid: true };
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  try {
    // Get client identifier for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = checkRateLimit(clientIP);

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Límite de solicitudes excedido. Intente en 1 minuto.' }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          }
        }
      );
    }

    const payload: MessagePayload = await req.json();

    // Validate payload
    const validation = validatePayload(payload);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    let messageContent = sanitizeInput(payload.message || payload.content || '');
    let imageBase64 = payload.imageBase64;
    let messageId = payload.messageId;
    let userId: string | null = null;
    let contactId: string | null = null;

    // If messageId is provided, load from database
    if (messageId && supabase) {
      const { data: message, error } = await supabase
        .from('messages')
        .select('*, contacts(name, phone)')
        .eq('id', messageId)
        .single();

      if (error || !message) {
        console.error('Message not found:', messageId);
        return new Response(
          JSON.stringify({ error: 'Mensaje no encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      messageContent = sanitizeInput(message.content || '');
      userId = message.user_id;
      contactId = message.contact_id;

      // If there's a media_id and it's an image, download it
      if (message.media_id && message.type === 'image') {
        imageBase64 = await downloadWhatsAppMedia(supabase, userId, message.media_id);
      }

      // Add contact context if available
      if (message.contacts?.name) {
        messageContent = `[Mensaje de: ${message.contacts.name}]\n\n${messageContent}`;
      }
    } else {
      // Direct call (from frontend testing)
      if (payload.contactName) {
        messageContent = `[Mensaje de: ${sanitizeInput(payload.contactName)}${payload.contactPhone ? ` (${sanitizeInput(payload.contactPhone)})` : ''}]\n\n${messageContent}`;
      }
    }

    if (!messageContent && !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Se requiere un mensaje o imagen para analizar' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing message:', messageId || 'direct', 'Content length:', messageContent.length, 'Has image:', !!imageBase64);

    // ========================================
    // Step 1: AI Analysis with Gemini 2.0 Flash
    // ========================================
    const analysis = await runAIAnalysis(messageContent, imageBase64);

    console.log('AI Analysis result:', JSON.stringify(analysis));

    // ========================================
    // Step 2: Business Rules (if we have DB access)
    // ========================================
    let businessResult: BusinessRuleResult | null = null;

    if (supabase && userId && contactId) {
      businessResult = await applyBusinessRules(supabase, userId, contactId, analysis);

      // Adjust confidence based on business rules
      analysis.confidence = businessResult.adjustedConfidence;
      analysis.requiresReview = analysis.confidence < 0.7 || businessResult.isDuplicate;

      console.log('Business rules result:', JSON.stringify(businessResult));
    }

    // ========================================
    // Step 3: Create Payment/Promise (if detected)
    // ========================================
    let paymentId: string | null = null;
    let promiseId: string | null = null;

    if (supabase && userId && contactId && messageId) {
      if (analysis.intent === 'pago' && analysis.extractedData.amount && !businessResult?.isDuplicate) {
        paymentId = await createPayment(supabase, userId, contactId, messageId, analysis, businessResult);
      } else if (analysis.intent === 'promesa' && analysis.extractedData.dueDate) {
        promiseId = await createPromise(supabase, userId, contactId, messageId, analysis);
      }

      // ========================================
      // Step 4: Update Message Status
      // ========================================
      await supabase
        .from('messages')
        .update({
          analysis: analysis,
          intent: analysis.intent,
          confidence: analysis.confidence,
          extracted_data: analysis.extractedData,
          status: analysis.requiresReview ? 'review' : 'processed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      // Log event
      await supabase.rpc('log_event', {
        p_user_id: userId,
        p_event_type: 'message.processed',
        p_entity_type: 'message',
        p_entity_id: messageId,
        p_data: {
          intent: analysis.intent,
          confidence: analysis.confidence,
          payment_id: paymentId,
          promise_id: promiseId,
          is_duplicate: businessResult?.isDuplicate,
        },
      });
    }

    // Return the result
    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        businessRules: businessResult,
        paymentId,
        promiseId,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimitResult.remaining)
        }
      }
    );

  } catch (error) {
    console.error('Error in process-message:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================
// AI Analysis with Gemini 2.0 Flash
// ============================================

async function runAIAnalysis(content: string, imageBase64?: string): Promise<PaymentAnalysis> {
  // Priority order for API keys:
  // 1. GEMINI_API_KEY (direct Gemini access - FREE)
  // 2. GOOGLE_AI_API_KEY (alternative naming)
  // 3. LOVABLE_API_KEY (Lovable gateway)
  // 4. OPENAI_API_KEY (fallback)

  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_API_KEY');
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

  // Build user content
  const today = new Date().toISOString().split('T')[0];
  let userMessage = content ? `${content}\n\n[Fecha actual: ${today}]` : `[Fecha actual: ${today}]`;

  let response;

  // Try Gemini 2.0 Flash first (FREE and best for this use case)
  if (GEMINI_API_KEY) {
    console.log('Using Gemini 2.0 Flash API');

    // Build parts array for Gemini
    const parts: any[] = [{ text: userMessage }];

    if (imageBase64) {
      // Extract base64 data
      const base64Data = imageBase64.includes(',')
        ? imageBase64.split(',')[1]
        : imageBase64;

      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64Data
        }
      });
      parts.push({
        text: 'Analiza también la imagen adjunta. Si es un comprobante de pago, extrae todos los datos visibles: monto, fecha, banco, número de operación, etc.'
      });
    }

    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: systemPrompt }],
              role: 'user'
            },
            {
              parts: [{ text: 'Entendido. Analizaré los mensajes y responderé únicamente con JSON válido.' }],
              role: 'model'
            },
            {
              parts: parts,
              role: 'user'
            }
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
          ]
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiResponse) {
        console.log('Gemini response received');
        return parseAIResponse(aiResponse);
      }
    } else {
      console.error('Gemini API error:', response.status, await response.text());
    }
  }

  // Fallback to Lovable Gateway (has multiple models)
  if (LOVABLE_API_KEY) {
    console.log('Falling back to Lovable AI Gateway');

    const userContent: any[] = [{ type: 'text', text: userMessage }];

    if (imageBase64) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
        }
      });
      userContent.push({
        type: 'text',
        text: 'Analiza también la imagen adjunta. Si es un comprobante de pago, extrae todos los datos visibles.'
      });
    }

    response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.1,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;
      if (aiResponse) {
        return parseAIResponse(aiResponse);
      }
    }
  }

  // Final fallback to OpenAI
  if (OPENAI_API_KEY) {
    console.log('Falling back to OpenAI');

    const userContent: any[] = [{ type: 'text', text: userMessage }];

    if (imageBase64) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
        }
      });
    }

    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageBase64 ? 'gpt-4o' : 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.1,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;
      if (aiResponse) {
        return parseAIResponse(aiResponse);
      }
    }
  }

  // No API key available
  throw new Error('No hay API key configurada. Configure GEMINI_API_KEY (gratuito), LOVABLE_API_KEY, o OPENAI_API_KEY');
}

function parseAIResponse(aiResponse: string): PaymentAnalysis {
  try {
    // Clean the response - remove markdown code blocks if present
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

    const parsed = JSON.parse(cleanedResponse);

    // Validate and normalize
    return {
      intent: ['pago', 'promesa', 'consulta', 'otro'].includes(parsed.intent) ? parsed.intent : 'otro',
      confidence: typeof parsed.confidence === 'number' ? Math.min(Math.max(parsed.confidence, 0), 1) : 0.5,
      extractedData: {
        amount: parsed.extractedData?.amount || undefined,
        currency: parsed.extractedData?.currency || undefined,
        date: parsed.extractedData?.date || undefined,
        paymentMethod: parsed.extractedData?.paymentMethod || undefined,
        reference: parsed.extractedData?.reference || undefined,
        dueDate: parsed.extractedData?.dueDate || undefined,
      },
      summary: parsed.summary || 'No se pudo generar resumen',
      requiresReview: parsed.confidence < 0.7 || parsed.requiresReview === true,
    };
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError);
    return {
      intent: 'otro',
      confidence: 0.3,
      extractedData: {},
      summary: 'No se pudo analizar el mensaje automáticamente',
      requiresReview: true,
    };
  }
}

// ============================================
// Business Rules
// ============================================

async function applyBusinessRules(
  supabase: any,
  userId: string,
  contactId: string,
  analysis: PaymentAnalysis
): Promise<BusinessRuleResult> {
  const result: BusinessRuleResult = {
    isDuplicate: false,
    adjustedConfidence: analysis.confidence,
    validationNotes: [],
  };

  if (analysis.intent !== 'pago' || !analysis.extractedData.amount) {
    return result;
  }

  const amount = analysis.extractedData.amount;
  const currency = analysis.extractedData.currency || 'PEN';
  const date = analysis.extractedData.date || new Date().toISOString().split('T')[0];

  // Rule 1: Check for duplicate payments
  const { data: existingPayments } = await supabase
    .from('payments')
    .select('id, amount, payment_date, reference')
    .eq('user_id', userId)
    .eq('contact_id', contactId)
    .eq('currency', currency)
    .gte('amount', amount * 0.99)
    .lte('amount', amount * 1.01)
    .gte('payment_date', getDateMinusDays(date, 1))
    .lte('payment_date', getDatePlusDays(date, 1));

  if (existingPayments && existingPayments.length > 0) {
    // Check if reference matches (if both have references)
    const reference = analysis.extractedData.reference;
    const exactMatch = reference
      ? existingPayments.find((p: any) => p.reference === reference)
      : existingPayments[0];

    if (exactMatch || existingPayments.length > 0) {
      result.isDuplicate = true;
      result.duplicatePaymentId = (exactMatch || existingPayments[0]).id;
      result.validationNotes.push('Posible pago duplicado detectado');
    }
  }

  // Rule 2: Try to match with pending debts
  const { data: pendingDebts } = await supabase
    .from('debts')
    .select('id, amount, paid_amount, currency')
    .eq('user_id', userId)
    .eq('contact_id', contactId)
    .eq('currency', currency)
    .in('status', ['pending', 'partial', 'overdue']);

  if (pendingDebts && pendingDebts.length > 0) {
    // Find exact match
    const exactMatch = pendingDebts.find((d: any) => {
      const remaining = d.amount - d.paid_amount;
      return Math.abs(remaining - amount) < 0.01;
    });

    if (exactMatch) {
      result.matchedDebtId = exactMatch.id;
      result.adjustedConfidence = Math.min(analysis.confidence + 0.2, 1.0);
      result.validationNotes.push('Monto coincide exactamente con deuda pendiente');
    } else {
      // Find approximate match (within 5%)
      const approxMatch = pendingDebts.find((d: any) => {
        const remaining = d.amount - d.paid_amount;
        return Math.abs(remaining - amount) / remaining < 0.05;
      });

      if (approxMatch) {
        result.matchedDebtId = approxMatch.id;
        result.adjustedConfidence = Math.min(analysis.confidence + 0.1, 1.0);
        result.validationNotes.push('Monto aproximado a deuda pendiente (±5%)');
      }
    }
  }

  // Rule 3: Validate amount is reasonable (not suspiciously high)
  if (amount > 100000) {
    result.adjustedConfidence = Math.max(analysis.confidence - 0.2, 0);
    result.validationNotes.push('Monto inusualmente alto, requiere verificación');
  }

  return result;
}

// ============================================
// Data Creation
// ============================================

async function createPayment(
  supabase: any,
  userId: string,
  contactId: string,
  messageId: string,
  analysis: PaymentAnalysis,
  businessResult: BusinessRuleResult | null
): Promise<string | null> {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        contact_id: contactId,
        message_id: messageId,
        debt_id: businessResult?.matchedDebtId || null,
        amount: analysis.extractedData.amount,
        currency: analysis.extractedData.currency || 'PEN',
        payment_date: analysis.extractedData.date || new Date().toISOString().split('T')[0],
        payment_method: analysis.extractedData.paymentMethod || null,
        reference: analysis.extractedData.reference || null,
        status: analysis.confidence >= 0.7 ? 'detected' : 'detected',
        confidence: analysis.confidence,
        source: 'ai_detected',
        notes: businessResult?.validationNotes?.join('. ') || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      return null;
    }

    console.log('Payment created:', payment.id);

    // Log event
    await supabase.rpc('log_event', {
      p_user_id: userId,
      p_event_type: 'payment.detected',
      p_entity_type: 'payment',
      p_entity_id: payment.id,
      p_data: {
        amount: analysis.extractedData.amount,
        currency: analysis.extractedData.currency,
        confidence: analysis.confidence,
        matched_debt_id: businessResult?.matchedDebtId,
      },
    });

    return payment.id;
  } catch (error) {
    console.error('Error in createPayment:', error);
    return null;
  }
}

async function createPromise(
  supabase: any,
  userId: string,
  contactId: string,
  messageId: string,
  analysis: PaymentAnalysis
): Promise<string | null> {
  try {
    const { data: promise, error } = await supabase
      .from('payment_promises')
      .insert({
        user_id: userId,
        contact_id: contactId,
        message_id: messageId,
        amount: analysis.extractedData.amount || null,
        currency: analysis.extractedData.currency || 'PEN',
        promised_date: analysis.extractedData.dueDate,
        status: 'pending',
        notes: analysis.summary,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating promise:', error);
      return null;
    }

    console.log('Promise created:', promise.id);

    // Log event
    await supabase.rpc('log_event', {
      p_user_id: userId,
      p_event_type: 'promise.created',
      p_entity_type: 'payment_promise',
      p_entity_id: promise.id,
      p_data: {
        promised_date: analysis.extractedData.dueDate,
        amount: analysis.extractedData.amount,
      },
    });

    return promise.id;
  } catch (error) {
    console.error('Error in createPromise:', error);
    return null;
  }
}

// ============================================
// Media Download
// ============================================

async function downloadWhatsAppMedia(
  supabase: any,
  userId: string,
  mediaId: string
): Promise<string | null> {
  try {
    // Get user's access token
    const { data: user } = await supabase
      .from('users')
      .select('wa_access_token')
      .eq('id', userId)
      .single();

    if (!user?.wa_access_token) {
      console.log('No access token available for media download');
      return null;
    }

    // Get media URL from WhatsApp
    const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${user.wa_access_token}`,
      },
    });

    if (!mediaResponse.ok) {
      console.error('Error getting media URL:', await mediaResponse.text());
      return null;
    }

    const mediaData = await mediaResponse.json();
    const downloadUrl = mediaData.url;

    // Download the actual file
    const fileResponse = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${user.wa_access_token}`,
      },
    });

    if (!fileResponse.ok) {
      console.error('Error downloading media:', fileResponse.status);
      return null;
    }

    // Convert to base64
    const arrayBuffer = await fileResponse.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    return `data:${mediaData.mime_type};base64,${base64}`;
  } catch (error) {
    console.error('Error downloading media:', error);
    return null;
  }
}

// ============================================
// Helpers
// ============================================

function getDateMinusDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function getDatePlusDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
