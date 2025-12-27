export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enum types matching database enums
export type PaymentStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled'
export type PaymentMethod = 'transfer_bcp' | 'transfer_bbva' | 'transfer_interbank' | 'transfer_scotiabank' | 'yape' | 'plin' | 'deposit' | 'cash' | 'other'
export type ContactStatus = 'active' | 'inactive' | 'blocked'
export type MessageSender = 'contact' | 'user' | 'system'
export type PaymentIntent = 'pago' | 'promesa' | 'consulta' | 'otro'
export type PromiseStatus = 'pending' | 'fulfilled' | 'overdue' | 'cancelled'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          company_name: string | null
          timezone: string
          currency: string
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          company_name?: string | null
          timezone?: string
          currency?: string
          language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          company_name?: string | null
          timezone?: string
          currency?: string
          language?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          webhook_url: string | null
          verify_token: string
          whatsapp_phone_id: string | null
          whatsapp_business_id: string | null
          whatsapp_access_token: string | null
          auto_process: boolean
          min_confidence_threshold: number
          low_confidence_alert: boolean
          notifications_enabled: boolean
          notify_new_payments: boolean
          notify_promises: boolean
          notify_errors: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          webhook_url?: string | null
          verify_token?: string
          whatsapp_phone_id?: string | null
          whatsapp_business_id?: string | null
          whatsapp_access_token?: string | null
          auto_process?: boolean
          min_confidence_threshold?: number
          low_confidence_alert?: boolean
          notifications_enabled?: boolean
          notify_new_payments?: boolean
          notify_promises?: boolean
          notify_errors?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          webhook_url?: string | null
          verify_token?: string
          whatsapp_phone_id?: string | null
          whatsapp_business_id?: string | null
          whatsapp_access_token?: string | null
          auto_process?: boolean
          min_confidence_threshold?: number
          low_confidence_alert?: boolean
          notifications_enabled?: boolean
          notify_new_payments?: boolean
          notify_promises?: boolean
          notify_errors?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string
          email: string | null
          location: string | null
          company: string | null
          notes: string | null
          status: ContactStatus
          is_starred: boolean
          total_paid: number
          pending_amount: number
          payment_count: number
          reliability_score: number
          last_payment_at: string | null
          last_message_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone: string
          email?: string | null
          location?: string | null
          company?: string | null
          notes?: string | null
          status?: ContactStatus
          is_starred?: boolean
          total_paid?: number
          pending_amount?: number
          payment_count?: number
          reliability_score?: number
          last_payment_at?: string | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string
          email?: string | null
          location?: string | null
          company?: string | null
          notes?: string | null
          status?: ContactStatus
          is_starred?: boolean
          total_paid?: number
          pending_amount?: number
          payment_count?: number
          reliability_score?: number
          last_payment_at?: string | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          user_id: string
          contact_id: string | null
          whatsapp_message_id: string | null
          sender: MessageSender
          content: string
          media_url: string | null
          media_type: string | null
          is_payment_related: boolean
          payment_intent: PaymentIntent | null
          detected_amount: number | null
          detected_currency: string | null
          confidence_score: number | null
          requires_review: boolean
          ai_analysis: Json | null
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          contact_id?: string | null
          whatsapp_message_id?: string | null
          sender: MessageSender
          content: string
          media_url?: string | null
          media_type?: string | null
          is_payment_related?: boolean
          payment_intent?: PaymentIntent | null
          detected_amount?: number | null
          detected_currency?: string | null
          confidence_score?: number | null
          requires_review?: boolean
          ai_analysis?: Json | null
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string | null
          whatsapp_message_id?: string | null
          sender?: MessageSender
          content?: string
          media_url?: string | null
          media_type?: string | null
          is_payment_related?: boolean
          payment_intent?: PaymentIntent | null
          detected_amount?: number | null
          detected_currency?: string | null
          confidence_score?: number | null
          requires_review?: boolean
          ai_analysis?: Json | null
          created_at?: string
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          user_id: string
          contact_id: string | null
          message_id: string | null
          amount: number
          currency: string
          status: PaymentStatus
          method: PaymentMethod | null
          method_detail: string | null
          reference_number: string | null
          bank_name: string | null
          account_number: string | null
          payment_date: string | null
          payment_time: string | null
          confidence_score: number
          requires_review: boolean
          notes: string | null
          confirmed_by: string | null
          confirmed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id?: string | null
          message_id?: string | null
          amount: number
          currency?: string
          status?: PaymentStatus
          method?: PaymentMethod | null
          method_detail?: string | null
          reference_number?: string | null
          bank_name?: string | null
          account_number?: string | null
          payment_date?: string | null
          payment_time?: string | null
          confidence_score?: number
          requires_review?: boolean
          notes?: string | null
          confirmed_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string | null
          message_id?: string | null
          amount?: number
          currency?: string
          status?: PaymentStatus
          method?: PaymentMethod | null
          method_detail?: string | null
          reference_number?: string | null
          bank_name?: string | null
          account_number?: string | null
          payment_date?: string | null
          payment_time?: string | null
          confidence_score?: number
          requires_review?: boolean
          notes?: string | null
          confirmed_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_contact_id_fkey"
            columns: ["contact_id"]
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_message_id_fkey"
            columns: ["message_id"]
            referencedRelation: "messages"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_promises: {
        Row: {
          id: string
          user_id: string
          contact_id: string | null
          message_id: string | null
          promised_amount: number
          currency: string
          promised_date: string | null
          status: PromiseStatus
          fulfilled_payment_id: string | null
          notes: string | null
          reminder_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id?: string | null
          message_id?: string | null
          promised_amount: number
          currency?: string
          promised_date?: string | null
          status?: PromiseStatus
          fulfilled_payment_id?: string | null
          notes?: string | null
          reminder_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string | null
          message_id?: string | null
          promised_amount?: number
          currency?: string
          promised_date?: string | null
          status?: PromiseStatus
          fulfilled_payment_id?: string | null
          notes?: string | null
          reminder_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_promises_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_promises_contact_id_fkey"
            columns: ["contact_id"]
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
      webhook_logs: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          payload: Json | null
          status: string
          error_message: string | null
          processing_time_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          payload?: Json | null
          status?: string
          error_message?: string | null
          processing_time_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          payload?: Json | null
          status?: string
          error_message?: string | null
          processing_time_ms?: number | null
          created_at?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          entity_type: string | null
          entity_id: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      daily_stats: {
        Row: {
          user_id: string
          date: string
          total_payments: number
          confirmed_payments: number
          pending_payments: number
          confirmed_amount: number
          pending_amount: number
          avg_confidence: number
        }
      }
      monthly_stats: {
        Row: {
          user_id: string
          month: string
          total_payments: number
          confirmed_payments: number
          confirmed_amount: number
          total_amount: number
          unique_contacts: number
        }
      }
    }
    Functions: {
      calculate_reliability_score: {
        Args: { p_contact_id: string }
        Returns: number
      }
    }
    Enums: {
      payment_status: PaymentStatus
      payment_method: PaymentMethod
      contact_status: ContactStatus
      message_sender: MessageSender
      payment_intent: PaymentIntent
      promise_status: PromiseStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type UserSettings = Database['public']['Tables']['user_settings']['Row']
export type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert']
export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update']

export type Contact = Database['public']['Tables']['contacts']['Row']
export type ContactInsert = Database['public']['Tables']['contacts']['Insert']
export type ContactUpdate = Database['public']['Tables']['contacts']['Update']

export type Message = Database['public']['Tables']['messages']['Row']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type MessageUpdate = Database['public']['Tables']['messages']['Update']

export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']

export type PaymentPromise = Database['public']['Tables']['payment_promises']['Row']
export type PaymentPromiseInsert = Database['public']['Tables']['payment_promises']['Insert']
export type PaymentPromiseUpdate = Database['public']['Tables']['payment_promises']['Update']

export type WebhookLog = Database['public']['Tables']['webhook_logs']['Row']
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']

export type DailyStats = Database['public']['Views']['daily_stats']['Row']
export type MonthlyStats = Database['public']['Views']['monthly_stats']['Row']

// Contact with related data
export type ContactWithPayments = Contact & {
  payments?: Payment[]
  messages?: Message[]
}

// Payment with related data
export type PaymentWithContact = Payment & {
  contact?: Contact
  message?: Message
}

// Message with related data
export type MessageWithContact = Message & {
  contact?: Contact
}
