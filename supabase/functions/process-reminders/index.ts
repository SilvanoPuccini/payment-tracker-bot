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

interface PaymentReminder {
  id: string;
  user_id: string;
  payment_id: string | null;
  contact_id: string | null;
  reminder_type: string;
  days_offset: number;
  status: string;
  scheduled_at: string;
  message_template: string | null;
  channel: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_due_date: string | null;
  status: string;
}

interface ReminderSettings {
  before_due_template: string;
  on_due_template: string;
  after_due_template: string;
}

// Replace template variables with actual values
function processTemplate(
  template: string,
  contact: Contact,
  payment: Payment | null,
  daysOverdue: number = 0
): string {
  let message = template;

  message = message.replace(/{contact_name}/g, contact.name);

  if (payment) {
    message = message.replace(/{amount}/g, payment.amount.toFixed(2));
    message = message.replace(/{currency}/g, payment.currency);

    if (payment.payment_due_date) {
      const dueDate = new Date(payment.payment_due_date);
      message = message.replace(/{due_date}/g, dueDate.toLocaleDateString('es-PE'));
    }
  }

  message = message.replace(/{days_overdue}/g, Math.abs(daysOverdue).toString());

  return message;
}

// Send WhatsApp message using existing send-whatsapp function
async function sendWhatsAppMessage(
  to: string,
  message: string,
  userId: string,
  contactId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to,
        message,
        userId,
        contactId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return { success: false, error: errorData };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Create notification for the user
async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data: Record<string, unknown>
): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    data,
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Processing scheduled reminders...');

  try {
    const now = new Date().toISOString();

    // Fetch all scheduled reminders that are due
    const { data: reminders, error: fetchError } = await supabase
      .from('payment_reminders')
      .select(`
        *,
        contacts:contact_id(id, name, phone, email),
        payments:payment_id(id, amount, currency, payment_due_date, status)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .limit(50);

    if (fetchError) {
      console.error('Error fetching reminders:', fetchError);
      throw fetchError;
    }

    if (!reminders || reminders.length === 0) {
      console.log('No reminders to process');
      return new Response(
        JSON.stringify({ processed: 0, message: 'No reminders to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${reminders.length} reminders to process`);

    let processed = 0;
    let sent = 0;
    let failed = 0;

    for (const reminder of reminders) {
      try {
        const contact = reminder.contacts as Contact;
        const payment = reminder.payments as Payment | null;

        if (!contact || !contact.phone) {
          console.log(`Skipping reminder ${reminder.id}: No contact or phone`);
          await supabase
            .from('payment_reminders')
            .update({
              status: 'failed',
              error_message: 'Contacto sin numero de telefono',
            })
            .eq('id', reminder.id);
          failed++;
          continue;
        }

        // Get reminder settings for template if not custom
        let messageTemplate = reminder.message_template;

        if (!messageTemplate) {
          const { data: settings } = await supabase
            .from('reminder_settings')
            .select('before_due_template, on_due_template, after_due_template')
            .eq('user_id', reminder.user_id)
            .single();

          if (settings) {
            switch (reminder.reminder_type) {
              case 'before_due':
                messageTemplate = settings.before_due_template;
                break;
              case 'on_due':
                messageTemplate = settings.on_due_template;
                break;
              case 'after_due':
                messageTemplate = settings.after_due_template;
                break;
            }
          }
        }

        if (!messageTemplate) {
          messageTemplate = `Hola {contact_name}, tienes un pago pendiente de {currency} {amount}.`;
        }

        // Calculate days overdue if applicable
        let daysOverdue = 0;
        if (payment?.payment_due_date) {
          const dueDate = new Date(payment.payment_due_date);
          const today = new Date();
          daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Process the message template
        const message = processTemplate(messageTemplate, contact, payment, daysOverdue);

        // Send the message via WhatsApp
        if (reminder.channel === 'whatsapp' || reminder.channel === 'both') {
          const result = await sendWhatsAppMessage(
            contact.phone,
            message,
            reminder.user_id,
            contact.id
          );

          if (result.success) {
            await supabase
              .from('payment_reminders')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
              })
              .eq('id', reminder.id);

            // Create notification for the user
            await createNotification(
              reminder.user_id,
              'reminder_sent',
              'Recordatorio enviado',
              `Se envio recordatorio a ${contact.name}`,
              {
                reminder_id: reminder.id,
                contact_id: contact.id,
                payment_id: payment?.id,
              }
            );

            sent++;
          } else {
            await supabase
              .from('payment_reminders')
              .update({
                status: 'failed',
                error_message: result.error || 'Error al enviar mensaje',
              })
              .eq('id', reminder.id);

            // Create notification for failure
            await createNotification(
              reminder.user_id,
              'reminder_failed',
              'Error al enviar recordatorio',
              `No se pudo enviar recordatorio a ${contact.name}`,
              {
                reminder_id: reminder.id,
                contact_id: contact.id,
                error: result.error,
              }
            );

            failed++;
          }
        }

        processed++;
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        await supabase
          .from('payment_reminders')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Error desconocido',
          })
          .eq('id', reminder.id);
        failed++;
      }
    }

    console.log(`Processed: ${processed}, Sent: ${sent}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({
        processed,
        sent,
        failed,
        message: `Procesados ${processed} recordatorios: ${sent} enviados, ${failed} fallidos`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-reminders:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
