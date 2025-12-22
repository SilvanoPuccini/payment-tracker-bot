/**
 * Health Check Endpoint
 *
 * Provides system health status for monitoring and debugging.
 * Returns:
 * - Database connectivity
 * - AI API availability
 * - Webhook configuration status
 * - System metrics
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: CheckResult;
    gemini_api: CheckResult;
    webhook_config: CheckResult;
  };
  metrics: {
    uptime: number;
    memory_used_mb: number;
  };
}

interface CheckResult {
  status: 'ok' | 'warning' | 'error';
  message: string;
  latency_ms?: number;
}

const startTime = Date.now();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    checks: {
      database: { status: 'ok', message: 'Not checked' },
      gemini_api: { status: 'ok', message: 'Not checked' },
      webhook_config: { status: 'ok', message: 'Not checked' },
    },
    metrics: {
      uptime: Math.floor((Date.now() - startTime) / 1000),
      memory_used_mb: 0,
    },
  };

  try {
    // Check database connectivity
    const dbStart = Date.now();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { error } = await supabase.from('users').select('id').limit(1);

      health.checks.database = {
        status: error ? 'error' : 'ok',
        message: error ? error.message : 'Connected',
        latency_ms: Date.now() - dbStart,
      };
    } else {
      health.checks.database = {
        status: 'warning',
        message: 'Service role key not configured',
      };
    }

    // Check Gemini API availability
    const geminiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (geminiKey) {
      health.checks.gemini_api = {
        status: 'ok',
        message: 'Gemini API key configured (primary)',
      };
    } else if (lovableKey) {
      health.checks.gemini_api = {
        status: 'ok',
        message: 'Lovable AI Gateway configured (fallback)',
      };
    } else if (openaiKey) {
      health.checks.gemini_api = {
        status: 'warning',
        message: 'Only OpenAI configured (not free)',
      };
    } else {
      health.checks.gemini_api = {
        status: 'error',
        message: 'No AI API key configured',
      };
      health.status = 'degraded';
    }

    // Check webhook configuration
    const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN');
    const appSecret = Deno.env.get('WHATSAPP_APP_SECRET');

    if (verifyToken && appSecret) {
      health.checks.webhook_config = {
        status: 'ok',
        message: 'Webhook fully configured with signature verification',
      };
    } else if (verifyToken) {
      health.checks.webhook_config = {
        status: 'warning',
        message: 'Webhook configured but signature verification disabled',
      };
    } else {
      health.checks.webhook_config = {
        status: 'warning',
        message: 'Using default verify token',
      };
    }

    // Get memory usage (Deno specific)
    try {
      // @ts-ignore - Deno.memoryUsage may not be typed
      const memory = Deno.memoryUsage?.();
      if (memory) {
        health.metrics.memory_used_mb = Math.round(memory.heapUsed / 1024 / 1024);
      }
    } catch {
      // Memory usage not available
    }

    // Determine overall status
    const hasErrors = Object.values(health.checks).some((c) => c.status === 'error');
    const hasWarnings = Object.values(health.checks).some((c) => c.status === 'warning');

    if (hasErrors) {
      health.status = 'unhealthy';
    } else if (hasWarnings) {
      health.status = 'degraded';
    }

    return new Response(JSON.stringify(health, null, 2), {
      status: health.status === 'unhealthy' ? 503 : 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
