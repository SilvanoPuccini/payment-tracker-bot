import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Fallback values from the connected Lovable Cloud project
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://fmrdoenxkpugjrcastkd.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtcmRvZW54a3B1Z2pyY2FzdGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNTQ1NzgsImV4cCI6MjA4MTgzMDU3OH0.PmIfyJMK8P_I0RGPHRLzNE40C_CVACpDbzhkPtcYX84";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
