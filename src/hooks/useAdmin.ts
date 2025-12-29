import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPayments: number;
  totalRevenue: number;
  mrr: number;
  planDistribution: {
    free: number;
    pro: number;
    business: number;
  };
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  plan_id: string;
  status: string;
  created_at: string;
  last_sign_in_at: string | null;
  payments_count: number;
  is_admin: boolean;
}

interface RegistrationStats {
  date: string;
  count: number;
}

// Subscription relation type from Supabase query
interface SubscriptionRelation {
  plan_id: string;
  status: string;
}

interface ProfileWithSubscription {
  id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
  is_admin: boolean | null;
  subscriptions: SubscriptionRelation[] | null;
}

export function useIsAdmin() {
  const { profile } = useAuth();
  return profile?.is_admin === true;
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

      // Get plan distribution
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("plan_id");

      const planDistribution = {
        free: 0,
        pro: 0,
        business: 0,
      };

      subscriptions?.forEach((sub) => {
        if (sub.plan_id === "free") planDistribution.free++;
        else if (sub.plan_id === "pro") planDistribution.pro++;
        else if (sub.plan_id === "business") planDistribution.business++;
      });

      // Calculate MRR
      const mrr = planDistribution.pro * 9.99 + planDistribution.business * 29.99;
      const totalRevenue = mrr * 12; // Estimated annual

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalPayments: totalPayments || 0,
        totalRevenue,
        mrr,
        planDistribution,
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

      // Get users with subscription info
      const { data: profiles, error, count } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          created_at,
          updated_at,
          is_admin,
          subscriptions (
            plan_id,
            status
          )
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Get payment counts for each user
      const userIds = profiles?.map((p) => p.id) || [];
      const { data: paymentCounts } = await supabase
        .from("payments")
        .select("user_id")
        .in("user_id", userIds);

      const paymentCountMap: Record<string, number> = {};
      paymentCounts?.forEach((p) => {
        paymentCountMap[p.user_id] = (paymentCountMap[p.user_id] || 0) + 1;
      });

      // Get auth users for email (this requires service role, so we'll use a workaround)
      // For now, we'll just show the profile data
      const typedProfiles = profiles as ProfileWithSubscription[] | null;
      const users: AdminUser[] = (typedProfiles || []).map((p) => ({
        id: p.id,
        email: `user-${p.id.slice(0, 8)}@paytrack.app`, // Placeholder
        full_name: p.full_name,
        plan_id: p.subscriptions?.[0]?.plan_id || "free",
        status: p.subscriptions?.[0]?.status || "active",
        created_at: p.created_at,
        last_sign_in_at: p.updated_at,
        payments_count: paymentCountMap[p.id] || 0,
        is_admin: p.is_admin || false,
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

export function useUpdateUserPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, planId }: { userId: string; planId: string }) => {
      const { error } = await supabase
        .from("subscriptions")
        .update({ plan_id: planId })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Plan actualizado correctamente");
    },
    onError: () => {
      toast.error("Error al actualizar el plan");
    },
  });
}

export function useToggleAdminStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: isAdmin })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Estado de admin actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar estado de admin");
    },
  });
}
