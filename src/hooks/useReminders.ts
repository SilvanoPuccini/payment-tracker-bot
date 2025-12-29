import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types
export interface PaymentReminder {
  id: string;
  user_id: string;
  payment_id: string | null;
  contact_id: string | null;
  reminder_type: 'before_due' | 'on_due' | 'after_due' | 'custom';
  days_offset: number;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  scheduled_at: string;
  sent_at: string | null;
  message_template: string | null;
  channel: 'whatsapp' | 'email' | 'both';
  error_message: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  contact?: {
    id: string;
    name: string;
    phone: string;
  };
  payment?: {
    id: string;
    amount: number;
    currency: string;
    payment_due_date: string;
  };
}

export interface ReminderSettings {
  id: string;
  user_id: string;
  auto_remind_enabled: boolean;
  remind_before_days: number[];
  remind_after_days: number[];
  before_due_template: string;
  on_due_template: string;
  after_due_template: string;
  send_hour: number;
  weekend_send: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateReminderInput {
  payment_id?: string;
  contact_id?: string;
  reminder_type: 'before_due' | 'on_due' | 'after_due' | 'custom';
  days_offset?: number;
  scheduled_at: string;
  message_template?: string;
  channel?: 'whatsapp' | 'email' | 'both';
}

// Fetch reminders
export function useReminders(filters?: { status?: string; contact_id?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reminders', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('payment_reminders')
        .select(`
          *,
          contacts(id, name, phone),
          payments(id, amount, currency, payment_due_date)
        `)
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.contact_id) {
        query = query.eq('contact_id', filters.contact_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PaymentReminder[];
    },
    enabled: !!user?.id,
  });
}

// Fetch upcoming reminders (next N days)
export function useUpcomingReminders(days: number = 7) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reminders', 'upcoming', user?.id, days],
    queryFn: async () => {
      if (!user?.id) return [];

      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('payment_reminders')
        .select(`
          *,
          contacts(id, name, phone),
          payments(id, amount, currency, payment_due_date)
        `)
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', futureDate.toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(20);

      if (error) throw error;
      return data as PaymentReminder[];
    },
    enabled: !!user?.id,
  });
}

// Fetch reminder settings
export function useReminderSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reminder-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('reminder_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no settings exist, create default ones
        if (error.code === 'PGRST116') {
          const { data: newSettings, error: createError } = await supabase
            .from('reminder_settings')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (createError) throw createError;
          return newSettings as ReminderSettings;
        }
        throw error;
      }

      return data as ReminderSettings;
    },
    enabled: !!user?.id,
  });
}

// Create reminder
export function useCreateReminder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateReminderInput) => {
      if (!user?.id) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('payment_reminders')
        .insert({
          user_id: user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Recordatorio creado');
    },
    onError: (error) => {
      toast.error('Error al crear recordatorio: ' + error.message);
    },
  });
}

// Cancel reminder
export function useCancelReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reminderId: string) => {
      const { error } = await supabase
        .from('payment_reminders')
        .update({ status: 'cancelled' })
        .eq('id', reminderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Recordatorio cancelado');
    },
    onError: (error) => {
      toast.error('Error al cancelar recordatorio: ' + error.message);
    },
  });
}

// Reschedule reminder
export function useRescheduleReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, scheduledAt }: { id: string; scheduledAt: string }) => {
      const { error } = await supabase
        .from('payment_reminders')
        .update({
          scheduled_at: scheduledAt,
          status: 'scheduled',
          error_message: null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Recordatorio reprogramado');
    },
    onError: (error) => {
      toast.error('Error al reprogramar recordatorio: ' + error.message);
    },
  });
}

// Update reminder settings
export function useUpdateReminderSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<ReminderSettings>) => {
      if (!user?.id) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('reminder_settings')
        .update(settings)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-settings'] });
      toast.success('Configuracion de recordatorios actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar configuracion: ' + error.message);
    },
  });
}

// Create reminders for a payment based on settings
export function useSchedulePaymentReminders() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      paymentId,
      contactId,
      dueDate,
      amount,
      currency,
    }: {
      paymentId: string;
      contactId: string;
      dueDate: Date;
      amount: number;
      currency: string;
    }) => {
      if (!user?.id) throw new Error('No authenticated user');

      // Fetch user's reminder settings
      const { data: settings, error: settingsError } = await supabase
        .from('reminder_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError || !settings?.auto_remind_enabled) {
        return [];
      }

      const reminders: CreateReminderInput[] = [];

      // Create "before due" reminders
      for (const days of settings.remind_before_days || []) {
        const scheduledDate = new Date(dueDate);
        scheduledDate.setDate(scheduledDate.getDate() - days);
        scheduledDate.setHours(settings.send_hour || 10, 0, 0, 0);

        // Only schedule if in the future
        if (scheduledDate > new Date()) {
          reminders.push({
            payment_id: paymentId,
            contact_id: contactId,
            reminder_type: 'before_due',
            days_offset: -days,
            scheduled_at: scheduledDate.toISOString(),
            message_template: settings.before_due_template,
          });
        }
      }

      // Create "on due" reminder
      const onDueDate = new Date(dueDate);
      onDueDate.setHours(settings.send_hour || 10, 0, 0, 0);
      if (onDueDate > new Date()) {
        reminders.push({
          payment_id: paymentId,
          contact_id: contactId,
          reminder_type: 'on_due',
          days_offset: 0,
          scheduled_at: onDueDate.toISOString(),
          message_template: settings.on_due_template,
        });
      }

      // Create "after due" reminders
      for (const days of settings.remind_after_days || []) {
        const scheduledDate = new Date(dueDate);
        scheduledDate.setDate(scheduledDate.getDate() + days);
        scheduledDate.setHours(settings.send_hour || 10, 0, 0, 0);

        reminders.push({
          payment_id: paymentId,
          contact_id: contactId,
          reminder_type: 'after_due',
          days_offset: days,
          scheduled_at: scheduledDate.toISOString(),
          message_template: settings.after_due_template,
        });
      }

      // Insert all reminders
      if (reminders.length > 0) {
        const { data, error } = await supabase
          .from('payment_reminders')
          .insert(
            reminders.map((r) => ({
              user_id: user.id,
              ...r,
            }))
          )
          .select();

        if (error) throw error;
        return data;
      }

      return [];
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
        toast.success(`${data.length} recordatorios programados`);
      }
    },
    onError: (error) => {
      console.error('Error scheduling reminders:', error);
    },
  });
}
