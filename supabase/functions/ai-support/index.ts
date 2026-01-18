import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SupportRequest {
  problem: string;
  context?: {
    contactName?: string;
    amount?: number;
    date?: string;
    paymentId?: string;
  };
  userEmail?: string;
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { problem, context, userEmail }: SupportRequest = await req.json();

    if (!problem) {
      return new Response(
        JSON.stringify({ error: 'Se requiere describir el problema' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar API key dedicada para soporte (separada de la de pagos)
    const GEMINI_SUPPORT_KEY = Deno.env.get('GEMINI_SUPPORT_API_KEY');
    if (!GEMINI_SUPPORT_KEY) {
      console.error('GEMINI_SUPPORT_API_KEY no está configurada');
      return new Response(
        JSON.stringify({ error: 'Error de configuración del servidor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    console.log('Procesando solicitud de soporte IA...');
    console.log('Problema:', problem.substring(0, 100));

    // Llamar directamente a la API de Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_SUPPORT_KEY}`, {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de Gemini API:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de solicitudes excedido. Intente más tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 400) {
        return new Response(
          JSON.stringify({ error: 'Error en la solicitud. Verifica tu API key.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Error al procesar la consulta con IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    // Gemini API response format
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      console.error('Respuesta vacía de la IA');
      return new Response(
        JSON.stringify({ error: 'No se recibió respuesta del modelo' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Respuesta cruda de IA:', aiResponse.substring(0, 200));

    // Parse the JSON response
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
      // Fallback: try to extract useful info from raw response
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

    console.log('Análisis de soporte completado:', analysis.diagnosis);

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en ai-support:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
