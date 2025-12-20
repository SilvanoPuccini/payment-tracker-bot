-- ============================================
-- PayTrack MVP - Initial Database Schema
-- WhatsApp Business Payment Detection System
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

-- Message types from WhatsApp
CREATE TYPE message_type AS ENUM ('text', 'image', 'audio', 'document', 'video', 'sticker', 'location');

-- Message direction
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');

-- Intent classification from AI
CREATE TYPE message_intent AS ENUM ('pago', 'promesa', 'consulta', 'otro');

-- Message processing status
CREATE TYPE message_status AS ENUM ('pending', 'processing', 'processed', 'review', 'error');

-- Payment status
CREATE TYPE payment_status AS ENUM ('detected', 'confirmed', 'rejected', 'duplicate');

-- Payment source (how it was detected)
CREATE TYPE payment_source AS ENUM ('ai_detected', 'ocr', 'manual');

-- Debt status
CREATE TYPE debt_status AS ENUM ('pending', 'partial', 'paid', 'overdue', 'cancelled');

-- Attachment type
CREATE TYPE attachment_type AS ENUM ('image', 'audio', 'document', 'video');

-- ============================================
-- TABLES
-- ============================================

-- Users table (business accounts)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    business_name TEXT NOT NULL,
    -- WhatsApp Business API credentials
    wa_phone_number_id TEXT,
    wa_business_account_id TEXT,
    wa_access_token TEXT, -- Should be encrypted in production
    wa_webhook_verify_token TEXT DEFAULT 'paytrack_verify_' || substr(md5(random()::text), 1, 8),
    -- Settings stored as JSON
    settings JSONB DEFAULT '{
        "timezone": "America/Lima",
        "currency": "PEN",
        "language": "es",
        "auto_process": true,
        "confidence_threshold": 0.7,
        "notifications": {
            "new_payment": true,
            "payment_promise": true,
            "low_confidence": true,
            "system_errors": true
        }
    }'::jsonb,
    -- Stats cache (updated periodically)
    stats_cache JSONB DEFAULT '{}'::jsonb,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table (customers/clients of the business)
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- WhatsApp identifiers
    wa_id TEXT NOT NULL, -- WhatsApp ID (phone without +)
    phone TEXT NOT NULL, -- Normalized phone number
    -- Profile info
    name TEXT,
    profile_picture_url TEXT,
    email TEXT,
    notes TEXT,
    -- Calculated fields (updated by triggers)
    total_debt DECIMAL(15, 2) DEFAULT 0,
    total_paid DECIMAL(15, 2) DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Constraints
    UNIQUE(user_id, wa_id)
);

-- Messages table (all WhatsApp messages)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    -- WhatsApp message identifiers
    wa_message_id TEXT UNIQUE NOT NULL,
    -- Message content
    type message_type NOT NULL DEFAULT 'text',
    content TEXT, -- Text content or caption
    media_id TEXT, -- WhatsApp media ID for download
    media_url TEXT, -- URL after download
    direction message_direction NOT NULL DEFAULT 'inbound',
    -- Timestamps from WhatsApp
    wa_timestamp TIMESTAMPTZ NOT NULL,
    -- AI Analysis results
    analysis JSONB, -- Full AI response
    intent message_intent,
    confidence DECIMAL(3, 2), -- 0.00 to 1.00
    extracted_data JSONB, -- Structured extracted data
    -- Processing
    status message_status DEFAULT 'pending',
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table (detected and confirmed payments)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    debt_id UUID, -- Will add FK after debts table
    -- Payment details
    amount DECIMAL(15, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'PEN',
    payment_date DATE NOT NULL,
    payment_method TEXT, -- yape, plin, transferencia, efectivo, etc.
    reference TEXT, -- Operation number
    -- Detection metadata
    status payment_status DEFAULT 'detected',
    confidence DECIMAL(3, 2),
    source payment_source DEFAULT 'ai_detected',
    -- Review info
    notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debts table (customer debts/invoices)
CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    -- Debt details
    amount DECIMAL(15, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'PEN',
    due_date DATE,
    description TEXT,
    reference TEXT, -- Invoice number or reference
    -- Status and payments
    status debt_status DEFAULT 'pending',
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key from payments to debts
ALTER TABLE payments ADD CONSTRAINT payments_debt_id_fkey
    FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE SET NULL;

-- Attachments table (media files)
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    -- File info
    type attachment_type NOT NULL,
    mime_type TEXT,
    file_name TEXT,
    file_size INTEGER, -- bytes
    -- Storage
    storage_path TEXT, -- Path in Supabase Storage
    url TEXT, -- Public URL
    -- OCR Results (for images)
    ocr_result JSONB,
    ocr_confidence DECIMAL(3, 2),
    ocr_extracted_data JSONB,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table (audit log)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Event info
    event_type TEXT NOT NULL, -- message.received, payment.detected, etc.
    entity_type TEXT, -- message, payment, contact, debt
    entity_id UUID,
    -- Event data
    data JSONB,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment promises table (tracking future payment commitments)
CREATE TABLE payment_promises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    debt_id UUID REFERENCES debts(id) ON DELETE SET NULL,
    -- Promise details
    amount DECIMAL(15, 2),
    currency TEXT DEFAULT 'PEN',
    promised_date DATE NOT NULL,
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'broken', 'cancelled')),
    fulfilled_payment_id UUID REFERENCES payments(id),
    -- Notes
    notes TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wa_phone_number_id ON users(wa_phone_number_id);

