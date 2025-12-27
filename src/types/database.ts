// Local type definitions for database entities
// These are used until the auto-generated types are updated

export type ContactStatus = 'active' | 'inactive' | 'blocked';

export type PaymentStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';

export type PaymentMethod = 
  | 'transfer_bcp' 
  | 'transfer_bbva' 
  | 'transfer_interbank' 
  | 'transfer_scotiabank' 
  | 'yape' 
  | 'plin' 
  | 'deposit' 
  | 'cash' 
  | 'other';

export type MessageDirection = 'incoming' | 'outgoing';

export type MessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact' | 'sticker';

export type MessageStatus = 'received' | 'processing' | 'processed' | 'failed' | 'sent' | 'delivered' | 'read';

export type PaymentIntent = 'payment' | 'promise' | 'query' | 'confirmation' | 'unknown';

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  company_name: string | null;
  timezone: string | null;
  currency: string | null;
  language: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string | null;
  location: string | null;
  company: string | null;
  notes: string | null;
  status: ContactStatus;
  is_starred: boolean;
  total_paid: number;
  pending_amount: number;
  last_message_at: string | null;
  last_payment_at: string | null;
  tags: string[] | null;
  custom_fields: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ContactInsert {
  user_id?: string;
  name: string;
  phone: string;
  email?: string | null;
  location?: string | null;
  company?: string | null;
  notes?: string | null;
  status?: ContactStatus;
  is_starred?: boolean;
  total_paid?: number;
  pending_amount?: number;
  last_message_at?: string | null;
  last_payment_at?: string | null;
  tags?: string[] | null;
  custom_fields?: Record<string, unknown> | null;
}

export interface ContactUpdate {
  user_id?: string;
  name?: string;
  phone?: string;
  email?: string | null;
  location?: string | null;
  company?: string | null;
  notes?: string | null;
  status?: ContactStatus;
  is_starred?: boolean;
  total_paid?: number;
  pending_amount?: number;
  last_message_at?: string | null;
  last_payment_at?: string | null;
  tags?: string[] | null;
  custom_fields?: Record<string, unknown> | null;
  updated_at?: string;
}

export interface ContactWithPayments extends Contact {
  payments?: Payment[];
}

export interface Message {
  id: string;
  user_id: string;
  contact_id: string | null;
  whatsapp_message_id: string | null;
  direction: MessageDirection;
  type: MessageType;
  content: string | null;
  media_url: string | null;
  media_mime_type: string | null;
  is_payment_related: boolean;
  payment_intent: PaymentIntent | null;
  detected_amount: number | null;
  detected_currency: string | null;
  confidence_score: number;
  requires_review: boolean;
  ai_analysis: Record<string, unknown> | null;
  processed_at: string | null;
  status: MessageStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageInsert {
  user_id?: string;
  contact_id?: string | null;
  whatsapp_message_id?: string | null;
  direction: MessageDirection;
  type?: MessageType;
  content?: string | null;
  media_url?: string | null;
  media_mime_type?: string | null;
  is_payment_related?: boolean;
  payment_intent?: PaymentIntent | null;
  detected_amount?: number | null;
  detected_currency?: string | null;
  confidence_score?: number;
  requires_review?: boolean;
  ai_analysis?: Record<string, unknown> | null;
  processed_at?: string | null;
  status?: MessageStatus;
  error_message?: string | null;
}

export interface MessageWithContact extends Message {
  contact?: Contact | null;
}

export interface Payment {
  id: string;
  user_id: string;
  contact_id: string | null;
  message_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod | null;
  method_detail: string | null;
  reference_number: string | null;
  bank_name: string | null;
  account_number: string | null;
  payment_date: string | null;
  payment_time: string | null;
  notes: string | null;
  confidence_score: number;
  confirmed_by: string | null;
  confirmed_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentInsert {
  user_id?: string;
  contact_id?: string | null;
  message_id?: string | null;
  amount: number;
  currency?: string;
  status?: PaymentStatus;
  method?: PaymentMethod | null;
  method_detail?: string | null;
  reference_number?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  payment_date?: string | null;
  payment_time?: string | null;
  notes?: string | null;
  confidence_score?: number;
}

export interface PaymentUpdate {
  user_id?: string;
  contact_id?: string | null;
  message_id?: string | null;
  amount?: number;
  currency?: string;
  status?: PaymentStatus;
  method?: PaymentMethod | null;
  method_detail?: string | null;
  reference_number?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  payment_date?: string | null;
  payment_time?: string | null;
  notes?: string | null;
  confidence_score?: number;
  confirmed_by?: string | null;
  confirmed_at?: string | null;
  rejected_reason?: string | null;
  updated_at?: string;
}

export interface PaymentWithContact extends Payment {
  contact?: Contact | null;
}

export interface Settings {
  id: string;
  user_id: string;
  webhook_url: string | null;
  verify_token: string | null;
  whatsapp_phone_id: string | null;
  whatsapp_business_id: string | null;
  whatsapp_access_token: string | null;
  auto_process: boolean;
  min_confidence_threshold: number;
  low_confidence_alert: boolean;
  notifications_enabled: boolean;
  notify_new_payments: boolean;
  notify_promises: boolean;
  notify_errors: boolean;
  created_at: string;
  updated_at: string;
}

export interface SettingsInsert {
  user_id?: string;
  webhook_url?: string | null;
  verify_token?: string | null;
  whatsapp_phone_id?: string | null;
  whatsapp_business_id?: string | null;
  whatsapp_access_token?: string | null;
  auto_process?: boolean;
  min_confidence_threshold?: number;
  low_confidence_alert?: boolean;
  notifications_enabled?: boolean;
  notify_new_payments?: boolean;
  notify_promises?: boolean;
  notify_errors?: boolean;
}

export interface SettingsUpdate {
  webhook_url?: string | null;
  verify_token?: string | null;
  whatsapp_phone_id?: string | null;
  whatsapp_business_id?: string | null;
  whatsapp_access_token?: string | null;
  auto_process?: boolean;
  min_confidence_threshold?: number;
  low_confidence_alert?: boolean;
  notifications_enabled?: boolean;
  notify_new_payments?: boolean;
  notify_promises?: boolean;
  notify_errors?: boolean;
  updated_at?: string;
}

// Conversation type for messaging
export interface Conversation {
  id: string;
  contact: Contact;
  lastMessage: Message | null;
  unreadCount: number;
  hasPaymentPending: boolean;
}
