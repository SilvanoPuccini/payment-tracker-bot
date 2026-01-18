-- Migration: Create ai_support_logs table for auditing AI support requests
-- Date: 2026-01-18

-- Habilitar extensión para gen_random_uuid si no existe
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear tabla de logs del asistente IA
CREATE TABLE IF NOT EXISTS public.ai_support_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  request jsonb NOT NULL,
  response jsonb,
  status text NOT NULL,
  error text
);

-- Crear índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_ai_support_logs_user_id ON public.ai_support_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_support_logs_created_at ON public.ai_support_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_support_logs_status ON public.ai_support_logs(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.ai_support_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios autenticados solo pueden insertar sus propios logs
CREATE POLICY "insert_own_logs" ON public.ai_support_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Los usuarios autenticados solo pueden ver sus propios logs
CREATE POLICY "select_own_logs" ON public.ai_support_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Policy: service_role puede hacer todo (usado por Edge Functions)
-- Nota: service_role bypasea RLS por defecto, pero lo hacemos explícito
CREATE POLICY "service_role_all" ON public.ai_support_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Comentarios de documentación
COMMENT ON TABLE public.ai_support_logs IS 'Logs de auditoría para solicitudes al asistente IA de soporte';
COMMENT ON COLUMN public.ai_support_logs.user_id IS 'ID del usuario que hizo la solicitud';
COMMENT ON COLUMN public.ai_support_logs.user_email IS 'Email del usuario (para referencia rápida)';
COMMENT ON COLUMN public.ai_support_logs.request IS 'Datos de la solicitud (problema y contexto)';
COMMENT ON COLUMN public.ai_support_logs.response IS 'Respuesta del asistente IA';
COMMENT ON COLUMN public.ai_support_logs.status IS 'Estado: success, gemini_error, empty_response, error';
COMMENT ON COLUMN public.ai_support_logs.error IS 'Mensaje de error si hubo algún problema';
