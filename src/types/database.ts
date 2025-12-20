/**
 * Database Types - Auto-generated from PostgreSQL schema
 * These types mirror the database schema for type-safe queries
 */

// ============================================
// Enums
// ============================================

export type MessageType = 'text' | 'image' | 'audio' | 'document' | 'video' | 'sticker' | 'location';

export type MessageDirection = 'inbound' | 'outbound';

export type MessageIntent = 'pago' | 'promesa' | 'consulta' | 'otro';

export type MessageStatus = 'pending' | 'processing' | 'processed' | 'review' | 'error';

export type PaymentStatus = 'detected' | 'confirmed' | 'rejected' | 'duplicate';

export type PaymentSource = 'ai_detected' | 'ocr' | 'manual';

export type DebtStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export type AttachmentType = 'image' | 'audio' | 'document' | 'video';

export type PromiseStatus = 'pending' | 'fulfilled' | 'broken' | 'cancelled';

// ============================================
// User Types
// ============================================

export interface UserSettings {
  timezone: string;
  currency: string;
  language: string;
  auto_process: boolean;
  confidence_threshold: number;
  notifications: {
    new_payment: boolean;
    payment_promise: boolean;
    low_confidence: boolean;
    system_errors: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  phone: string | null;
  business_name: string;
  wa_phone_number_id: string | null;
  wa_business_account_id: string | null;
  wa_access_token: string | null;
  wa_webhook_verify_token: string | null;
  settings: UserSettings;
  stats_cache: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at' | 'stats_cache' | 'wa_webhook_verify_token'> & {
  id?: string;
  settings?: Partial<UserSettings>;
};

export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>;

// ============================================
// Contact Types
// ============================================

export interface Contact {
  id: string;
  user_id: string;
  wa_id: string;
  phone: string;
  name: string | null;
  profile_picture_url: string | null;
  email: string | null;
  notes: string | null;
  total_debt: number;
  total_paid: number;
  last_message_at: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export type ContactInsert = Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'total_debt' | 'total_paid' | 'message_count'> & {
  id?: string;
};

export type ContactUpdate = Partial<Omit<Contact, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// Message Types
// ============================================

export interface ExtractedData {
  amount?: number;
  currency?: string;
  date?: string;
  paymentMethod?: string;
  reference?: string;
  dueDate?: string;
}

export interface MessageAnalysis {
  intent: MessageIntent;
  confidence: number;
  extractedData: ExtractedData;
  summary: string;
  requiresReview: boolean;
}

export interface Message {
  id: string;
  user_id: string;
  contact_id: string;
  wa_message_id: string;
  type: MessageType;
  content: string | null;
  media_id: string | null;
  media_url: string | null;
  direction: MessageDirection;
  wa_timestamp: string;
  analysis: MessageAnalysis | null;
  intent: MessageIntent | null;
  confidence: number | null;
  extracted_data: ExtractedData | null;
  status: MessageStatus;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
}

export type MessageInsert = Omit<Message, 'id' | 'created_at' | 'analysis' | 'intent' | 'confidence' | 'extracted_data' | 'processed_at' | 'error_message'> & {
  id?: string;
  status?: MessageStatus;
};

export type MessageUpdate = Partial<Omit<Message, 'id' | 'user_id' | 'contact_id' | 'wa_message_id' | 'created_at'>>;

// ============================================
// Payment Types
// ============================================

export interface Payment {
  id: string;
  user_id: string;
  contact_id: string;
  message_id: string | null;
  debt_id: string | null;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string | null;
  reference: string | null;
  status: PaymentStatus;
  confidence: number | null;
  source: PaymentSource;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentInsert = Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'reviewed_by' | 'reviewed_at'> & {
  id?: string;
  status?: PaymentStatus;
  source?: PaymentSource;
};

export type PaymentUpdate = Partial<Omit<Payment, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// Debt Types
// ============================================

export interface Debt {
  id: string;
  user_id: string;
  contact_id: string;
  amount: number;
  currency: string;
  due_date: string | null;
  description: string | null;
  reference: string | null;
  status: DebtStatus;
  paid_amount: number;
  created_at: string;
  updated_at: string;
}

export type DebtInsert = Omit<Debt, 'id' | 'created_at' | 'updated_at' | 'paid_amount'> & {
  id?: string;
  status?: DebtStatus;
  paid_amount?: number;
};

export type DebtUpdate = Partial<Omit<Debt, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// Attachment Types
// ============================================

export interface OCRResult {
  text?: string;
  amount?: number;
  currency?: string;
  date?: string;
  reference?: string;
  bank?: string;
  raw_text?: string;
}

export interface Attachment {
  id: string;
  message_id: string;
  type: AttachmentType;
  mime_type: string | null;
  file_name: string | null;
  file_size: number | null;
  storage_path: string | null;
  url: string | null;
  ocr_result: OCRResult | null;
  ocr_confidence: number | null;
  ocr_extracted_data: ExtractedData | null;
  created_at: string;
}

export type AttachmentInsert = Omit<Attachment, 'id' | 'created_at'> & {
  id?: string;
};

// ============================================
// Event Types
// ============================================

export interface Event {
  id: string;
  user_id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
}

export type EventInsert = Omit<Event, 'id' | 'created_at'> & {
  id?: string;
};

// ============================================
// Payment Promise Types
// ============================================

export interface PaymentPromise {
  id: string;
  user_id: string;
  contact_id: string;
  message_id: string | null;
  debt_id: string | null;
  amount: number | null;
  currency: string;
  promised_date: string;
  status: PromiseStatus;
  fulfilled_payment_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentPromiseInsert = Omit<PaymentPromise, 'id' | 'created_at' | 'updated_at' | 'fulfilled_payment_id'> & {
  id?: string;
  status?: PromiseStatus;
};

export type PaymentPromiseUpdate = Partial<Omit<PaymentPromise, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// Joined/Expanded Types (for queries with relations)
// ============================================

export interface MessageWithContact extends Message {
  contacts: Contact;
}

export interface PaymentWithRelations extends Payment {
  contacts: Contact;
  messages?: Message;
  debts?: Debt;
}

export interface DebtWithContact extends Debt {
  contacts: Contact;
}

export interface PaymentPromiseWithRelations extends PaymentPromise {
  contacts: Contact;
  messages?: Message;
  debts?: Debt;
}

// ============================================
// Dashboard/Stats Types
// ============================================

export interface DashboardStats {
  total_payments_amount: number;
  confirmed_payments_count: number;
  pending_payments_count: number;
  detection_rate: number;
  messages_today: number;
  payments_detected_today: number;
  promises_pending: number;
}

export interface ActivityData {
  date: string;
  messages: number;
  payments: number;
  amount: number;
}

// ============================================
// API Response Types
// ============================================

export interface ProcessMessageResponse {
  success: boolean;
  analysis: MessageAnalysis;
  businessRules?: {
    matchedDebtId?: string;
    isDuplicate: boolean;
    duplicatePaymentId?: string;
    adjustedConfidence: number;
    validationNotes: string[];
  };
  paymentId?: string;
  promiseId?: string;
  timestamp: string;
}

export interface WebhookVerificationParams {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}
