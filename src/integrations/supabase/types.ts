/**
 * Supabase Database Types
 * Generated from PostgreSQL schema for PayTrack MVP
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone: string | null
          business_name: string
          wa_phone_number_id: string | null
          wa_business_account_id: string | null
          wa_access_token: string | null
          wa_webhook_verify_token: string | null
          settings: Json
          stats_cache: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          phone?: string | null
          business_name: string
          wa_phone_number_id?: string | null
          wa_business_account_id?: string | null
          wa_access_token?: string | null
          wa_webhook_verify_token?: string | null
          settings?: Json
          stats_cache?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          business_name?: string
          wa_phone_number_id?: string | null
          wa_business_account_id?: string | null
          wa_access_token?: string | null
          wa_webhook_verify_token?: string | null
          settings?: Json
          stats_cache?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          wa_id: string
          phone: string
          name: string | null
          profile_picture_url: string | null
          email: string | null
          notes: string | null
          total_debt: number
          total_paid: number
          last_message_at: string | null
          message_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          wa_id: string
          phone: string
          name?: string | null
          profile_picture_url?: string | null
          email?: string | null
          notes?: string | null
          total_debt?: number
          total_paid?: number
          last_message_at?: string | null
          message_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          wa_id?: string
          phone?: string
          name?: string | null
          profile_picture_url?: string | null
          email?: string | null
          notes?: string | null
          total_debt?: number
          total_paid?: number
          last_message_at?: string | null
          message_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          wa_message_id: string
          type: Database["public"]["Enums"]["message_type"]
          content: string | null
          media_id: string | null
          media_url: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          wa_timestamp: string
          analysis: Json | null
          intent: Database["public"]["Enums"]["message_intent"] | null
          confidence: number | null
          extracted_data: Json | null
          status: Database["public"]["Enums"]["message_status"]
          error_message: string | null
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id: string
          wa_message_id: string
          type?: Database["public"]["Enums"]["message_type"]
          content?: string | null
          media_id?: string | null
          media_url?: string | null
          direction?: Database["public"]["Enums"]["message_direction"]
          wa_timestamp: string
          analysis?: Json | null
          intent?: Database["public"]["Enums"]["message_intent"] | null
          confidence?: number | null
          extracted_data?: Json | null
          status?: Database["public"]["Enums"]["message_status"]
          error_message?: string | null
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string
          wa_message_id?: string
          type?: Database["public"]["Enums"]["message_type"]
          content?: string | null
          media_id?: string | null
          media_url?: string | null
          direction?: Database["public"]["Enums"]["message_direction"]
          wa_timestamp?: string
          analysis?: Json | null
          intent?: Database["public"]["Enums"]["message_intent"] | null
          confidence?: number | null
          extracted_data?: Json | null
          status?: Database["public"]["Enums"]["message_status"]
          error_message?: string | null
          processed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          message_id: string | null
          debt_id: string | null
          amount: number
          currency: string
          payment_date: string
          payment_method: string | null
          reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          confidence: number | null
          source: Database["public"]["Enums"]["payment_source"]
          notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id: string
          message_id?: string | null
          debt_id?: string | null
          amount: number
          currency?: string
          payment_date: string
          payment_method?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          confidence?: number | null
          source?: Database["public"]["Enums"]["payment_source"]
          notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string
          message_id?: string | null
          debt_id?: string | null
          amount?: number
          currency?: string
          payment_date?: string
          payment_method?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          confidence?: number | null
          source?: Database["public"]["Enums"]["payment_source"]
          notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          }
        ]
      }
      debts: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          amount: number
          currency: string
          due_date: string | null
          description: string | null
          reference: string | null
          status: Database["public"]["Enums"]["debt_status"]
          paid_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id: string
          amount: number
          currency?: string
          due_date?: string | null
          description?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["debt_status"]
          paid_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string
          amount?: number
          currency?: string
          due_date?: string | null
          description?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["debt_status"]
          paid_amount?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
      attachments: {
        Row: {
          id: string
          message_id: string
          type: Database["public"]["Enums"]["attachment_type"]
          mime_type: string | null
          file_name: string | null
          file_size: number | null
          storage_path: string | null
          url: string | null
          ocr_result: Json | null
          ocr_confidence: number | null
          ocr_extracted_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          type: Database["public"]["Enums"]["attachment_type"]
          mime_type?: string | null
          file_name?: string | null
          file_size?: number | null
          storage_path?: string | null
          url?: string | null
          ocr_result?: Json | null
          ocr_confidence?: number | null
          ocr_extracted_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          type?: Database["public"]["Enums"]["attachment_type"]
          mime_type?: string | null
          file_name?: string | null
          file_size?: number | null
          storage_path?: string | null
          url?: string | null
          ocr_result?: Json | null
          ocr_confidence?: number | null
          ocr_extracted_data?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          }
        ]
      }
      events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          entity_type: string | null
          entity_id: string | null
          data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          entity_type?: string | null
          entity_id?: string | null
          data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          entity_type?: string | null
          entity_id?: string | null
          data?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_promises: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          message_id: string | null
          debt_id: string | null
          amount: number | null
          currency: string
          promised_date: string
          status: string
          fulfilled_payment_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id: string
          message_id?: string | null
          debt_id?: string | null
          amount?: number | null
          currency?: string
          promised_date: string
          status?: string
          fulfilled_payment_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string
          message_id?: string | null
          debt_id?: string | null
          amount?: number | null
          currency?: string
          promised_date?: string
          status?: string
          fulfilled_payment_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_promises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_promises_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_promises_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_promises_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_promises_fulfilled_payment_id_fkey"
            columns: ["fulfilled_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_event: {
        Args: {
          p_user_id: string
          p_event_type: string
          p_entity_type: string | null
          p_entity_id: string | null
          p_data: Json | null
        }
        Returns: string
      }
    }
    Enums: {
      message_type: 'text' | 'image' | 'audio' | 'document' | 'video' | 'sticker' | 'location'
      message_direction: 'inbound' | 'outbound'
      message_intent: 'pago' | 'promesa' | 'consulta' | 'otro'
      message_status: 'pending' | 'processing' | 'processed' | 'review' | 'error'
      payment_status: 'detected' | 'confirmed' | 'rejected' | 'duplicate'
      payment_source: 'ai_detected' | 'ocr' | 'manual'
      debt_status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled'
      attachment_type: 'image' | 'audio' | 'document' | 'video'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      message_type: ['text', 'image', 'audio', 'document', 'video', 'sticker', 'location'] as const,
      message_direction: ['inbound', 'outbound'] as const,
      message_intent: ['pago', 'promesa', 'consulta', 'otro'] as const,
      message_status: ['pending', 'processing', 'processed', 'review', 'error'] as const,
      payment_status: ['detected', 'confirmed', 'rejected', 'duplicate'] as const,
      payment_source: ['ai_detected', 'ocr', 'manual'] as const,
      debt_status: ['pending', 'partial', 'paid', 'overdue', 'cancelled'] as const,
      attachment_type: ['image', 'audio', 'document', 'video'] as const,
    },
  },
} as const
