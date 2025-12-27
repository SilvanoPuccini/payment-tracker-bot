import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SendMessagePayload {
  to: string; // Phone number with country code (e.g., "51999888777")
  message: string;
  userId?: string; // For logging purposes
  contactId?: string; // For saving the sent message
}

interface WhatsAppApiResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { to, message, userId, contactId }: SendMessagePayload = await req.json();

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Se requiere número de teléfono y mensaje' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get WhatsApp credentials from user settings or environment
    let phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    let accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');

    // If userId provided, try to get user-specific credentials
    if (userId) {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('whatsapp_phone_id, whatsapp_access_token')
        .eq('user_id', userId)
        .single();

      if (settings?.whatsapp_phone_id) {
        phoneNumberId = settings.whatsapp_phone_id;
      }
      if (settings?.whatsapp_access_token) {
        accessToken = settings.whatsapp_access_token;
      }
    }

    if (!phoneNumberId || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp no está configurado. Por favor configure las credenciales.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number (remove any non-numeric characters)
    const formattedPhone = to.replace(/\D/g, '');

    console.log(`Sending WhatsApp message to ${formattedPhone}`);

    // Send message via WhatsApp Business API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        }),
      }
    );

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.text();
      console.error('WhatsApp API error:', errorData);

      return new Response(
        JSON.stringify({
          error: 'Error al enviar mensaje',
          details: errorData
        }),
        { status: whatsappResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseData: WhatsAppApiResponse = await whatsappResponse.json();
    console.log('Message sent successfully:', responseData);

    // Save sent message to database if user and contact provided
    if (userId && contactId) {
      await supabase.from('messages').insert({
        user_id: userId,
        contact_id: contactId,
        whatsapp_message_id: responseData.messages[0]?.id,
        sender: 'user',
        content: message,
        is_payment_related: false,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: responseData.messages[0]?.id,
        to: formattedPhone,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
