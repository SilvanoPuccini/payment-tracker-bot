import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPayments: number;
  totalRevenue: number;
}

interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  status: string;
  created_at: string;
  last_sign_in_at: string | null;
  payments_count: number;
}

interface RegistrationStats {
  date: string;
  count: number;
}

// Simple admin check - for now always returns false since is_admin column doesn't exist
export function useIsAdmin() {
  return false;
}

export function useAdminStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<AdminStats> => {
      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get active users (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("updated_at", thirtyDaysAgo.toISOString());

      // Get total payments
      const { count: totalPayments } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true });

      // Get total revenue from confirmed payments
      const { data: confirmedPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "confirmed");

      const totalRevenue = confirmedPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalPayments: totalPayments || 0,
        totalRevenue,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAdminUsers(page = 1, limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-users", page, limit],
    queryFn: async (): Promise<{ users: AdminUser[]; total: number }> => {
      const offset = (page - 1) * limit;

      // Get users
      const { data: profiles, error, count } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Get payment counts for each user
      const userIds = profiles?.map((p) => p.user_id) || [];
      const { data: paymentCounts } = await supabase
        .from("payments")
        .select("user_id")
        .in("user_id", userIds);

      const paymentCountMap: Record<string, number> = {};
      paymentCounts?.forEach((p) => {
        paymentCountMap[p.user_id] = (paymentCountMap[p.user_id] || 0) + 1;
      });

      const users: AdminUser[] = (profiles || []).map((p) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        status: "active",
        created_at: p.created_at,
        last_sign_in_at: p.updated_at,
        payments_count: paymentCountMap[p.user_id] || 0,
      }));

      return {
        users,
        total: count || 0,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useRegistrationStats(days = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-registration-stats", days],
    queryFn: async (): Promise<RegistrationStats[]> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      // Group by date
      const stats: Record<string, number> = {};
      profiles?.forEach((p) => {
        const date = p.created_at.split("T")[0];
        stats[date] = (stats[date] || 0) + 1;
      });

      // Fill in missing dates
      const result: RegistrationStats[] = [];
      const current = new Date(startDate);
      const today = new Date();

      while (current <= today) {
        const dateStr = current.toISOString().split("T")[0];
        result.push({
          date: dateStr,
          count: stats[dateStr] || 0,
        });
        current.setDate(current.getDate() + 1);
      }

      return result;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
