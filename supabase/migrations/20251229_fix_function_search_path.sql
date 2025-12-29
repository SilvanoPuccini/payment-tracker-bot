-- Fix function search_path for security
-- This migration updates functions to have immutable search_path

-- Fix create_free_subscription function
CREATE OR REPLACE FUNCTION create_free_subscription()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
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

-- Fix create_reminder_settings function
CREATE OR REPLACE FUNCTION create_reminder_settings()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO reminder_settings (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix increment_usage function
CREATE OR REPLACE FUNCTION increment_usage(
    p_user_id UUID,
    p_resource TEXT,
    p_increment INTEGER DEFAULT 1
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Ensure usage tracking record exists for this month
    INSERT INTO usage_tracking (user_id, period_start, period_end)
    VALUES (
        p_user_id,
        date_trunc('month', NOW())::date,
        (date_trunc('month', NOW()) + interval '1 month' - interval '1 day')::date
    )
    ON CONFLICT (user_id, period_start) DO NOTHING;

    -- Increment the appropriate counter
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
