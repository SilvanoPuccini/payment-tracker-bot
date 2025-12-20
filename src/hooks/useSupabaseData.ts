/**
 * Supabase Data Hooks
 * React Query hooks for fetching and mutating data from Supabase
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// ============================================
// Types
// ============================================

type Message = Tables<"messages">;
type Payment = Tables<"payments">;
type Contact = Tables<"contacts">;
type Debt = Tables<"debts">;
type PaymentPromise = Tables<"payment_promises">;

interface MessageWithContact extends Message {
  contacts: Contact;
}

interface PaymentWithContact extends Payment {
  contacts: Contact;
}

interface DashboardStats {
  totalPaymentsAmount: number;
  confirmedPaymentsCount: number;
  pendingPaymentsCount: number;
  detectionRate: number;
  messagesThisMonth: number;
  paymentsThisMonth: number;
}

// ============================================
// Messages Hooks
// ============================================

export function useMessages(options?: {
  status?: string;
  intent?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["messages", options],
    queryFn: async () => {
      let query = supabase
        .from("messages")
        .select("*, contacts(*)")
        .order("wa_timestamp", { ascending: false });

      if (options?.status) {
        query = query.eq("status", options.status);
      }
      if (options?.intent) {
        query = query.eq("intent", options.intent);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MessageWithContact[];
    },
  });
}

export function useMessage(id: string) {
  return useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, contacts(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as MessageWithContact;
    },
    enabled: !!id,
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<"messages"> }) => {
      const { data, error } = await supabase
        .from("messages")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

// ============================================
// Payments Hooks
// ============================================

export function usePayments(options?: {
  status?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["payments", options],
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select("*, contacts(*)")
        .order("payment_date", { ascending: false });

      if (options?.status) {
        query = query.eq("status", options.status);
      }
      if (options?.startDate) {
        query = query.gte("payment_date", options.startDate);
      }
      if (options?.endDate) {
        query = query.lte("payment_date", options.endDate);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PaymentWithContact[];
    },
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ["payments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, contacts(*), messages(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: TablesInsert<"payments">) => {
      const { data, error } = await supabase
        .from("payments")
        .insert(payment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<"payments"> }) => {
      const { data, error } = await supabase
        .from("payments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useConfirmPayment() {
  const updatePayment = useUpdatePayment();

  return useMutation({
    mutationFn: async (id: string) => {
      return updatePayment.mutateAsync({
        id,
        updates: {
          status: "confirmed",
          reviewed_at: new Date().toISOString(),
        },
      });
    },
  });
}

export function useRejectPayment() {
  const updatePayment = useUpdatePayment();

  return useMutation({
    mutationFn: async (id: string) => {
      return updatePayment.mutateAsync({
        id,
        updates: {
          status: "rejected",
          reviewed_at: new Date().toISOString(),
        },
      });
    },
  });
}

// ============================================
// Contacts Hooks
// ============================================

export function useContacts(options?: { limit?: number; search?: string }) {
  return useQuery({
    queryKey: ["contacts", options],
    queryFn: async () => {
      let query = supabase
        .from("contacts")
        .select("*")
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (options?.search) {
        query = query.or(`name.ilike.%${options.search}%,phone.ilike.%${options.search}%`);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Contact[];
    },
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ["contacts", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Contact;
    },
    enabled: !!id,
  });
}

export function useContactMessages(contactId: string) {
  return useQuery({
    queryKey: ["contacts", contactId, "messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("contact_id", contactId)
        .order("wa_timestamp", { ascending: false });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!contactId,
  });
}

export function useContactPayments(contactId: string) {
  return useQuery({
    queryKey: ["contacts", contactId, "payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("contact_id", contactId)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!contactId,
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<"contacts"> }) => {
      const { data, error } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

// ============================================
// Debts Hooks
// ============================================

export function useDebts(options?: { contactId?: string; status?: string }) {
  return useQuery({
    queryKey: ["debts", options],
    queryFn: async () => {
      let query = supabase
        .from("debts")
        .select("*, contacts(*)")
        .order("due_date", { ascending: true });

      if (options?.contactId) {
        query = query.eq("contact_id", options.contactId);
      }
      if (options?.status) {
        query = query.eq("status", options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (debt: TablesInsert<"debts">) => {
      const { data, error } = await supabase
        .from("debts")
        .insert(debt)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

// ============================================
// Payment Promises Hooks
// ============================================

export function usePaymentPromises(options?: { status?: string }) {
  return useQuery({
    queryKey: ["payment-promises", options],
    queryFn: async () => {
      let query = supabase
        .from("payment_promises")
        .select("*, contacts(*)")
        .order("promised_date", { ascending: true });

      if (options?.status) {
        query = query.eq("status", options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// ============================================
// Dashboard Stats Hook
// ============================================

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

      // Get payments this month
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("amount, status, currency")
        .gte("payment_date", startOfMonth)
        .lte("payment_date", endOfMonth);

      if (paymentsError) throw paymentsError;

      // Get messages this month
      const { count: messagesCount, error: messagesError } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .gte("wa_timestamp", `${startOfMonth}T00:00:00`)
        .lte("wa_timestamp", `${endOfMonth}T23:59:59`);

      if (messagesError) throw messagesError;

      // Get processed messages (for detection rate)
      const { count: processedCount, error: processedError } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("status", "processed")
        .gte("wa_timestamp", `${startOfMonth}T00:00:00`);

      if (processedError) throw processedError;

      // Calculate stats
      const totalPaymentsAmount = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const confirmedPayments = payments?.filter(p => p.status === "confirmed") || [];
      const pendingPayments = payments?.filter(p => p.status === "detected") || [];
      const detectionRate = messagesCount && processedCount
        ? Math.round((processedCount / messagesCount) * 100 * 10) / 10
        : 0;

      return {
        totalPaymentsAmount,
        confirmedPaymentsCount: confirmedPayments.length,
        pendingPaymentsCount: pendingPayments.length,
        detectionRate,
        messagesThisMonth: messagesCount || 0,
        paymentsThisMonth: payments?.length || 0,
      } as DashboardStats;
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}

// ============================================
// Activity Chart Data Hook
// ============================================

export function useActivityData(days: number = 7) {
  return useQuery({
    queryKey: ["activity-data", days],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get messages by day
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("wa_timestamp")
        .gte("wa_timestamp", startDate.toISOString())
        .lte("wa_timestamp", endDate.toISOString());

      if (messagesError) throw messagesError;

      // Get payments by day
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("payment_date, amount")
        .gte("payment_date", startDate.toISOString().split("T")[0])
        .lte("payment_date", endDate.toISOString().split("T")[0]);

      if (paymentsError) throw paymentsError;

      // Group by day
      const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      const activityData = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dayName = dayNames[date.getDay()];

        const dayMessages = messages?.filter(m =>
          m.wa_timestamp.startsWith(dateStr)
        ).length || 0;

        const dayPayments = payments?.filter(p =>
          p.payment_date === dateStr
        ) || [];

        activityData.push({
          day: dayName,
          date: dateStr,
          mensajes: dayMessages,
          pagos: dayPayments.length,
          monto: dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        });
      }

      return activityData;
    },
    staleTime: 60000, // Cache for 1 minute
  });
}

// ============================================
// Recent Transactions Hook
// ============================================

export function useRecentTransactions(limit: number = 5) {
  return useQuery({
    queryKey: ["recent-transactions", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, contacts(*)")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as PaymentWithContact[];
    },
  });
}

// ============================================
// Pending Payments Hook (Promises)
// ============================================

export function usePendingPromises(limit: number = 5) {
  return useQuery({
    queryKey: ["pending-promises", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_promises")
        .select("*, contacts(*)")
        .eq("status", "pending")
        .order("promised_date", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}
