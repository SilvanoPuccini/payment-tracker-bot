import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentStatus } from '@/types/database';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Payment = Tables<'payments'>;
type PaymentInsert = TablesInsert<'payments'>;
type PaymentUpdate = TablesUpdate<'payments'>;

export interface PaymentWithContact extends Payment {
  contact?: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
  } | null;
  message?: {
    id: string;
    content: string | null;
    media_url: string | null;
    media_mime_type: string | null;
    created_at: string;
    confidence_score: number | null;
  } | null;
}

// Fetch all payments for current user
export function usePayments(filters?: {
  status?: PaymentStatus;
  contactId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payments', user?.id, filters],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      let query = supabase
        .from('payments')
        .select(`
          *,
          contact:contacts(id, name, phone, email),
          message:messages(id, content, media_url, media_mime_type, created_at, confidence_score)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.contactId) {
        query = query.eq('contact_id', filters.contactId);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PaymentWithContact[];
    },
    enabled: !!user,
  });
}

// Fetch a single payment
export function usePayment(paymentId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          contact:contacts(id, name, phone, email),
          message:messages(id, content, media_url, media_mime_type, created_at, confidence_score)
        `)
        .eq('id', paymentId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as PaymentWithContact;
    },
    enabled: !!user && !!paymentId,
  });
}

// Create a new payment
export function useCreatePayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: Omit<PaymentInsert, 'user_id'>) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('payments')
        .insert({
          ...payment,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Pago registrado correctamente');
    },
    onError: (error) => {
      toast.error(`Error al registrar pago: ${error.message}`);
    },
  });
}

// Update a payment
export function useUpdatePayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: PaymentUpdate & { id: string }) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Payment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Pago actualizado correctamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar pago: ${error.message}`);
    },
  });
}

// Confirm a payment
export function useConfirmPayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'confirmed' as PaymentStatus,
          confirmed_by: user.id,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Pago confirmado');
    },
    onError: (error) => {
      toast.error(`Error al confirmar pago: ${error.message}`);
    },
  });
}

// Reject a payment
export function useRejectPayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'rejected' as PaymentStatus,
        })
        .eq('id', paymentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Pago rechazado');
    },
    onError: (error) => {
      toast.error(`Error al rechazar pago: ${error.message}`);
    },
  });
}

// Delete a payment
export function useDeletePayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Pago eliminado');
    },
    onError: (error) => {
      toast.error(`Error al eliminar pago: ${error.message}`);
    },
  });
}

// Get payment stats for dashboard
export function usePaymentStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payment-stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      // Get current month stats
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, status, confidence_score')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (error) throw error;

      const stats = {
        totalAmount: 0,
        confirmedAmount: 0,
        pendingAmount: 0,
        confirmedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        avgConfidence: 0,
      };

      if (payments && payments.length > 0) {
        let totalConfidence = 0;
        payments.forEach((p) => {
          stats.totalAmount += Number(p.amount);
          if (p.status === 'confirmed') {
            stats.confirmedAmount += Number(p.amount);
            stats.confirmedCount++;
          } else if (p.status === 'pending') {
            stats.pendingAmount += Number(p.amount);
            stats.pendingCount++;
          } else if (p.status === 'rejected') {
            stats.rejectedCount++;
          }
          totalConfidence += p.confidence_score || 0;
        });
        stats.avgConfidence = totalConfidence / payments.length;
      }

      return stats;
    },
    enabled: !!user,
  });
}
