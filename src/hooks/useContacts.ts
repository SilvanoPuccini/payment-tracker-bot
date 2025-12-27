import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ContactStatus } from '@/types/database';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Contact = Tables<'contacts'>;
type ContactInsert = TablesInsert<'contacts'>;
type ContactUpdate = TablesUpdate<'contacts'>;
import { toast } from 'sonner';

// Fetch all contacts for current user
export function useContacts(filters?: {
  status?: ContactStatus;
  starred?: boolean;
  search?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contacts', user?.id, filters],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      let query = supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.starred) {
        query = query.eq('is_starred', true);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!user,
  });
}

// Fetch a single contact with payments
export function useContact(contactId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          payments:payments(*)
        `)
        .eq('id', contactId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!contactId,
  });
}

// Create a new contact
export function useCreateContact() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: Omit<ContactInsert, 'user_id'>) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...contact,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Contacto creado correctamente');
    },
    onError: (error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Ya existe un contacto con este número de teléfono');
      } else {
        toast.error(`Error al crear contacto: ${error.message}`);
      }
    },
  });
}

// Update a contact
export function useUpdateContact() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ContactUpdate & { id: string }) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Contact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', data.id] });
      toast.success('Contacto actualizado correctamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar contacto: ${error.message}`);
    },
  });
}

// Toggle starred status
export function useToggleContactStar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isStarred }: { id: string; isStarred: boolean }) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('contacts')
        .update({ is_starred: isStarred })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Contact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', data.id] });
      toast.success(data.is_starred ? 'Añadido a favoritos' : 'Removido de favoritos');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

// Delete a contact
export function useDeleteContact() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: string) => {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Contacto eliminado');
    },
    onError: (error) => {
      toast.error(`Error al eliminar contacto: ${error.message}`);
    },
  });
}

// Get contact stats
export function useContactStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contact-stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('status, total_paid, pending_amount')
        .eq('user_id', user.id);

      if (error) throw error;

      const stats = {
        total: contacts?.length || 0,
        active: 0,
        inactive: 0,
        totalPaid: 0,
        totalPending: 0,
      };

      contacts?.forEach((c) => {
        if (c.status === 'active') stats.active++;
        if (c.status === 'inactive') stats.inactive++;
        stats.totalPaid += Number(c.total_paid) || 0;
        stats.totalPending += Number(c.pending_amount) || 0;
      });

      return stats;
    },
    enabled: !!user,
  });
}

// Find or create contact by phone
export function useFindOrCreateContact() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { phone: string; name?: string }) => {
      if (!user) throw new Error('No user logged in');

      // First try to find existing contact
      const { data: existing } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .eq('phone', data.phone)
        .single();

      if (existing) {
        return existing as Contact;
      }

      // Create new contact
      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          phone: data.phone,
          name: data.name || data.phone,
        })
        .select()
        .single();

      if (error) throw error;
      return newContact as Contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
