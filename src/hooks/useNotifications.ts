import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  icon: string | null;
  data: Record<string, any> | null;
  action_url: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

// Fetch notifications
export function useNotifications(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
  });
}

// Fetch unread count
export function useUnreadNotificationCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  // Initial fetch
  const { data } = useQuery({
    queryKey: ['notifications', 'unread-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (data !== undefined) {
      setCount(data);
    }
  }, [data]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refetch count on any change
          supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false)
            .then(({ count }) => {
              setCount(count || 0);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return count;
}

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Mark all notifications as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas las notificaciones marcadas como leidas');
    },
  });
}

// Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Create notification (usually called from backend, but useful for testing)
export function useCreateNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notification: {
      type: string;
      title: string;
      message?: string;
      icon?: string;
      data?: Record<string, any>;
      action_url?: string;
    }) => {
      if (!user?.id) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          ...notification,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Realtime notifications hook - shows toasts for new notifications
export function useRealtimeNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as Notification;

          // Show toast notification
          const icon = notification.icon || getDefaultIcon(notification.type);

          toast(notification.title, {
            description: notification.message || undefined,
            icon: icon,
            action: notification.action_url
              ? {
                  label: 'Ver',
                  onClick: () => {
                    window.location.href = notification.action_url!;
                  },
                }
              : undefined,
          });

          // Invalidate queries to update UI
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const payment = payload.new as any;
          toast.success('Nuevo pago detectado', {
            description: `Monto: ${payment.currency} ${payment.amount}`,
            action: {
              label: 'Ver',
              onClick: () => {
                window.location.href = `/payments?id=${payment.id}`;
              },
            },
          });
          queryClient.invalidateQueries({ queryKey: ['payments'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const payment = payload.new as any;
          const oldPayment = payload.old as any;

          // Check if status changed to confirmed
          if (oldPayment.status !== 'confirmed' && payment.status === 'confirmed') {
            toast.success('Pago confirmado', {
              description: `${payment.currency} ${payment.amount} confirmado`,
            });
          }
          queryClient.invalidateQueries({ queryKey: ['payments'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}

function getDefaultIcon(type: string): string {
  switch (type) {
    case 'payment_received':
    case 'payment':
      return '💰';
    case 'payment_confirmed':
      return '✅';
    case 'reminder':
    case 'reminder_sent':
      return '⏰';
    case 'promise':
    case 'promise_created':
      return '📅';
    case 'promise_overdue':
      return '⚠️';
    case 'message':
      return '💬';
    case 'alert':
      return '🔔';
    case 'system':
      return '⚙️';
    default:
      return '📢';
  }
}
