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

// WhatsApp message types
interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'location' | 'contacts';
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string; caption?: string };
}

interface WhatsAppContact {
  profile: { name: string };
  wa_id: string;
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: WhatsAppContact[];
        messages?: WhatsAppMessage[];
        statuses?: any[];
      };
      field: string;
    }>;
  }>;
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

// Get user settings by phone number ID
async function getUserByPhoneId(phoneNumberId: string) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('user_id, auto_process, min_confidence_threshold, verify_token')
    .eq('whatsapp_phone_id', phoneNumberId)
    .single();

  if (error) {
    console.log('No user found for phone ID, trying to find any user with settings');
    // Fallback: get first user with settings (for demo purposes)
    const { data: anyUser } = await supabase
      .from('user_settings')
      .select('user_id, auto_process, min_confidence_threshold, verify_token')
      .limit(1)
      .single();
    return anyUser;
  }
  return data;
}

// Find or create contact
async function findOrCreateContact(userId: string, phone: string, name?: string) {
  // First try to find existing contact
  const { data: existing } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .eq('phone', phone)
    .single();

  if (existing) {
    return existing;
  }

  // Create new contact
  const { data: newContact, error } = await supabase
    .from('contacts')
    .insert({
      user_id: userId,
      phone: phone,
      name: name || phone,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating contact:', error);
    throw error;
  }

  return newContact;
}

// Save message to database
async function saveMessage(
  userId: string,
  contactId: string,
  whatsappMessageId: string,
  content: string,
  analysis: PaymentAnalysis | null,
  mediaUrl?: string,
  mediaType?: string
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      user_id: userId,
      contact_id: contactId,
      whatsapp_message_id: whatsappMessageId,
      sender: 'contact',
      content: content,
      media_url: mediaUrl || null,
      media_type: mediaType || null,
      is_payment_related: analysis?.intent === 'pago' || analysis?.intent === 'promesa',
      payment_intent: analysis?.intent || null,
      detected_amount: analysis?.extractedData?.amount || null,
      detected_currency: analysis?.extractedData?.currency || null,
      confidence_score: analysis?.confidence ? Math.round(analysis.confidence * 100) : null,
      requires_review: analysis?.requiresReview ?? true,
      ai_analysis: analysis || null,
      processed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving message:', error);
    throw error;
  }

  return data;
}

// Create payment from analysis
async function createPaymentFromAnalysis(
  userId: string,
  contactId: string,
  messageId: string,
  analysis: PaymentAnalysis
) {
  if (analysis.intent !== 'pago' || !analysis.extractedData.amount) {
    return null;
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      contact_id: contactId,
      message_id: messageId,
      amount: analysis.extractedData.amount,
      currency: analysis.extractedData.currency || 'PEN',
      status: 'pending',
      method: mapPaymentMethod(analysis.extractedData.paymentMethod),
      method_detail: analysis.extractedData.paymentMethod || null,
      reference_number: analysis.extractedData.reference || null,
      payment_date: analysis.extractedData.date || null,
      confidence_score: Math.round(analysis.confidence * 100),
      requires_review: analysis.requiresReview,
      notes: analysis.summary,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating payment:', error);
    throw error;
  }

  // Update contact stats
  await updateContactStats(contactId, analysis.extractedData.amount);

  return data;
}

// Map payment method string to enum
function mapPaymentMethod(method?: string): string | null {
  if (!method) return null;

  const methodLower = method.toLowerCase();

  if (methodLower.includes('yape')) return 'yape';
  if (methodLower.includes('plin')) return 'plin';
  if (methodLower.includes('bcp')) return 'transfer_bcp';
  if (methodLower.includes('bbva')) return 'transfer_bbva';
  if (methodLower.includes('interbank')) return 'transfer_interbank';
  if (methodLower.includes('scotiabank')) return 'transfer_scotiabank';
  if (methodLower.includes('deposito') || methodLower.includes('depósito')) return 'deposit';
  if (methodLower.includes('efectivo') || methodLower.includes('cash')) return 'cash';
  if (methodLower.includes('transferencia')) return 'transfer_bcp'; // Default to BCP

  return 'other';
}

