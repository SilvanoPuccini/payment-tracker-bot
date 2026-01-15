import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type Message = Tables<'messages'>;
type MessageInsert = TablesInsert<'messages'>;
type Contact = Tables<'contacts'>;

export interface Conversation {
  id: string;
  contact: Contact;
  lastMessage: Message | null;
  unreadCount: number;
  hasPaymentPending: boolean;
}

// Fetch all conversations (grouped by contact)
export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      // Get all contacts with their latest message
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (contactsError) throw contactsError;

      // For each contact, get the last message and unread count
      const conversations: Conversation[] = [];

      for (const contact of contacts || []) {
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (msgError) continue;

        if (messages && messages.length > 0) {
          // Count payment-related pending messages
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('contact_id', contact.id)
            .eq('is_payment_related', true)
            .eq('requires_review', true);

          conversations.push({
            id: contact.id,
            contact,
            lastMessage: messages[0] as Message,
            unreadCount: 0, // TODO: Implement read tracking
            hasPaymentPending: (count || 0) > 0,
          });
        }
      }

      return conversations;
    },
    enabled: !!user,
  });
}

// Fetch messages for a specific contact
export function useContactMessages(contactId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['messages', contactId],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user && !!contactId,
  });
}

// Send a message
export function useSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: Omit<MessageInsert, 'user_id'>) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          ...message,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update contact's last_message_at
      if (message.contact_id) {
        await supabase
          .from('contacts')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', message.contact_id);
      }

      return data as Message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.contact_id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast.error(`Error al enviar mensaje: ${error.message}`);
    },
  });
}

// Get recent messages with payments
export function useRecentPaymentMessages() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recent-payment-messages', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          contact:contacts(id, name, phone)
        `)
        .eq('user_id', user.id)
        .eq('is_payment_related', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Get messages requiring review
export function useMessagesRequiringReview() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['messages-review', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          contact:contacts(id, name, phone)
        `)
        .eq('user_id', user.id)
        .eq('requires_review', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Mark message as reviewed
export function useMarkMessageReviewed() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('messages')
        .update({
          requires_review: false,
          processed_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.contact_id] });
      queryClient.invalidateQueries({ queryKey: ['messages-review'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Get message stats
export function useMessageStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['message-stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('messages')
        .select('is_payment_related, requires_review, detected_amount')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (error) throw error;

      const stats = {
        totalToday: data?.length || 0,
        paymentsDetected: 0,
        requiresReview: 0,
        totalDetectedAmount: 0,
      };

      data?.forEach((m) => {
        if (m.is_payment_related) stats.paymentsDetected++;
        if (m.requires_review) stats.requiresReview++;
        if (m.detected_amount) stats.totalDetectedAmount += Number(m.detected_amount);
      });

      return stats;
    },
    enabled: !!user,
  });
}

// Get system performance metrics for AI detection
export function useSystemMetrics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['system-metrics', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      // Get messages with AI analysis (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, confidence_score, is_payment_related, status, processed_at, created_at')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (messagesError) throw messagesError;

      // Get payments with AI detection (have message_id)
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('id, confidence_score, message_id, confirmed_at, confirmed_by, created_at, status')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (paymentsError) throw paymentsError;

      // Calculate metrics
      const aiDetectedPayments = payments?.filter(p => p.message_id) || [];
      const paymentRelatedMessages = messages?.filter(m => m.is_payment_related) || [];
      const processedMessages = messages?.filter(m => m.processed_at || m.status === 'processed') || [];

      // 1. Detection Precision (average confidence score)
      let detectionPrecision = 0;
      const scoresFromPayments = aiDetectedPayments
        .filter(p => p.confidence_score !== null)
        .map(p => p.confidence_score as number);
      const scoresFromMessages = paymentRelatedMessages
        .filter(m => m.confidence_score !== null)
        .map(m => m.confidence_score as number);

      const allScores = [...scoresFromPayments, ...scoresFromMessages];
      if (allScores.length > 0) {
        detectionPrecision = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      }

      // 2. Messages Processed Rate
      let messagesProcessedRate = 0;
      if (messages && messages.length > 0) {
        messagesProcessedRate = (processedMessages.length / messages.length) * 100;
      }

      // 3. Response Time (% within target - payments confirmed within 1 hour)
      let responseTimeRate = 0;
      const confirmedPayments = payments?.filter(p => p.confirmed_at && p.created_at) || [];
      if (confirmedPayments.length > 0) {
        const withinTarget = confirmedPayments.filter(p => {
          const created = new Date(p.created_at).getTime();
          const confirmed = new Date(p.confirmed_at!).getTime();
          const diffHours = (confirmed - created) / (1000 * 60 * 60);
          return diffHours <= 1; // Within 1 hour target
        });
        responseTimeRate = (withinTarget.length / confirmedPayments.length) * 100;
      }

      // 4. Auto Confirmations Rate
      let autoConfirmationsRate = 0;
      const totalConfirmed = payments?.filter(p => p.status === 'confirmed') || [];
      if (totalConfirmed.length > 0) {
        // Auto confirmed = confirmed_by is 'auto' OR high confidence (>= 80)
        const autoConfirmed = totalConfirmed.filter(p =>
          p.confirmed_by === 'auto' ||
          (p.confidence_score !== null && p.confidence_score >= 80)
        );
        autoConfirmationsRate = (autoConfirmed.length / totalConfirmed.length) * 100;
      }

      // Check if AI system is active (has recent WhatsApp messages)
      const recentMessages = messages?.filter(m => {
        const created = new Date(m.created_at);
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return created > oneDayAgo;
      }) || [];
      const isSystemActive = recentMessages.length > 0 || aiDetectedPayments.length > 0;

      return {
        detectionPrecision: Math.round(detectionPrecision * 10) / 10,
        messagesProcessedRate: Math.round(messagesProcessedRate * 10) / 10,
        responseTimeRate: Math.round(responseTimeRate * 10) / 10,
        autoConfirmationsRate: Math.round(autoConfirmationsRate * 10) / 10,
        isSystemActive,
        totalMessages: messages?.length || 0,
        totalAiPayments: aiDetectedPayments.length,
      };
    },
    enabled: !!user,
  });
}
