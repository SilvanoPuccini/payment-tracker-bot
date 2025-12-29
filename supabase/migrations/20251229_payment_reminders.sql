-- =============================================
-- SISTEMA DE RECORDATORIOS DE COBRO
-- =============================================

-- Tabla de recordatorios
CREATE TABLE payment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

    -- Configuracion del recordatorio
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('before_due', 'on_due', 'after_due', 'custom')),
    days_offset INTEGER DEFAULT 0, -- dias antes(-) o despues(+) del vencimiento

    -- Estado
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,

    -- Mensaje
    message_template TEXT,
    channel TEXT DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'email', 'both')),

    -- Metadata
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuracion de recordatorios por usuario
CREATE TABLE reminder_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Recordatorios automaticos
    auto_remind_enabled BOOLEAN DEFAULT true,
    remind_before_days INTEGER[] DEFAULT ARRAY[3, 1], -- 3 dias y 1 dia antes
    remind_after_days INTEGER[] DEFAULT ARRAY[1, 3, 7], -- 1, 3, 7 dias despues

    -- Plantillas de mensaje
    before_due_template TEXT DEFAULT 'Hola {contact_name}, te recordamos que tienes un pago pendiente de {currency} {amount} con vencimiento el {due_date}.',
    on_due_template TEXT DEFAULT 'Hola {contact_name}, hoy vence tu pago de {currency} {amount}. Puedes ayudarte con algo?',
    after_due_template TEXT DEFAULT 'Hola {contact_name}, tu pago de {currency} {amount} esta vencido desde hace {days_overdue} dias. Por favor contactanos.',

    -- Horarios
    send_hour INTEGER DEFAULT 10, -- Hora del dia para enviar (0-23)
    weekend_send BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Indices
CREATE INDEX idx_reminders_scheduled ON payment_reminders(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_reminders_user ON payment_reminders(user_id);
CREATE INDEX idx_reminders_payment ON payment_reminders(payment_id);

-- RLS
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reminders" ON payment_reminders
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reminder settings" ON reminder_settings
    FOR ALL USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_payment_reminders_updated_at
    BEFORE UPDATE ON payment_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminder_settings_updated_at
    BEFORE UPDATE ON reminder_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para crear settings al crear usuario
CREATE OR REPLACE FUNCTION create_reminder_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO reminder_settings (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created_reminder_settings
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_reminder_settings();

-- =============================================
-- SISTEMA DE NOTIFICACIONES
-- =============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- payment_received, payment_confirmed, promise_created, reminder_sent, etc.
    title TEXT NOT NULL,
    message TEXT,
    icon TEXT, -- emoji o nombre de icono
    data JSONB, -- datos adicionales (payment_id, contact_id, etc.)
    action_url TEXT, -- URL para navegar
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- =============================================
-- AGREGAR payment_due_date A PAYMENTS
-- =============================================

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_due_date DATE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS auto_remind BOOLEAN DEFAULT false;

CREATE INDEX idx_payments_due_date ON payments(payment_due_date) WHERE payment_due_date IS NOT NULL;
