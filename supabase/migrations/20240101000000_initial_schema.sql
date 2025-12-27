-- =============================================
-- PAYMENT TRACKER BOT - DATABASE SCHEMA
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled');
CREATE TYPE payment_method AS ENUM ('transfer_bcp', 'transfer_bbva', 'transfer_interbank', 'transfer_scotiabank', 'yape', 'plin', 'deposit', 'cash', 'other');
CREATE TYPE contact_status AS ENUM ('active', 'inactive', 'blocked');
CREATE TYPE message_sender AS ENUM ('contact', 'user', 'system');
CREATE TYPE payment_intent AS ENUM ('pago', 'promesa', 'consulta', 'otro');
CREATE TYPE promise_status AS ENUM ('pending', 'fulfilled', 'overdue', 'cancelled');

-- =============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- =============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    company_name TEXT,
    timezone TEXT DEFAULT 'America/Lima',
    currency TEXT DEFAULT 'PEN',
    language TEXT DEFAULT 'es',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USER SETTINGS TABLE
-- =============================================

CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    webhook_url TEXT,
    verify_token TEXT DEFAULT 'paytrack_verify_2024',
    whatsapp_phone_id TEXT,
    whatsapp_business_id TEXT,
    whatsapp_access_token TEXT,
    auto_process BOOLEAN DEFAULT true,
    min_confidence_threshold INTEGER DEFAULT 70,
    low_confidence_alert BOOLEAN DEFAULT true,
    notifications_enabled BOOLEAN DEFAULT true,
    notify_new_payments BOOLEAN DEFAULT true,
    notify_promises BOOLEAN DEFAULT true,
    notify_errors BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =============================================
-- CONTACTS TABLE
-- =============================================

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    location TEXT,
    company TEXT,
    notes TEXT,
    status contact_status DEFAULT 'active',
    is_starred BOOLEAN DEFAULT false,
    total_paid DECIMAL(12,2) DEFAULT 0,
    pending_amount DECIMAL(12,2) DEFAULT 0,
    payment_count INTEGER DEFAULT 0,
    reliability_score INTEGER DEFAULT 100,
    last_payment_at TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, phone)
);

-- =============================================
-- MESSAGES TABLE
-- =============================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    whatsapp_message_id TEXT,
    sender message_sender NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT,
    is_payment_related BOOLEAN DEFAULT false,
    payment_intent payment_intent,
    detected_amount DECIMAL(12,2),
    detected_currency TEXT,
    confidence_score INTEGER,
    requires_review BOOLEAN DEFAULT false,
    ai_analysis JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- =============================================
-- PAYMENTS TABLE
-- =============================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'PEN',
    status payment_status DEFAULT 'pending',
    method payment_method,
    method_detail TEXT,
    reference_number TEXT,
    bank_name TEXT,
    account_number TEXT,
    payment_date DATE,
    payment_time TIME,
    confidence_score INTEGER DEFAULT 100,
    requires_review BOOLEAN DEFAULT false,
    notes TEXT,
    confirmed_by UUID REFERENCES profiles(id),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PAYMENT PROMISES TABLE
-- =============================================

CREATE TABLE payment_promises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    promised_amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'PEN',
    promised_date DATE,
    status promise_status DEFAULT 'pending',
    fulfilled_payment_id UUID REFERENCES payments(id),
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- WEBHOOK LOGS TABLE
-- =============================================

CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    payload JSONB,
    status TEXT DEFAULT 'received',
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ACTIVITY LOGS TABLE
-- =============================================

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Contacts indexes
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_starred ON contacts(user_id, is_starred) WHERE is_starred = true;

