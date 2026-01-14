import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface RealtimePayload {
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Use refs to avoid re-creating subscriptions when callbacks change
  const navigateRef = useRef(navigate);
  const queryClientRef = useRef(queryClient);

  // Update refs when values change
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up realtime notifications for user:', user.id);

    const showPaymentNotification = (payment: Record<string, unknown>) => {
      const amount = payment.amount as number;
      const currency = (payment.currency as string) || 'PEN';
      const status = payment.status as string;

      if (status === 'confirmed') {
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-medium">Pago confirmado</span>
            <span className="text-sm">{currency} {amount?.toFixed(2)}</span>
          </div>,
          {
            action: {
              label: 'Ver',
              onClick: () => navigateRef.current('/payments'),
            },
            duration: 5000,
          }
        );
      } else if (status === 'pending') {
        toast.info(
          <div className="flex flex-col gap-1">
            <span className="font-medium">Nuevo pago detectado</span>
            <span className="text-sm">{currency} {amount?.toFixed(2)}</span>
          </div>,
          {
            action: {
              label: 'Ver',
              onClick: () => navigateRef.current('/payments'),
            },
            duration: 5000,
          }
        );
      }
    };

    const showNotification = (notification: Record<string, unknown>) => {
      const type = notification.type as string;
      const title = notification.title as string;
      const message = notification.message as string;

      const getIcon = () => {
        switch (type) {
          case 'payment_received':
          case 'payment_confirmed':
            return '💰';
          case 'reminder_sent':
            return '🔔';
          case 'reminder_failed':
            return '⚠️';
          case 'promise_due':
          case 'promise_overdue':
            return '📅';
          case 'message_received':
            return '💬';
          default:
            return '📌';
        }
      };

      toast(
        <div className="flex items-start gap-2">
          <span className="text-lg">{getIcon()}</span>
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{title}</span>
            {message && <span className="text-sm text-muted-foreground">{message}</span>}
          </div>
        </div>,
        {
          duration: 5000,
        }
      );
    };

    const showMessageNotification = (message: Record<string, unknown>) => {
      const content = message.content as string;
      const isPaymentRelated = message.is_payment_related as boolean;

      toast(
        <div className="flex items-start gap-2">
          <span className="text-lg">{isPaymentRelated ? '💰' : '💬'}</span>
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">Nuevo mensaje</span>
            <span className="text-sm text-muted-foreground line-clamp-2">{content}</span>
          </div>
        </div>,
        {
          action: {
            label: 'Ver',
            onClick: () => navigateRef.current('/messages'),
          },
          duration: 5000,
        }
      );
    };

    // Subscribe to payments changes
    const paymentsChannel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePayload) => {
          console.log('New payment:', payload);
          showPaymentNotification(payload.new);
          queryClientRef.current.invalidateQueries({ queryKey: ['payments'] });
          queryClientRef.current.invalidateQueries({ queryKey: ['dashboard-stats'] });
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
        (payload: RealtimePayload) => {
          const oldStatus = payload.old?.status;
          const newStatus = payload.new?.status;

          // Only notify if status changed to confirmed
          if (oldStatus !== 'confirmed' && newStatus === 'confirmed') {
            showPaymentNotification(payload.new);
          }

          queryClientRef.current.invalidateQueries({ queryKey: ['payments'] });
          queryClientRef.current.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .subscribe();

    // Subscribe to notifications
    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePayload) => {
          console.log('New notification:', payload);
          showNotification(payload.new);
          queryClientRef.current.invalidateQueries({ queryKey: ['notifications'] });
          queryClientRef.current.invalidateQueries({ queryKey: ['unread-notifications-count'] });
        }
      )
      .subscribe();

    // Subscribe to messages
    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePayload) => {
          // Only notify for incoming messages (not sent by user)
          if (payload.new?.sender !== 'user') {
            console.log('New message:', payload);
            showMessageNotification(payload.new);
            queryClientRef.current.invalidateQueries({ queryKey: ['messages'] });
          }
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user?.id]); // Only depend on user.id
}
