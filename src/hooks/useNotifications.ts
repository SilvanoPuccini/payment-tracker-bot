import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Payment = Tables<'payments'>;

// Types - Note: notifications table doesn't exist yet, so we use local state
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  icon: string | null;
  data: Record<string, string | number | boolean | null> | null;
  action_url: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

// Local notifications state (until notifications table is created)
const localNotifications: Notification[] = [];

// Fetch notifications - returns empty array since table doesn't exist
export function useNotifications(limit = 20) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user?.id) {
      setNotifications(localNotifications.filter(n => n.user_id === user.id).slice(0, limit));
    }
  }, [user?.id, limit]);

  return {
    data: notifications,
    isLoading: false,
    error: null,
  };
}

// Fetch unread count
export function useUnreadNotificationCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      const unread = localNotifications.filter(n => n.user_id === user.id && !n.read).length;
      setCount(unread);
    }
  }, [user?.id]);

  return { data: count };
}

// Mark notification as read
export function useMarkNotificationRead() {
  return {
    mutateAsync: async (notificationId: string) => {
      const notification = localNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        notification.read_at = new Date().toISOString();
      }
    },
    isPending: false,
  };
}

// Mark all notifications as read
export function useMarkAllNotificationsRead() {
  const { user } = useAuth();

  return {
    mutateAsync: async () => {
      if (!user?.id) return;
      localNotifications.forEach(n => {
        if (n.user_id === user.id) {
          n.read = true;
          n.read_at = new Date().toISOString();
        }
      });
      toast.success('Todas las notificaciones marcadas como leidas');
    },
    isPending: false,
  };
}

// Delete notification
export function useDeleteNotification() {
  return {
    mutateAsync: async (notificationId: string) => {
      const index = localNotifications.findIndex(n => n.id === notificationId);
      if (index > -1) {
        localNotifications.splice(index, 1);
      }
    },
    isPending: false,
  };
}

// Realtime notifications hook - shows toasts for new payments
export function useRealtimeNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('realtime-payments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const payment = payload.new as Payment;
          toast.success('Nuevo pago detectado', {
            description: `Monto: ${payment.currency} ${payment.amount}`,
            action: {
              label: 'Ver',
              onClick: () => {
                window.location.href = `/payments?id=${payment.id}`;
              },
            },
          });
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
          const payment = payload.new as Payment;
          const oldPayment = payload.old as Partial<Payment>;

          // Check if status changed to confirmed
          if (oldPayment.status !== 'confirmed' && payment.status === 'confirmed') {
            toast.success('Pago confirmado', {
              description: `${payment.currency} ${payment.amount} confirmado`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}
