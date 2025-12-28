import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types for AI analysis
export interface PaymentAnalysis {
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

export interface AnalyzeMessageResult {
  success: boolean;
  analysis: PaymentAnalysis;
  timestamp: string;
}

// Hook to analyze a message with AI
export function useAnalyzeMessage() {
  return useMutation({
    mutationFn: async (params: {
      message: string;
      contactName?: string;
      contactPhone?: string;
      imageBase64?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('process-message', {
        body: params,
      });

      if (error) throw error;
      return data as AnalyzeMessageResult;
    },
    onError: (error) => {
      toast.error(`Error al analizar mensaje: ${error.message}`);
    },
  });
}

// Hook to send a WhatsApp message
export function useSendWhatsAppMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      to: string;
      message: string;
      contactId?: string;
    }) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          ...params,
          userId: user.id,
        },
      });

      if (error) throw error;
      return data as { success: boolean; messageId: string; to: string };
    },
    onSuccess: (data, variables) => {
      if (variables.contactId) {
        queryClient.invalidateQueries({ queryKey: ['messages', variables.contactId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
      toast.success('Mensaje enviado por WhatsApp');
    },
    onError: (error) => {
      toast.error(`Error al enviar WhatsApp: ${error.message}`);
    },
  });
}

// Hook to test WhatsApp connection
export function useTestWhatsAppConnection() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user logged in');

      // Get user's WhatsApp settings
      const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('whatsapp_phone_id, whatsapp_access_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsError) throw new Error('No se encontró configuración de WhatsApp');

      if (!settings?.whatsapp_phone_id || !settings?.whatsapp_access_token) {
        throw new Error('Falta configurar el ID del teléfono o el token de acceso');
      }

      // Test the connection by calling the WhatsApp API
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${settings.whatsapp_phone_id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${settings.whatsapp_access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error de conexión con WhatsApp');
      }

      const data = await response.json();
      return {
        success: true,
        phoneNumber: data.display_phone_number,
        verifiedName: data.verified_name,
        qualityRating: data.quality_rating,
      };
    },
    onSuccess: (data) => {
      toast.success(`Conexión exitosa: ${data.verifiedName || data.phoneNumber}`);
    },
    onError: (error) => {
      toast.error(`Error de conexión: ${error.message}`);
    },
  });
}

// Hook to manually process a message with AI
export function useProcessMessageWithAI() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      if (!user) throw new Error('No user logged in');

      // Get the message
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .select('*, contact:contacts(name, phone)')
        .eq('id', messageId)
        .eq('user_id', user.id)
        .single();

      if (msgError) throw msgError;
      if (!message) throw new Error('Mensaje no encontrado');

      // Analyze with AI
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('process-message', {
        body: {
          message: message.content,
          contactName: message.contact?.name,
          contactPhone: message.contact?.phone,
        },
      });

      if (analysisError) throw analysisError;

      const analysis = analysisResult.analysis;

      // Update the message with analysis results
      const { error: updateError } = await supabase
        .from('messages')
        .update({
          is_payment_related: analysis.intent === 'pago' || analysis.intent === 'promesa',
          payment_intent: analysis.intent,
          detected_amount: analysis.extractedData?.amount || null,
          detected_currency: analysis.extractedData?.currency || null,
          confidence_score: Math.round(analysis.confidence * 100),
          requires_review: analysis.requiresReview,
          ai_analysis: analysis,
          processed_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (updateError) throw updateError;

      // Create payment if detected
      if (analysis.intent === 'pago' && analysis.extractedData?.amount) {
        await supabase.from('payments').insert({
          user_id: user.id,
          contact_id: message.contact_id,
          message_id: messageId,
          amount: analysis.extractedData.amount,
          currency: analysis.extractedData.currency || 'PEN',
          status: 'pending',
          method_detail: analysis.extractedData.paymentMethod || null,
          reference_number: analysis.extractedData.reference || null,
          payment_date: analysis.extractedData.date || null,
          confidence_score: Math.round(analysis.confidence * 100),
          notes: analysis.summary,
        });
      }

      return { message, analysis };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success(`Mensaje analizado: ${data.analysis.summary}`);
    },
    onError: (error) => {
      toast.error(`Error al procesar mensaje: ${error.message}`);
    },
  });
}
