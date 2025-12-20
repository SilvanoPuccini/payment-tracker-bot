/**
 * WhatsApp Business Cloud API Webhook Handler
 *
 * This function handles:
 * 1. Webhook verification (GET) - Meta verifies our endpoint
 * 2. Message ingestion (POST) - Receives incoming messages
 * 3. Status updates (POST) - Delivery confirmations
 *
 * Flow:
 * Meta → Webhook → Persist Raw → Process Async → AI Analysis → Business Rules → Update
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// ============================================
// Types
// ============================================

interface WhatsAppWebhookPayload {
  object: "whatsapp_business_account";
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: "whatsapp";
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: "text" | "image" | "audio" | "document" | "video" | "sticker" | "location";
          text?: { body: string };
          image?: {
            id: string;
            mime_type: string;
            sha256: string;
            caption?: string;
          };
          audio?: {
            id: string;
            mime_type: string;
          };
          document?: {
            id: string;
            mime_type: string;
            filename: string;
            caption?: string;
          };
          video?: {
            id: string;
            mime_type: string;
            caption?: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: "sent" | "delivered" | "read" | "failed";
          timestamp: string;
          recipient_id: string;
          errors?: Array<{
            code: number;
            title: string;
            message: string;
          }>;
        }>;
      };
      field: "messages";
    }>;
  }>;
}

interface ProcessedMessage {
  user_id: string;
  contact_id: string;
  wa_message_id: string;
  type: string;
  content: string | null;
  media_id: string | null;
  direction: string;
  wa_timestamp: string;
  status: string;
}

// ============================================
// Main Handler
// ============================================

serve(async (req: Request) => {
  const url = new URL(req.url);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client with service role for full access
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // ========================================
    // GET: Webhook Verification (Meta)
    // ========================================
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      console.log('Webhook verification request:', { mode, token: token?.substring(0, 10) + '...' });

      if (mode === 'subscribe') {
        // Get the verify token from any user (in production, use a global config)
        const { data: user } = await supabase
          .from('users')
          .select('wa_webhook_verify_token')
          .not('wa_webhook_verify_token', 'is', null)
          .limit(1)
          .single();

        const validToken = user?.wa_webhook_verify_token || Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'paytrack_verify_2024';

        if (token === validToken) {
          console.log('Webhook verified successfully');
          return new Response(challenge, {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
          });
        } else {
          console.error('Invalid verify token');
          return new Response('Forbidden', { status: 403, headers: corsHeaders });
        }
      }

      return new Response('Bad Request', { status: 400, headers: corsHeaders });
    }

    // ========================================
    // POST: Receive Messages
    // ========================================
    if (req.method === 'POST') {
      // Get raw body for signature verification
      const rawBody = await req.text();

      // Verify signature (optional but recommended for production)
      const signature = req.headers.get('x-hub-signature-256');
      if (signature) {
        const appSecret = Deno.env.get('WHATSAPP_APP_SECRET');
        if (appSecret) {
          const isValid = await verifySignature(rawBody, signature, appSecret);
          if (!isValid) {
            console.error('Invalid webhook signature');
            return new Response('Unauthorized', { status: 401, headers: corsHeaders });
          }
        }
      }

      // Parse the payload
      const payload: WhatsAppWebhookPayload = JSON.parse(rawBody);

      // Validate it's from WhatsApp
      if (payload.object !== 'whatsapp_business_account') {
        console.log('Not a WhatsApp webhook, ignoring');
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      console.log('Received WhatsApp webhook:', JSON.stringify(payload, null, 2));

      // Process each entry
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          const value = change.value;
          const phoneNumberId = value.metadata.phone_number_id;

          // Find the user by phone_number_id
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, settings')
            .eq('wa_phone_number_id', phoneNumberId)
            .single();

          if (userError || !user) {
            console.error('User not found for phone_number_id:', phoneNumberId);
            // Still return 200 to Meta to prevent retries
            continue;
          }

          // Process incoming messages
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              const contact = value.contacts?.find(c => c.wa_id === message.from);

              await processIncomingMessage(
                supabase,
                user.id,
                message,
                contact,
                phoneNumberId,
                user.settings
              );
            }
          }

          // Process status updates (delivery confirmations)
          if (value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
              await processStatusUpdate(supabase, user.id, status);
            }
          }
        }
      }

      // Always return 200 to Meta quickly
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    // Return 200 even on error to prevent Meta from retrying
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================
// Message Processing
// ============================================

async function processIncomingMessage(
  supabase: any,
  userId: string,
  message: any,
  contact: any,
  phoneNumberId: string,
  userSettings: any
) {
  console.log('Processing message:', message.id, 'from:', message.from);

  try {
    // 1. Find or create contact
    const contactId = await findOrCreateContact(
      supabase,
      userId,
      message.from,
      contact?.profile?.name
    );

    // 2. Check for duplicate message
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('wa_message_id', message.id)
      .single();

    if (existingMessage) {
      console.log('Duplicate message, skipping:', message.id);
      return;
    }

    // 3. Extract message content
    const { content, mediaId } = extractMessageContent(message);

    // 4. Insert message into database
    const { data: savedMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        contact_id: contactId,
        wa_message_id: message.id,
        type: message.type,
        content: content,
        media_id: mediaId,
        direction: 'inbound',
        wa_timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error saving message:', messageError);
      throw messageError;
    }

    console.log('Message saved:', savedMessage.id);

    // 5. Log event
    await supabase.rpc('log_event', {
      p_user_id: userId,
      p_event_type: 'message.received',
      p_entity_type: 'message',
      p_entity_id: savedMessage.id,
      p_data: {
        from: message.from,
        type: message.type,
        wa_message_id: message.id,
      },
    });

    // 6. Trigger async processing if auto_process is enabled
    const autoProcess = userSettings?.auto_process !== false;
    if (autoProcess) {
      // Call the process-message function asynchronously
      await triggerMessageProcessing(supabase, savedMessage.id, content, mediaId, message.type);
    }

  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
}

async function findOrCreateContact(
  supabase: any,
  userId: string,
  waId: string,
  name?: string
): Promise<string> {
  // Try to find existing contact
  const { data: existingContact } = await supabase
    .from('contacts')
    .select('id')
    .eq('user_id', userId)
    .eq('wa_id', waId)
    .single();

  if (existingContact) {
    // Update name if provided and different
    if (name) {
      await supabase
        .from('contacts')
        .update({ name })
        .eq('id', existingContact.id);
    }
    return existingContact.id;
  }

  // Create new contact
  const phone = '+' + waId; // Add + prefix
  const { data: newContact, error } = await supabase
    .from('contacts')
    .insert({
      user_id: userId,
      wa_id: waId,
      phone: phone,
      name: name || phone,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating contact:', error);
    throw error;
  }

  console.log('Created new contact:', newContact.id);
  return newContact.id;
}

function extractMessageContent(message: any): { content: string | null; mediaId: string | null } {
  switch (message.type) {
    case 'text':
      return { content: message.text?.body || null, mediaId: null };
    case 'image':
      return { content: message.image?.caption || null, mediaId: message.image?.id || null };
    case 'audio':
      return { content: null, mediaId: message.audio?.id || null };
    case 'document':
      return { content: message.document?.caption || message.document?.filename || null, mediaId: message.document?.id || null };
    case 'video':
      return { content: message.video?.caption || null, mediaId: message.video?.id || null };
    default:
      return { content: null, mediaId: null };
  }
}

async function triggerMessageProcessing(
  supabase: any,
  messageId: string,
  content: string | null,
  mediaId: string | null,
  messageType: string
) {
  // Update status to processing
  await supabase
    .from('messages')
    .update({ status: 'processing' })
    .eq('id', messageId);

  // Call the process-message edge function
  // In production, this would be a queue-based system
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/process-message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messageId,
        content,
        mediaId,
        messageType,
      }),
    });

    if (!response.ok) {
      console.error('Error calling process-message:', await response.text());
    }
  } catch (error) {
    console.error('Error triggering message processing:', error);
  }
}

// ============================================
// Status Updates
// ============================================

async function processStatusUpdate(supabase: any, userId: string, status: any) {
  console.log('Status update:', status.id, status.status);

  // Log the status event
  await supabase.rpc('log_event', {
    p_user_id: userId,
    p_event_type: `message.${status.status}`,
    p_entity_type: 'message',
    p_entity_id: null, // We don't have internal message ID here
    p_data: {
      wa_message_id: status.id,
      status: status.status,
      recipient_id: status.recipient_id,
      errors: status.errors,
    },
  });
}

// ============================================
// Security
// ============================================

async function verifySignature(
  payload: string,
  signature: string,
  appSecret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(appSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = 'sha256=' + signatureArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
