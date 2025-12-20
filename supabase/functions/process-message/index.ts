import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MessagePayload {
  message: string;
  imageBase64?: string;
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

const systemPrompt = `Eres un asistente experto en análisis de mensajes financieros para detección de pagos.

Tu trabajo es analizar mensajes de WhatsApp para:
1. Clasificar la INTENCIÓN del mensaje:
   - "pago": El usuario confirma que realizó un pago o envía comprobante
   - "promesa": El usuario promete pagar en una fecha futura
   - "consulta": El usuario pregunta sobre montos, fechas, o estado de cuenta
   - "otro": Mensajes no relacionados con pagos

2. Extraer DATOS del mensaje cuando sea posible:
   - amount: Monto numérico (solo número, sin símbolos)
   - currency: Moneda (USD, PEN, ARS, MXN, COP, etc.)
   - date: Fecha del pago en formato ISO (YYYY-MM-DD)
   - paymentMethod: Método de pago (transferencia, yape, plin, efectivo, tarjeta, etc.)
   - reference: Número de operación o referencia
   - dueDate: Fecha prometida de pago para promesas (YYYY-MM-DD)

3. Generar un RESUMEN breve de lo detectado (máximo 50 palabras)

4. Indicar si REQUIERE REVISIÓN manual (confidence < 0.7)

REGLAS IMPORTANTES:
- Si el mensaje contiene palabras como "pagué", "transferí", "deposité", "envié", es probable un PAGO
- Si contiene "te pago el", "mañana te", "la próxima semana", es probable una PROMESA
- Si contiene "cuánto debo", "cuál es mi saldo", "¿ya llegó?", es probable una CONSULTA
- Detecta montos con diferentes formatos: $100, 100 soles, S/100, 100.00, etc.
- Detecta fechas relativas: "ayer", "hoy", "el lunes", "15 de enero"

Responde ÚNICAMENTE con un JSON válido con esta estructura:
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
  "summary": "resumen breve",
  "requiresReview": boolean
}`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, imageBase64, contactName, contactPhone }: MessagePayload = await req.json();

    if (!message && !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Se requiere un mensaje o imagen para analizar' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY no está configurada');
      return new Response(
        JSON.stringify({ error: 'Error de configuración del servidor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the user message content
    const userContent: any[] = [];
    
    let textMessage = message || '';
    if (contactName) {
      textMessage = `[Mensaje de: ${contactName}${contactPhone ? ` (${contactPhone})` : ''}]\n\n${textMessage}`;
    }
    
    if (textMessage) {
      userContent.push({ type: 'text', text: textMessage });
    }

    // Add image if provided (for OCR of payment receipts)
    if (imageBase64) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
        }
      });
      // Add context for image analysis
      userContent.push({
        type: 'text',
        text: 'Analiza también la imagen adjunta. Si es un comprobante de pago, extrae todos los datos visibles: monto, fecha, banco, referencia, etc.'
      });
    }

    console.log('Procesando mensaje para análisis de pagos...');
    console.log('Tiene imagen:', !!imageBase64);
    console.log('Contacto:', contactName || 'No especificado');

    // Call Lovable AI Gateway with gemini-2.5-flash for balanced performance
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.1, // Low temperature for consistent extraction
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de Lovable AI:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de solicitudes excedido. Intente más tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos agotados. Por favor recargue su cuenta.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Error al procesar el mensaje con IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error('Respuesta vacía de la IA');
      return new Response(
        JSON.stringify({ error: 'No se recibió respuesta del modelo' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Respuesta cruda de IA:', aiResponse);

    // Parse the JSON response from AI
    let analysis: PaymentAnalysis;
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

      analysis = JSON.parse(cleanedResponse);
      
      // Validate and normalize the response
      analysis = {
        intent: ['pago', 'promesa', 'consulta', 'otro'].includes(analysis.intent) ? analysis.intent : 'otro',
        confidence: typeof analysis.confidence === 'number' ? Math.min(Math.max(analysis.confidence, 0), 1) : 0.5,
        extractedData: {
          amount: analysis.extractedData?.amount || undefined,
          currency: analysis.extractedData?.currency || undefined,
          date: analysis.extractedData?.date || undefined,
          paymentMethod: analysis.extractedData?.paymentMethod || undefined,
          reference: analysis.extractedData?.reference || undefined,
          dueDate: analysis.extractedData?.dueDate || undefined,
        },
        summary: analysis.summary || 'No se pudo generar resumen',
        requiresReview: analysis.confidence < 0.7 || analysis.requiresReview === true,
      };
    } catch (parseError) {
      console.error('Error al parsear respuesta de IA:', parseError);
      // Return a fallback analysis
      analysis = {
        intent: 'otro',
        confidence: 0.3,
        extractedData: {},
        summary: 'No se pudo analizar el mensaje automáticamente',
        requiresReview: true,
      };
    }

    console.log('Análisis completado:', JSON.stringify(analysis));

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en process-message:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
