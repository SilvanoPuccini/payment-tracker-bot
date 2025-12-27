export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          company: string | null
          created_at: string
          custom_fields: Json | null
          email: string | null
          id: string
          is_starred: boolean
          last_message_at: string | null
          last_payment_at: string | null
          location: string | null
          name: string
          notes: string | null
          pending_amount: number
          phone: string
          status: string
          tags: string[] | null
          total_paid: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          id?: string
          is_starred?: boolean
          last_message_at?: string | null
          last_payment_at?: string | null
          location?: string | null
          name: string
          notes?: string | null
          pending_amount?: number
          phone: string
          status?: string
          tags?: string[] | null
          total_paid?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          id?: string
          is_starred?: boolean
          last_message_at?: string | null
          last_payment_at?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          pending_amount?: number
          phone?: string
          status?: string
          tags?: string[] | null
          total_paid?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          ai_analysis: Json | null
          confidence_score: number | null
          contact_id: string | null
          content: string | null
          created_at: string
          detected_amount: number | null
          detected_currency: string | null
          direction: string
          error_message: string | null
          id: string
          is_payment_related: boolean
          media_mime_type: string | null
          media_url: string | null
          payment_intent: string | null
          processed_at: string | null
          requires_review: boolean
          status: string
          type: string
          updated_at: string
          user_id: string
          whatsapp_message_id: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          confidence_score?: number | null
          contact_id?: string | null
          content?: string | null
          created_at?: string
          detected_amount?: number | null
          detected_currency?: string | null
          direction: string
          error_message?: string | null
          id?: string
          is_payment_related?: boolean
          media_mime_type?: string | null
          media_url?: string | null
          payment_intent?: string | null
          processed_at?: string | null
          requires_review?: boolean
          status?: string
          type?: string
          updated_at?: string
          user_id: string
          whatsapp_message_id?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          confidence_score?: number | null
          contact_id?: string | null
          content?: string | null
          created_at?: string
          detected_amount?: number | null
          detected_currency?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          is_payment_related?: boolean
          media_mime_type?: string | null
          media_url?: string | null
          payment_intent?: string | null
          processed_at?: string | null
          requires_review?: boolean
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          account_number: string | null
          amount: number
          bank_name: string | null
          confidence_score: number | null
          confirmed_at: string | null
          confirmed_by: string | null
          contact_id: string | null
          created_at: string
          currency: string
          id: string
          message_id: string | null
          method: string | null
          method_detail: string | null
          notes: string | null
          payment_date: string | null
          payment_time: string | null
          reference_number: string | null
          rejected_reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          amount: number
          bank_name?: string | null
          confidence_score?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          contact_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          message_id?: string | null
          method?: string | null
          method_detail?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_time?: string | null
          reference_number?: string | null
          rejected_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          amount?: number
          bank_name?: string | null
          confidence_score?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          contact_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          message_id?: string | null
          method?: string | null
          method_detail?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_time?: string | null
          reference_number?: string | null
          rejected_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          currency: string | null
          email: string | null
          full_name: string | null
          id: string
          language: string | null
          phone: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          language?: string | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          language?: string | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          auto_process: boolean
          created_at: string
          id: string
          low_confidence_alert: boolean
          min_confidence_threshold: number | null
          notifications_enabled: boolean
          notify_errors: boolean
          notify_new_payments: boolean
          notify_promises: boolean
          updated_at: string
          user_id: string
          verify_token: string | null
          webhook_url: string | null
          whatsapp_access_token: string | null
          whatsapp_business_id: string | null
          whatsapp_phone_id: string | null
        }
        Insert: {
          auto_process?: boolean
          created_at?: string
          id?: string
          low_confidence_alert?: boolean
          min_confidence_threshold?: number | null
          notifications_enabled?: boolean
          notify_errors?: boolean
          notify_new_payments?: boolean
          notify_promises?: boolean
          updated_at?: string
          user_id: string
          verify_token?: string | null
          webhook_url?: string | null
          whatsapp_access_token?: string | null
          whatsapp_business_id?: string | null
          whatsapp_phone_id?: string | null
        }
        Update: {
          auto_process?: boolean
          created_at?: string
          id?: string
          low_confidence_alert?: boolean
          min_confidence_threshold?: number | null
          notifications_enabled?: boolean
          notify_errors?: boolean
          notify_new_payments?: boolean
          notify_promises?: boolean
          updated_at?: string
          user_id?: string
          verify_token?: string | null
          webhook_url?: string | null
          whatsapp_access_token?: string | null
          whatsapp_business_id?: string | null
          whatsapp_phone_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
