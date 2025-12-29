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

interface SchedulePayload {
  payment_id: string;
  user_id: string;
  contact_id: string;
  due_date: string; // ISO date string
  amount: number;
  currency: string;
}

interface ReminderSettings {
  auto_remind_enabled: boolean;
  remind_before_days: number[];
  remind_after_days: number[];
  remind_on_due: boolean;
  preferred_reminder_hour: number;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
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
    const payload: SchedulePayload = await req.json();
    const { payment_id, user_id, contact_id, due_date, amount, currency } = payload;

    if (!payment_id || !user_id || !due_date) {
      return new Response(
        JSON.stringify({ error: 'Se requiere payment_id, user_id y due_date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Scheduling reminders for payment ${payment_id}, due date: ${due_date}`);

    // Get user's reminder settings
    const { data: settings, error: settingsError } = await supabase
      .from('reminder_settings')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (settingsError) {
      console.log('No reminder settings found, using defaults');
    }

    // Default settings if none exist
    const reminderSettings: ReminderSettings = {
      auto_remind_enabled: settings?.auto_remind_enabled ?? true,
      remind_before_days: settings?.remind_before_days ?? [3, 1],
      remind_after_days: settings?.remind_after_days ?? [1, 3, 7],
      remind_on_due: settings?.remind_on_due ?? true,
      preferred_reminder_hour: settings?.preferred_reminder_hour ?? 9,
      whatsapp_enabled: settings?.whatsapp_enabled ?? true,
      email_enabled: settings?.email_enabled ?? false,
    };

    if (!reminderSettings.auto_remind_enabled) {
      console.log('Auto reminders disabled for user');
      return new Response(
        JSON.stringify({ scheduled: 0, message: 'Recordatorios automaticos desactivados' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const dueDate = new Date(due_date);
    const now = new Date();
    const remindersToCreate: Array<{
      user_id: string;
      payment_id: string;
      contact_id: string;
      reminder_type: string;
      days_offset: number;
      scheduled_at: string;
      channel: string;
    }> = [];

    const channel = reminderSettings.whatsapp_enabled && reminderSettings.email_enabled
      ? 'both'
      : reminderSettings.whatsapp_enabled
        ? 'whatsapp'
        : 'email';

    // Schedule "before due" reminders
    for (const days of reminderSettings.remind_before_days) {
      const scheduledDate = new Date(dueDate);
      scheduledDate.setDate(scheduledDate.getDate() - days);
      scheduledDate.setHours(reminderSettings.preferred_reminder_hour, 0, 0, 0);

      // Only schedule if in the future
      if (scheduledDate > now) {
        remindersToCreate.push({
          user_id,
          payment_id,
          contact_id,
          reminder_type: 'before_due',
          days_offset: -days,
          scheduled_at: scheduledDate.toISOString(),
          channel,
        });
      }
    }

    // Schedule "on due" reminder
    if (reminderSettings.remind_on_due) {
      const onDueDate = new Date(dueDate);
      onDueDate.setHours(reminderSettings.preferred_reminder_hour, 0, 0, 0);

      if (onDueDate > now) {
        remindersToCreate.push({
          user_id,
          payment_id,
          contact_id,
          reminder_type: 'on_due',
          days_offset: 0,
          scheduled_at: onDueDate.toISOString(),
          channel,
        });
      }
    }

    // Schedule "after due" reminders
    for (const days of reminderSettings.remind_after_days) {
      const scheduledDate = new Date(dueDate);
      scheduledDate.setDate(scheduledDate.getDate() + days);
      scheduledDate.setHours(reminderSettings.preferred_reminder_hour, 0, 0, 0);

      remindersToCreate.push({
        user_id,
        payment_id,
        contact_id,
        reminder_type: 'after_due',
        days_offset: days,
        scheduled_at: scheduledDate.toISOString(),
        channel,
      });
    }

    if (remindersToCreate.length === 0) {
      console.log('No reminders to schedule (all dates are in the past)');
      return new Response(
        JSON.stringify({ scheduled: 0, message: 'No hay recordatorios para programar' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert all reminders
    const { data: createdReminders, error: insertError } = await supabase
      .from('payment_reminders')
      .insert(remindersToCreate)
      .select();

    if (insertError) {
      console.error('Error inserting reminders:', insertError);
      throw insertError;
    }

    console.log(`Scheduled ${createdReminders?.length || 0} reminders`);

    // Create notification for the user
    await supabase.from('notifications').insert({
      user_id,
      type: 'reminders_scheduled',
      title: 'Recordatorios programados',
      message: `Se programaron ${createdReminders?.length || 0} recordatorios para este pago`,
      data: {
        payment_id,
        reminder_count: createdReminders?.length || 0,
      },
    });

    return new Response(
      JSON.stringify({
        scheduled: createdReminders?.length || 0,
        reminders: createdReminders,
        message: `Se programaron ${createdReminders?.length || 0} recordatorios`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in schedule-reminders:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
