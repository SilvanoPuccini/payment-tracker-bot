import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentWithContact } from '@/integrations/supabase/types';

export interface DashboardStats {
  // Payment stats
  totalPaymentsThisMonth: number;
  confirmedPayments: number;
  pendingPayments: number;
  detectionRate: number;

  // Amount stats
  totalAmountThisMonth: number;
  confirmedAmount: number;
  pendingAmount: number;

  // Trends (comparison with last month)
  paymentsTrend: number;
  confirmedTrend: number;
  pendingTrend: number;
  detectionTrend: number;
}

export interface WeeklyActivity {
  day: string;
  payments: number;
  messages: number;
}

// Get comprehensive dashboard stats
export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      // Get current month dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Current month payments
      const { data: currentPayments, error: currentError } = await supabase
        .from('payments')
        .select('amount, status, confidence_score')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (currentError) throw currentError;

      // Last month payments for trends
      const { data: lastPayments, error: lastError } = await supabase
        .from('payments')
        .select('amount, status, confidence_score')
        .eq('user_id', user.id)
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString());

      if (lastError) throw lastError;

      // Calculate current month stats
      let totalAmount = 0;
      let confirmedAmount = 0;
      let pendingAmount = 0;
      let confirmedCount = 0;
      let pendingCount = 0;
      let totalConfidence = 0;

      currentPayments?.forEach((p) => {
        totalAmount += Number(p.amount);
        totalConfidence += p.confidence_score || 0;
        if (p.status === 'confirmed') {
          confirmedAmount += Number(p.amount);
          confirmedCount++;
        } else if (p.status === 'pending') {
          pendingAmount += Number(p.amount);
          pendingCount++;
        }
      });

      const currentTotal = currentPayments?.length || 0;
      const avgConfidence = currentTotal > 0 ? totalConfidence / currentTotal : 0;

      // Calculate last month stats for trends
      let lastConfirmedCount = 0;
      let lastPendingCount = 0;
      let lastTotalConfidence = 0;

      lastPayments?.forEach((p) => {
        lastTotalConfidence += p.confidence_score || 0;
        if (p.status === 'confirmed') lastConfirmedCount++;
        else if (p.status === 'pending') lastPendingCount++;
      });

      const lastTotal = lastPayments?.length || 0;
      const lastAvgConfidence = lastTotal > 0 ? lastTotalConfidence / lastTotal : 0;

      // Calculate trends (percentage change)
      const calculateTrend = (current: number, last: number) => {
        if (last === 0) return current > 0 ? 100 : 0;
        return ((current - last) / last) * 100;
      };

      const stats: DashboardStats = {
        totalPaymentsThisMonth: currentTotal,
        confirmedPayments: confirmedCount,
        pendingPayments: pendingCount,
        detectionRate: avgConfidence,
        totalAmountThisMonth: totalAmount,
        confirmedAmount,
        pendingAmount,
        paymentsTrend: calculateTrend(currentTotal, lastTotal),
        confirmedTrend: calculateTrend(confirmedCount, lastConfirmedCount),
        pendingTrend: calculateTrend(pendingCount, lastPendingCount),
        detectionTrend: calculateTrend(avgConfidence, lastAvgConfidence),
      };

      return stats;
    },
    enabled: !!user,
  });
}

// Get weekly activity data for chart
export function useWeeklyActivity() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weekly-activity', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const activity: WeeklyActivity[] = [];

      // Get last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        // Count payments for this day
        const { count: paymentsCount } = await supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());

        // Count messages for this day
        const { count: messagesCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());

        activity.push({
          day: days[date.getDay()],
          payments: paymentsCount || 0,
          messages: messagesCount || 0,
        });
      }

      return activity;
    },
    enabled: !!user,
  });
}

// Get recent transactions for dashboard
export function useRecentTransactions(limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recent-transactions', user?.id, limit],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          contact:contacts(id, name, phone)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as PaymentWithContact[];
    },
    enabled: !!user,
  });
}

// Get pending payments requiring attention
export function usePendingPayments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pending-payments', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          contact:contacts(id, name, phone)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as PaymentWithContact[];
    },
    enabled: !!user,
  });
}

// Get monthly stats for reports
export function useMonthlyStats(months = 12) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['monthly-stats', user?.id, months],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const stats: Array<{
        month: string;
        payments: number;
        confirmed: number;
        messages: number;
      }> = [];

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        // Get payments for this month
        const { data: payments } = await supabase
          .from('payments')
          .select('amount, status')
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString());

        // Get messages count
        const { count: messagesCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString());

        let totalAmount = 0;
        let confirmedAmount = 0;

        payments?.forEach((p) => {
          totalAmount += Number(p.amount);
          if (p.status === 'confirmed') {
            confirmedAmount += Number(p.amount);
          }
        });

        stats.push({
          month: monthNames[date.getMonth()],
          payments: totalAmount,
          confirmed: confirmedAmount,
          messages: messagesCount || 0,
        });
      }

      return stats;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
}

// Get top contacts by payment volume
export function useTopContacts(limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['top-contacts', user?.id, limit],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, phone, total_paid, payment_count, reliability_score')
        .eq('user_id', user.id)
        .order('total_paid', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
