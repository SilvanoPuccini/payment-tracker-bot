import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, SettingsUpdate } from '@/types/database';
import { toast } from 'sonner';

// Fetch user settings
export function useSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['settings', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      // Try to get existing settings
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create them
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating settings:', insertError);
          // Return default settings if insert fails
          return {
            id: '',
            user_id: user.id,
            webhook_url: null,
            verify_token: 'paytrack_verify_2024',
            whatsapp_phone_id: null,
            whatsapp_business_id: null,
            whatsapp_access_token: null,
            auto_process: true,
            min_confidence_threshold: 70,
            low_confidence_alert: true,
            notifications_enabled: true,
            notify_new_payments: true,
            notify_promises: true,
            notify_errors: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Settings;
        }

        return newSettings as Settings;
      }

      return data as Settings;
    },
    enabled: !!user,
  });
}

// Update user settings
export function useUpdateSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: SettingsUpdate) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Configuración guardada');
    },
    onError: (error) => {
      toast.error(`Error al guardar: ${error.message}`);
    },
  });
}

// Test webhook connection
export function useTestWebhookConnection() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user logged in');

      // Get current settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('webhook_url, verify_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!settings?.webhook_url) {
        throw new Error('No hay URL de webhook configurada');
      }

      // Try to call the webhook with a test message
      const response = await fetch(settings.webhook_url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Webhook respondió con error: ${response.status}`);
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Conexión exitosa con el webhook');
    },
    onError: (error) => {
      toast.error(`Error de conexión: ${error.message}`);
    },
  });
}

// Update WhatsApp credentials
export function useUpdateWhatsAppCredentials() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: {
      whatsapp_phone_id?: string;
      whatsapp_business_id?: string;
      whatsapp_access_token?: string;
    }) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('user_settings')
        .update(credentials)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Credenciales de WhatsApp actualizadas');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

// Update notification preferences
export function useUpdateNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: {
      notifications_enabled?: boolean;
      notify_new_payments?: boolean;
      notify_promises?: boolean;
      notify_errors?: boolean;
    }) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('user_settings')
        .update(preferences)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Preferencias de notificación actualizadas');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

// Update AI processing settings
export function useUpdateAISettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (aiSettings: {
      auto_process?: boolean;
      min_confidence_threshold?: number;
      low_confidence_alert?: boolean;
    }) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('user_settings')
        .update(aiSettings)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Configuración de IA actualizada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}