-- Contacts
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_wa_id ON contacts(wa_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_name ON contacts(name);

-- Messages
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_contact_id ON messages(contact_id);
CREATE INDEX idx_messages_wa_message_id ON messages(wa_message_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_intent ON messages(intent);
CREATE INDEX idx_messages_wa_timestamp ON messages(wa_timestamp DESC);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Payments
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_contact_id ON payments(contact_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_date ON payments(payment_date DESC);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Debts
CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_debts_contact_id ON debts(contact_id);
CREATE INDEX idx_debts_status ON debts(status);
CREATE INDEX idx_debts_due_date ON debts(due_date);

-- Attachments
CREATE INDEX idx_attachments_message_id ON attachments(message_id);

-- Events
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_entity_type_id ON events(entity_type, entity_id);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

-- Payment Promises
CREATE INDEX idx_payment_promises_user_id ON payment_promises(user_id);
CREATE INDEX idx_payment_promises_contact_id ON payment_promises(contact_id);
CREATE INDEX idx_payment_promises_promised_date ON payment_promises(promised_date);
CREATE INDEX idx_payment_promises_status ON payment_promises(status);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update contact stats after message insert
CREATE OR REPLACE FUNCTION update_contact_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE contacts SET
        last_message_at = NEW.wa_timestamp,
        message_count = message_count + 1,
        updated_at = NOW()
    WHERE id = NEW.contact_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update contact debt after payment changes
CREATE OR REPLACE FUNCTION update_contact_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_contact_id UUID;
    v_total_paid DECIMAL(15, 2);
    v_total_debt DECIMAL(15, 2);
BEGIN
    -- Get the contact_id from the appropriate record
    IF TG_OP = 'DELETE' THEN
        v_contact_id := OLD.contact_id;
    ELSE
        v_contact_id := NEW.contact_id;
    END IF;

    -- Calculate total paid
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM payments
    WHERE contact_id = v_contact_id AND status = 'confirmed';

    -- Calculate total debt
    SELECT COALESCE(SUM(amount - paid_amount), 0) INTO v_total_debt
    FROM debts
    WHERE contact_id = v_contact_id AND status IN ('pending', 'partial', 'overdue');

    -- Update contact
    UPDATE contacts SET
        total_paid = v_total_paid,
        total_debt = v_total_debt,
        updated_at = NOW()
    WHERE id = v_contact_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update debt status after payment
CREATE OR REPLACE FUNCTION update_debt_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.debt_id IS NOT NULL AND NEW.status = 'confirmed' THEN
        UPDATE debts SET
            paid_amount = paid_amount + NEW.amount,
            status = CASE
                WHEN paid_amount + NEW.amount >= amount THEN 'paid'::debt_status
                ELSE 'partial'::debt_status
            END,
            updated_at = NOW()
        WHERE id = NEW.debt_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log events
CREATE OR REPLACE FUNCTION log_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO events (user_id, event_type, entity_type, entity_id, data)
    VALUES (p_user_id, p_event_type, p_entity_type, p_entity_id, p_data)
    RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debts_updated_at
    BEFORE UPDATE ON debts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_promises_updated_at
    BEFORE UPDATE ON payment_promises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Contact stats trigger on message insert
CREATE TRIGGER update_contact_on_message_insert
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_on_message();

-- Contact totals trigger on payment changes
CREATE TRIGGER update_contact_on_payment_change
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_totals();

CREATE TRIGGER update_contact_on_debt_change
    AFTER INSERT OR UPDATE OR DELETE ON debts
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_totals();

-- Debt update on payment confirmation
CREATE TRIGGER update_debt_on_payment_insert
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_debt_on_payment();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_promises ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Contacts policies
CREATE POLICY "Users can view own contacts" ON contacts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own contacts" ON contacts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own contacts" ON contacts
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own contacts" ON contacts
    FOR DELETE USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own messages" ON messages
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own messages" ON messages
    FOR UPDATE USING (user_id = auth.uid());

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payments" ON payments
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own payments" ON payments
    FOR DELETE USING (user_id = auth.uid());

-- Debts policies
CREATE POLICY "Users can view own debts" ON debts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own debts" ON debts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own debts" ON debts
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own debts" ON debts
    FOR DELETE USING (user_id = auth.uid());

-- Attachments policies (through message ownership)
CREATE POLICY "Users can view own attachments" ON attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages
            WHERE messages.id = attachments.message_id
            AND messages.user_id = auth.uid()
        )
    );

-- Events policies
CREATE POLICY "Users can view own events" ON events
    FOR SELECT USING (user_id = auth.uid());

-- Payment promises policies
CREATE POLICY "Users can view own payment promises" ON payment_promises
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payment promises" ON payment_promises
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payment promises" ON payment_promises
    FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- SERVICE ROLE POLICIES (for edge functions)
-- ============================================

-- Allow service role to bypass RLS for webhook operations
CREATE POLICY "Service role full access users" ON users
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access contacts" ON contacts
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access messages" ON messages
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access payments" ON payments
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access debts" ON debts
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access attachments" ON attachments
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access events" ON events
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access payment_promises" ON payment_promises
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- STORAGE BUCKET
-- ============================================

-- Note: Storage bucket creation should be done via Supabase Dashboard or CLI
-- This is just documentation of what needs to be created:
--
-- Bucket: attachments
-- Public: false
-- File size limit: 10MB
-- Allowed MIME types: image/*, audio/*, application/pdf

-- ============================================
-- INITIAL DATA (Optional - for testing)
-- ============================================

-- This section can be used to insert test data during development
-- Uncomment and modify as needed

/*
-- Insert test user
INSERT INTO users (id, email, business_name, wa_phone_number_id, wa_business_account_id)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'test@example.com',
    'Test Business',
    '123456789',
    '987654321'
);

-- Insert test contact
INSERT INTO contacts (user_id, wa_id, phone, name)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '51999888777',
    '+51999888777',
    'Cliente Test'
);
*/
