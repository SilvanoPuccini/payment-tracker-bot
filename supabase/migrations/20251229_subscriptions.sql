-- =============================================
-- SISTEMA DE SUSCRIPCIONES Y PLANES
-- =============================================

-- Tabla de suscripciones
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Plan
    plan_id TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),

    -- Billing
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,

    -- Stripe
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Tabla de uso mensual
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    payments_count INTEGER DEFAULT 0,
    contacts_count INTEGER DEFAULT 0,
    whatsapp_messages_count INTEGER DEFAULT 0,
    storage_used_bytes BIGINT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, period_start)
);

-- Indices
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_usage_tracking_user ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage" ON usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert/update subscriptions (for webhooks)
CREATE POLICY "System can manage subscriptions" ON subscriptions
    FOR ALL USING (true);

CREATE POLICY "System can manage usage" ON usage_tracking
    FOR ALL USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
    BEFORE UPDATE ON usage_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para crear suscripción free al registrarse
CREATE OR REPLACE FUNCTION create_free_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO usage_tracking (user_id, period_start, period_end)
    VALUES (
        NEW.id,
        date_trunc('month', NOW())::date,
        (date_trunc('month', NOW()) + interval '1 month' - interval '1 day')::date
    )
    ON CONFLICT (user_id, period_start) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created_subscription
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_free_subscription();

-- Función para verificar límites
CREATE OR REPLACE FUNCTION check_plan_limit(
    p_user_id UUID,
    p_resource TEXT,
    p_increment INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    v_plan_id TEXT;
    v_limit INTEGER;
    v_current_usage INTEGER;
BEGIN
    -- Obtener plan del usuario
    SELECT plan_id INTO v_plan_id FROM subscriptions WHERE user_id = p_user_id;

    -- Si no tiene suscripción, asumir free
    IF v_plan_id IS NULL THEN
        v_plan_id := 'free';
    END IF;

    -- Obtener límite según recurso y plan
    CASE v_plan_id
        WHEN 'free' THEN
            CASE p_resource
                WHEN 'payments' THEN v_limit := 50;
                WHEN 'contacts' THEN v_limit := 20;
                WHEN 'whatsapp' THEN v_limit := 100;
                ELSE v_limit := 100;
            END CASE;
        WHEN 'pro' THEN
            CASE p_resource
                WHEN 'payments' THEN v_limit := 500;
                WHEN 'contacts' THEN v_limit := 200;
                WHEN 'whatsapp' THEN v_limit := 1000;
                ELSE v_limit := 1000;
            END CASE;
        WHEN 'business' THEN
            v_limit := -1; -- unlimited
        ELSE
            v_limit := 50; -- fallback to free limits
    END CASE;

    -- Si es ilimitado, siempre permitir
    IF v_limit = -1 THEN
        RETURN TRUE;
    END IF;

    -- Obtener uso actual
    SELECT
        CASE p_resource
            WHEN 'payments' THEN payments_count
            WHEN 'contacts' THEN contacts_count
            WHEN 'whatsapp' THEN whatsapp_messages_count
            ELSE 0
        END
    INTO v_current_usage
    FROM usage_tracking
    WHERE user_id = p_user_id
    AND period_start = date_trunc('month', NOW())::date;

    RETURN (COALESCE(v_current_usage, 0) + p_increment) <= v_limit;
END;
$$ LANGUAGE plpgsql;

-- Función para incrementar uso
CREATE OR REPLACE FUNCTION increment_usage(
    p_user_id UUID,
    p_resource TEXT,
    p_increment INTEGER DEFAULT 1
) RETURNS VOID AS $$
BEGIN
    -- Asegurar que existe el registro de uso para este mes
    INSERT INTO usage_tracking (user_id, period_start, period_end)
    VALUES (
        p_user_id,
        date_trunc('month', NOW())::date,
        (date_trunc('month', NOW()) + interval '1 month' - interval '1 day')::date
    )
    ON CONFLICT (user_id, period_start) DO NOTHING;

    -- Incrementar el contador apropiado
    UPDATE usage_tracking
    SET
        payments_count = CASE WHEN p_resource = 'payments' THEN payments_count + p_increment ELSE payments_count END,
        contacts_count = CASE WHEN p_resource = 'contacts' THEN contacts_count + p_increment ELSE contacts_count END,
        whatsapp_messages_count = CASE WHEN p_resource = 'whatsapp' THEN whatsapp_messages_count + p_increment ELSE whatsapp_messages_count END,
        updated_at = NOW()
    WHERE user_id = p_user_id
    AND period_start = date_trunc('month', NOW())::date;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener uso actual
CREATE OR REPLACE FUNCTION get_current_usage(p_user_id UUID)
RETURNS TABLE (
    payments_count INTEGER,
    contacts_count INTEGER,
    whatsapp_messages_count INTEGER,
    storage_used_bytes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ut.payments_count,
        ut.contacts_count,
        ut.whatsapp_messages_count,
        ut.storage_used_bytes
    FROM usage_tracking ut
    WHERE ut.user_id = p_user_id
    AND ut.period_start = date_trunc('month', NOW())::date;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CAMPO IS_ADMIN PARA PROFILES
-- =============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
