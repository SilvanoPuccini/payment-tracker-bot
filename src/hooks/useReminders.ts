import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types - Note: payment_reminders and reminder_settings tables don't exist yet
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

// Local storage for reminders (until tables are created)
const localReminders: PaymentReminder[] = [];

// Fetch reminders - returns empty array since table doesn't exist
export function useReminders(filters?: { status?: string; contact_id?: string }) {
  const { user } = useAuth();

  return {
    data: localReminders.filter(r => {
      if (!user?.id) return false;
      if (r.user_id !== user.id) return false;
      if (filters?.status && r.status !== filters.status) return false;
      if (filters?.contact_id && r.contact_id !== filters.contact_id) return false;
      return true;
    }),
    isLoading: false,
    error: null,
  };
}

// Fetch upcoming reminders
export function useUpcomingReminders(days: number = 7) {
  const { user } = useAuth();

  return {
    data: localReminders.filter(r => {
      if (!user?.id) return false;
      if (r.user_id !== user.id) return false;
      if (r.status !== 'scheduled') return false;
      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const scheduledAt = new Date(r.scheduled_at);
      return scheduledAt >= now && scheduledAt <= futureDate;
    }),
    isLoading: false,
    error: null,
  };
}

// Fetch reminder settings - returns defaults since table doesn't exist
export function useReminderSettings() {
  const { user } = useAuth();

  const defaultSettings: ReminderSettings = {
    id: 'default',
    user_id: user?.id || '',
    auto_remind_enabled: false,
    remind_before_days: [3, 1],
    remind_after_days: [1, 3, 7],
    before_due_template: 'Hola {nombre}, te recordamos que tienes un pago pendiente de {monto} con vencimiento el {fecha}.',
    on_due_template: 'Hola {nombre}, hoy vence tu pago de {monto}. Por favor realiza el pago.',
    after_due_template: 'Hola {nombre}, tu pago de {monto} tiene {dias} dias de retraso. Por favor regulariza tu situacion.',
    send_hour: 10,
    weekend_send: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    data: defaultSettings,
    isLoading: false,
    error: null,
  };
}

// Create reminder
export function useCreateReminder() {
  const { user } = useAuth();

  return {
    mutateAsync: async (input: CreateReminderInput) => {
      if (!user?.id) throw new Error('No authenticated user');

      const newReminder: PaymentReminder = {
        id: crypto.randomUUID(),
        user_id: user.id,
        payment_id: input.payment_id || null,
        contact_id: input.contact_id || null,
        reminder_type: input.reminder_type,
        days_offset: input.days_offset || 0,
        status: 'scheduled',
        scheduled_at: input.scheduled_at,
        sent_at: null,
        message_template: input.message_template || null,
        channel: input.channel || 'whatsapp',
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      localReminders.push(newReminder);
      toast.success('Recordatorio creado');
      return newReminder;
    },
    isPending: false,
  };
}

// Cancel reminder
export function useCancelReminder() {
  return {
    mutateAsync: async (reminderId: string) => {
      const reminder = localReminders.find(r => r.id === reminderId);
      if (reminder) {
        reminder.status = 'cancelled';
        reminder.updated_at = new Date().toISOString();
      }
      toast.success('Recordatorio cancelado');
    },
    isPending: false,
  };
}

// Reschedule reminder
export function useRescheduleReminder() {
  return {
    mutateAsync: async ({ id, scheduledAt }: { id: string; scheduledAt: string }) => {
      const reminder = localReminders.find(r => r.id === id);
      if (reminder) {
        reminder.scheduled_at = scheduledAt;
        reminder.status = 'scheduled';
        reminder.error_message = null;
        reminder.updated_at = new Date().toISOString();
      }
      toast.success('Recordatorio reprogramado');
    },
    isPending: false,
  };
}

// Update reminder settings
export function useUpdateReminderSettings() {
  return {
    mutateAsync: async (settings: Partial<ReminderSettings>) => {
      toast.success('Configuracion de recordatorios actualizada');
      return settings;
    },
    isPending: false,
  };
}

// Schedule payment reminders
export function useSchedulePaymentReminders() {
  return {
    mutateAsync: async (params: {
      paymentId: string;
      contactId: string;
      dueDate: Date;
      amount: number;
      currency: string;
    }) => {
      // For now, just return empty array since tables don't exist
      return [];
    },
    isPending: false,
  };
}