// Update contact payment stats
async function updateContactStats(contactId: string, amount: number) {
  const { data: contact } = await supabase
    .from('contacts')
    .select('pending_amount, payment_count')
    .eq('id', contactId)
    .single();

  if (contact) {
    await supabase
      .from('contacts')
      .update({
        pending_amount: (contact.pending_amount || 0) + amount,
        payment_count: (contact.payment_count || 0) + 1,
        last_payment_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      })
      .eq('id', contactId);
  }
}

// Create payment promise
async function createPaymentPromise(
  userId: string,
  contactId: string,
  messageId: string,
  analysis: PaymentAnalysis
) {
  if (analysis.intent !== 'promesa') {
    return null;
  }

  const { data, error } = await supabase
    .from('payment_promises')
    .insert({
      user_id: userId,
      contact_id: contactId,
      message_id: messageId,
      promised_amount: analysis.extractedData.amount || 0,
      currency: analysis.extractedData.currency || 'PEN',
      promised_date: analysis.extractedData.dueDate || null,
      status: 'pending',
      notes: analysis.summary,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating promise:', error);
  }

  return data;
}

// Log webhook event
async function logWebhookEvent(
  userId: string | null,
  eventType: string,
  payload: any,
  status: string,
  errorMessage?: string,
  processingTimeMs?: number
) {
  await supabase.from('webhook_logs').insert({
    user_id: userId,
    event_type: eventType,
    payload: payload,
    status: status,
    error_message: errorMessage || null,
    processing_time_ms: processingTimeMs || null,
  });
}

// Call process-message function for AI analysis
async function analyzeMessageWithAI(
  message: string,
  contactName?: string,
  contactPhone?: string,
  imageBase64?: string
): Promise<PaymentAnalysis | null> {
  try {
    const functionUrl = `${supabaseUrl}/functions/v1/process-message`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        message,
        contactName,
        contactPhone,
        imageBase64,
      }),
    });

    if (!response.ok) {
      console.error('AI analysis failed:', response.status);
      return null;
    }

    const result = await response.json();
    return result.analysis || null;
  } catch (error) {
    console.error('Error calling AI analysis:', error);
    return null;
  }
}

// Download media from WhatsApp
async function downloadWhatsAppMedia(mediaId: string, accessToken: string): Promise<string | null> {
  try {
    // First, get the media URL
    const mediaUrlResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!mediaUrlResponse.ok) {
      console.error('Failed to get media URL');
      return null;
    }

    const mediaData = await mediaUrlResponse.json();
    const mediaUrl = mediaData.url;

    // Download the media
    const mediaResponse = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!mediaResponse.ok) {
      console.error('Failed to download media');
      return null;
    }

    const mediaBuffer = await mediaResponse.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(mediaBuffer)));

    return `data:${mediaData.mime_type};base64,${base64}`;
  } catch (error) {
    console.error('Error downloading media:', error);
    return null;
  }
}

