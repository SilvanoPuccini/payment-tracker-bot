import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
