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

export function useUpdateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<"debts"> }) => {
      const { data, error } = await supabase
        .from("debts")
        .update(updates)
        .eq("id", id)
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

export function useMarkDebtPaid() {
  const updateDebt = useUpdateDebt();

  return useMutation({
    mutationFn: async (id: string) => {
      return updateDebt.mutateAsync({
        id,
        updates: {
          status: "paid",
          paid_at: new Date().toISOString(),
        },
      });
    },
  });
}

// ============================================
// Payment Promises Hooks
// ============================================

export function usePaymentPromises(options?: { status?: string; contactId?: string }) {
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
      if (options?.contactId) {
        query = query.eq("contact_id", options.contactId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePaymentPromise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promise: TablesInsert<"payment_promises">) => {
      const { data, error } = await supabase
        .from("payment_promises")
        .insert(promise)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-promises"] });
      queryClient.invalidateQueries({ queryKey: ["pending-promises"] });
    },
  });
}

export function useUpdatePaymentPromise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<"payment_promises"> }) => {
      const { data, error } = await supabase
        .from("payment_promises")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-promises"] });
      queryClient.invalidateQueries({ queryKey: ["pending-promises"] });
    },
  });
}

export function useMarkPromiseFulfilled() {
  const updatePromise = useUpdatePaymentPromise();

  return useMutation({
    mutationFn: async (id: string) => {
      return updatePromise.mutateAsync({
        id,
        updates: {
          status: "fulfilled",
          fulfilled_at: new Date().toISOString(),
        },
      });
    },
  });
}

export function useMarkPromiseExpired() {
  const updatePromise = useUpdatePaymentPromise();

  return useMutation({
    mutationFn: async (id: string) => {
      return updatePromise.mutateAsync({
        id,
        updates: {
          status: "expired",
        },
      });
    },
  });
}

// ============================================
// Dashboard Stats Hook
// ============================================

export interface DashboardFiltersParam {
  startDate?: string;
  endDate?: string;
  status?: string;
  minAmount?: number | null;
}

export function useDashboardStats(filters?: DashboardFiltersParam) {
  return useQuery({
    queryKey: ["dashboard-stats", filters],
    queryFn: async () => {
      const now = new Date();
      const startDate = filters?.startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const endDate = filters?.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

      // Get payments in date range
      let paymentsQuery = supabase
        .from("payments")
        .select("amount, status, currency")
        .gte("payment_date", startDate)
        .lte("payment_date", endDate);

      // Apply status filter
      if (filters?.status && filters.status !== "all") {
        paymentsQuery = paymentsQuery.eq("status", filters.status);
      }

      // Apply min amount filter
      if (filters?.minAmount && filters.minAmount > 0) {
        paymentsQuery = paymentsQuery.gte("amount", filters.minAmount);
      }

      const { data: payments, error: paymentsError } = await paymentsQuery;

      if (paymentsError) throw paymentsError;

      // Get messages in date range
      const { count: messagesCount, error: messagesError } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .gte("wa_timestamp", `${startDate}T00:00:00`)
        .lte("wa_timestamp", `${endDate}T23:59:59`);

      if (messagesError) throw messagesError;

      // Get processed messages (for detection rate)
      const { count: processedCount, error: processedError } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("status", "processed")
        .gte("wa_timestamp", `${startDate}T00:00:00`);

      if (processedError) throw processedError;

      // Calculate stats - when filtering by specific status, show all amounts
      const allPayments = payments || [];
      const totalPaymentsAmount = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const confirmedPayments = allPayments.filter(p => p.status === "confirmed");
      const pendingPayments = allPayments.filter(p => p.status === "detected");
      const detectionRate = messagesCount && processedCount
        ? Math.round((processedCount / messagesCount) * 100 * 10) / 10
        : 0;

      return {
        totalPaymentsAmount,
        confirmedPaymentsCount: confirmedPayments.length,
        pendingPaymentsCount: pendingPayments.length,
        detectionRate,
        messagesThisMonth: messagesCount || 0,
        paymentsThisMonth: allPayments.length,
      } as DashboardStats;
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}

// ============================================
// Activity Chart Data Hook
// ============================================

export function useActivityData(filters?: DashboardFiltersParam) {
  return useQuery({
    queryKey: ["activity-data", filters],
    queryFn: async () => {
      // Calculate date range from filters or default to 7 days
      let startDate: Date;
      let endDate: Date;

      if (filters?.startDate && filters?.endDate) {
        startDate = new Date(filters.startDate);
        endDate = new Date(filters.endDate);
      } else {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      }

      // Calculate number of days to show
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Get messages by day
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("wa_timestamp")
        .gte("wa_timestamp", startDate.toISOString())
        .lte("wa_timestamp", endDate.toISOString());

      if (messagesError) throw messagesError;

      // Get payments by day with filters
      let paymentsQuery = supabase
        .from("payments")
        .select("payment_date, amount, status")
        .gte("payment_date", startDate.toISOString().split("T")[0])
        .lte("payment_date", endDate.toISOString().split("T")[0]);

      if (filters?.status && filters.status !== "all") {
        paymentsQuery = paymentsQuery.eq("status", filters.status);
      }
      if (filters?.minAmount && filters.minAmount > 0) {
        paymentsQuery = paymentsQuery.gte("amount", filters.minAmount);
      }

      const { data: payments, error: paymentsError } = await paymentsQuery;

      if (paymentsError) throw paymentsError;

      // Group by day
      const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      const activityData = [];

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
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

export function useRecentTransactions(limit: number = 5, filters?: DashboardFiltersParam) {
  return useQuery({
    queryKey: ["recent-transactions", limit, filters],
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select("*, contacts(*)")
        .order("created_at", { ascending: false });

      // Apply date filters
      if (filters?.startDate) {
        query = query.gte("payment_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("payment_date", filters.endDate);
      }

      // Apply status filter
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      // Apply min amount filter
      if (filters?.minAmount && filters.minAmount > 0) {
        query = query.gte("amount", filters.minAmount);
      }

      query = query.limit(limit);

      const { data, error } = await query;

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