serve(async (req) => {
  const startTime = Date.now();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ============================================
  // GET: Webhook Verification (Meta requirement)
  // ============================================
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log('Webhook verification request:', { mode, token, challenge: challenge?.substring(0, 10) });

    // Get verify token from any user settings or use default
    const { data: settings } = await supabase
      .from('user_settings')
      .select('verify_token')
      .limit(1)
      .single();

    const verifyToken = settings?.verify_token || Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'paytrack_verify_2024';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified successfully!');
      await logWebhookEvent(null, 'webhook_verification', { mode, token_valid: true }, 'success');
      return new Response(challenge, { status: 200 });
    } else {
      console.error('Webhook verification failed');
      await logWebhookEvent(null, 'webhook_verification', { mode, token_valid: false }, 'failed', 'Invalid verify token');
      return new Response('Forbidden', { status: 403 });
    }
  }

  // ============================================
  // POST: Handle incoming WhatsApp messages
  // ============================================
  if (req.method === 'POST') {
    try {
      const payload: WhatsAppWebhookPayload = await req.json();

      console.log('Received webhook payload:', JSON.stringify(payload).substring(0, 500));

      // Validate it's a WhatsApp message
      if (payload.object !== 'whatsapp_business_account') {
        console.log('Not a WhatsApp message, ignoring');
        return new Response(JSON.stringify({ status: 'ignored' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Process each entry
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // Skip if no messages (might be status update)
          if (!value.messages || value.messages.length === 0) {
            if (value.statuses) {
              console.log('Status update received, ignoring');
              await logWebhookEvent(null, 'status_update', value.statuses[0], 'ignored');
            }
            continue;
          }

          const phoneNumberId = value.metadata.phone_number_id;
          const contacts = value.contacts || [];
          const messages = value.messages;

          // Get user settings for this phone number
          const userSettings = await getUserByPhoneId(phoneNumberId);

          if (!userSettings) {
            console.error('No user found for phone number ID:', phoneNumberId);
            await logWebhookEvent(null, 'message_received', { phoneNumberId }, 'failed', 'No user configured');
            continue;
          }

          const userId = userSettings.user_id;
          const autoProcess = userSettings.auto_process ?? true;

          // Process each message
          for (const message of messages) {
            try {
              // Get contact info
              const whatsappContact = contacts.find((c: WhatsAppContact) => c.wa_id === message.from);
              const contactPhone = message.from;
              const contactName = whatsappContact?.profile?.name || contactPhone;

              console.log(`Processing message from ${contactName} (${contactPhone})`);

              // Find or create contact in database
              const contact = await findOrCreateContact(userId, contactPhone, contactName);

              // Extract message content based on type
              let messageContent = '';
              let imageBase64: string | undefined;
              let mediaType: string | undefined;
              let mediaUrl: string | undefined;

              switch (message.type) {
                case 'text':
                  messageContent = message.text?.body || '';
                  break;
                case 'image':
                  if (message.image) {
                    messageContent = message.image.caption || '[Imagen recibida]';
                    mediaType = message.image.mime_type;

                    // Download image for OCR if auto-processing is enabled
                    if (autoProcess) {
                      const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
                      if (accessToken) {
                        imageBase64 = await downloadWhatsAppMedia(message.image.id, accessToken) || undefined;
                      }
                    }
                  }
                  break;
                case 'document':
                  messageContent = '[Documento recibido]';
                  break;
                case 'audio':
                  messageContent = '[Audio recibido]';
                  break;
                case 'video':
                  messageContent = '[Video recibido]';
                  break;
                default:
                  messageContent = `[${message.type} recibido]`;
              }

              // Analyze message with AI if auto-processing is enabled
              let analysis: PaymentAnalysis | null = null;

              if (autoProcess && messageContent) {
                analysis = await analyzeMessageWithAI(
                  messageContent,
                  contactName,
                  contactPhone,
                  imageBase64
                );
                console.log('AI Analysis result:', analysis);
              }

              // Save message to database
              const savedMessage = await saveMessage(
                userId,
                contact.id,
                message.id,
                messageContent,
                analysis,
                mediaUrl,
                mediaType
              );

              // Create payment or promise if detected
              if (analysis) {
                if (analysis.intent === 'pago' && analysis.extractedData.amount) {
                  await createPaymentFromAnalysis(userId, contact.id, savedMessage.id, analysis);
                  console.log('Payment created from message');
                } else if (analysis.intent === 'promesa') {
                  await createPaymentPromise(userId, contact.id, savedMessage.id, analysis);
                  console.log('Promise created from message');
                }
              }

              // Log successful processing
              const processingTime = Date.now() - startTime;
              await logWebhookEvent(
                userId,
                'message_processed',
                {
                  message_id: message.id,
                  contact_id: contact.id,
                  intent: analysis?.intent || 'unknown',
                  confidence: analysis?.confidence || 0,
                },
                'success',
                undefined,
                processingTime
              );

              console.log(`Message processed successfully in ${processingTime}ms`);

            } catch (messageError) {
              console.error('Error processing individual message:', messageError);
              await logWebhookEvent(
                userId,
                'message_error',
                { message_id: message.id, error: String(messageError) },
                'failed',
                String(messageError)
              );
            }
          }
        }
      }

      // Always return 200 to WhatsApp to prevent retries
      return new Response(
        JSON.stringify({ status: 'processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Webhook error:', error);
      await logWebhookEvent(null, 'webhook_error', { error: String(error) }, 'failed', String(error));

      // Still return 200 to prevent WhatsApp from retrying
      return new Response(
        JSON.stringify({ status: 'error', message: String(error) }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