-- Messages indexes
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_contact_id ON messages(contact_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_payment_related ON messages(user_id, is_payment_related) WHERE is_payment_related = true;

-- Payments indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_contact_id ON payments(contact_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);

-- Payment promises indexes
CREATE INDEX idx_promises_user_id ON payment_promises(user_id);
CREATE INDEX idx_promises_contact_id ON payment_promises(contact_id);
CREATE INDEX idx_promises_status ON payment_promises(status);
CREATE INDEX idx_promises_date ON payment_promises(promised_date);

-- Webhook logs indexes
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_user_id ON webhook_logs(user_id);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Contacts policies
CREATE POLICY "Users can view own contacts" ON contacts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts" ON contacts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts" ON contacts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts" ON contacts
    FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages" ON messages
    FOR UPDATE USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments" ON payments
    FOR DELETE USING (auth.uid() = user_id);

-- Payment promises policies
CREATE POLICY "Users can view own promises" ON payment_promises
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own promises" ON payment_promises
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own promises" ON payment_promises
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own promises" ON payment_promises
    FOR DELETE USING (auth.uid() = user_id);

-- Webhook logs policies (user can only view their own)
CREATE POLICY "Users can view own webhook logs" ON webhook_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert webhook logs" ON webhook_logs
    FOR INSERT WITH CHECK (true);

-- Activity logs policies
CREATE POLICY "Users can view own activity" ON activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity" ON activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promises_updated_at
    BEFORE UPDATE ON payment_promises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );

    INSERT INTO user_settings (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update contact stats after payment changes
CREATE OR REPLACE FUNCTION update_contact_payment_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_contact_id UUID;
    v_total_paid DECIMAL(12,2);
    v_pending_amount DECIMAL(12,2);
    v_payment_count INTEGER;
    v_last_payment TIMESTAMPTZ;
BEGIN
    -- Determine which contact to update
    IF TG_OP = 'DELETE' THEN
        v_contact_id := OLD.contact_id;
    ELSE
        v_contact_id := NEW.contact_id;
    END IF;

    -- Skip if no contact associated
    IF v_contact_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Calculate aggregates
    SELECT
        COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0),
        COUNT(*) FILTER (WHERE status = 'confirmed'),
        MAX(CASE WHEN status = 'confirmed' THEN created_at END)
    INTO v_total_paid, v_pending_amount, v_payment_count, v_last_payment
    FROM payments
    WHERE contact_id = v_contact_id;

    -- Update contact
    UPDATE contacts
    SET
        total_paid = v_total_paid,
        pending_amount = v_pending_amount,
        payment_count = v_payment_count,
        last_payment_at = v_last_payment
    WHERE id = v_contact_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update contact stats
CREATE TRIGGER update_contact_stats_on_payment
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_contact_payment_stats();

-- Function to calculate reliability score
CREATE OR REPLACE FUNCTION calculate_reliability_score(p_contact_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_total_payments INTEGER;
    v_confirmed_payments INTEGER;
    v_fulfilled_promises INTEGER;
    v_total_promises INTEGER;
    v_score INTEGER;
BEGIN
    -- Get payment stats
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'confirmed')
    INTO v_total_payments, v_confirmed_payments
    FROM payments
    WHERE contact_id = p_contact_id;

    -- Get promise stats
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'fulfilled')
    INTO v_total_promises, v_fulfilled_promises
    FROM payment_promises
    WHERE contact_id = p_contact_id;

    -- Calculate score (weighted average)
    IF v_total_payments + v_total_promises = 0 THEN
        RETURN 100; -- New contact, assume good
    END IF;

    v_score := (
        (COALESCE(v_confirmed_payments, 0) * 100 / NULLIF(v_total_payments, 0)) * 0.6 +
        (COALESCE(v_fulfilled_promises, 0) * 100 / NULLIF(v_total_promises, 0)) * 0.4
    )::INTEGER;

    RETURN COALESCE(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEWS FOR DASHBOARD STATS
-- =============================================

-- Daily stats view
CREATE OR REPLACE VIEW daily_stats AS
SELECT
    user_id,
    DATE(created_at) as date,
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_payments,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_payments,
    SUM(amount) FILTER (WHERE status = 'confirmed') as confirmed_amount,
    SUM(amount) FILTER (WHERE status = 'pending') as pending_amount,
    AVG(confidence_score) as avg_confidence
FROM payments
GROUP BY user_id, DATE(created_at);

-- Monthly stats view
CREATE OR REPLACE VIEW monthly_stats AS
SELECT
    user_id,
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_payments,
    SUM(amount) FILTER (WHERE status = 'confirmed') as confirmed_amount,
    SUM(amount) as total_amount,
    COUNT(DISTINCT contact_id) as unique_contacts
FROM payments
GROUP BY user_id, DATE_TRUNC('month', created_at);

-- =============================================
-- SAMPLE DATA FOR TESTING (optional, run manually)
-- =============================================

-- This section is commented out - run manually if needed for testing
/*
-- Insert test contacts
INSERT INTO contacts (user_id, name, phone, email, location, status, is_starred)
VALUES
    ('YOUR_USER_ID', 'Juan Pérez', '+51999888777', 'juan@email.com', 'Lima, Perú', 'active', true),
    ('YOUR_USER_ID', 'María García', '+51998777666', 'maria@email.com', 'Arequipa, Perú', 'active', false);
*/
