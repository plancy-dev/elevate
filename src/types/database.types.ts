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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attendees: {
        Row: {
          checked_in: boolean
          checked_in_at: string | null
          company: string
          created_at: string
          currency: string
          custom_fields: Json
          email: string
          event_id: string
          first_name: string
          id: string
          job_title: string
          last_name: string
          nps_score: number | null
          registration_type: Database["public"]["Enums"]["registration_type"]
          ticket_price_cents: number
        }
        Insert: {
          checked_in?: boolean
          checked_in_at?: string | null
          company?: string
          created_at?: string
          currency?: string
          custom_fields?: Json
          email: string
          event_id: string
          first_name?: string
          id?: string
          job_title?: string
          last_name?: string
          nps_score?: number | null
          registration_type?: Database["public"]["Enums"]["registration_type"]
          ticket_price_cents?: number
        }
        Update: {
          checked_in?: boolean
          checked_in_at?: string | null
          company?: string
          created_at?: string
          currency?: string
          custom_fields?: Json
          email?: string
          event_id?: string
          first_name?: string
          id?: string
          job_title?: string
          last_name?: string
          nps_score?: number | null
          registration_type?: Database["public"]["Enums"]["registration_type"]
          ticket_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          organization_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          organization_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_purchase_allowlist: {
        Row: {
          created_at: string
          email_normalized: string
          id: string
          note: string | null
        }
        Insert: {
          created_at?: string
          email_normalized: string
          id?: string
          note?: string | null
        }
        Update: {
          created_at?: string
          email_normalized?: string
          id?: string
          note?: string | null
        }
        Relationships: []
      }
      prompt_studio_beta_allowlist: {
        Row: {
          created_at: string
          email_normalized: string
          id: string
          note: string | null
        }
        Insert: {
          created_at?: string
          email_normalized: string
          id?: string
          note?: string | null
        }
        Update: {
          created_at?: string
          email_normalized?: string
          id?: string
          note?: string | null
        }
        Relationships: []
      }
      content_products: {
        Row: {
          created_at: string
          currency: string
          delivery_mode: string
          description: string
          id: string
          is_active: boolean
          price_cents: number
          product_kind: string
          slug: string
          storage_object_path: string | null
          title: string
        }
        Insert: {
          created_at?: string
          currency?: string
          delivery_mode?: string
          description?: string
          id?: string
          is_active?: boolean
          price_cents?: number
          product_kind?: string
          slug: string
          storage_object_path?: string | null
          title: string
        }
        Update: {
          created_at?: string
          currency?: string
          delivery_mode?: string
          description?: string
          id?: string
          is_active?: boolean
          price_cents?: number
          product_kind?: string
          slug?: string
          storage_object_path?: string | null
          title?: string
        }
        Relationships: []
      }
      content_ebook_first_opens: {
        Row: {
          content_product_id: string
          id: string
          opened_at: string
          organization_id: string
          user_id: string
        }
        Insert: {
          content_product_id: string
          id?: string
          opened_at?: string
          organization_id: string
          user_id: string
        }
        Update: {
          content_product_id?: string
          id?: string
          opened_at?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_ebook_first_opens_content_product_id_fkey"
            columns: ["content_product_id"]
            isOneToOne: false
            referencedRelation: "content_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_ebook_first_opens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actual_attendees: number
          budget_cents: number
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string
          end_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          expected_attendees: number
          id: string
          is_public: boolean
          organization_id: string
          revenue_cents: number
          slug: string
          start_date: string
          status: Database["public"]["Enums"]["event_status"]
          timezone: string
          title: string
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          actual_attendees?: number
          budget_cents?: number
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          end_date: string
          event_type?: Database["public"]["Enums"]["event_type"]
          expected_attendees?: number
          id?: string
          is_public?: boolean
          organization_id: string
          revenue_cents?: number
          slug: string
          start_date: string
          status?: Database["public"]["Enums"]["event_status"]
          timezone?: string
          title: string
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          actual_attendees?: number
          budget_cents?: number
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          end_date?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          expected_attendees?: number
          id?: string
          is_public?: boolean
          organization_id?: string
          revenue_cents?: number
          slug?: string
          start_date?: string
          status?: Database["public"]["Enums"]["event_status"]
          timezone?: string
          title?: string
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      lemon_squeezy_processed_orders: {
        Row: {
          content_product_id: string
          created_at: string
          event_name: string
          ls_order_identifier: string
          organization_id: string
          user_email: string | null
          variant_id: number | null
        }
        Insert: {
          content_product_id: string
          created_at?: string
          event_name?: string
          ls_order_identifier: string
          organization_id: string
          user_email?: string | null
          variant_id?: number | null
        }
        Update: {
          content_product_id?: string
          created_at?: string
          event_name?: string
          ls_order_identifier?: string
          organization_id?: string
          user_email?: string | null
          variant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lemon_squeezy_processed_orders_content_product_id_fkey"
            columns: ["content_product_id"]
            isOneToOne: false
            referencedRelation: "content_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lemon_squeezy_processed_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_content_entitlements: {
        Row: {
          content_product_id: string
          granted_at: string
          id: string
          organization_id: string
        }
        Insert: {
          content_product_id: string
          granted_at?: string
          id?: string
          organization_id: string
        }
        Update: {
          content_product_id?: string
          granted_at?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_content_entitlements_content_product_id_fkey"
            columns: ["content_product_id"]
            isOneToOne: false
            referencedRelation: "content_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_content_entitlements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          plan: Database["public"]["Enums"]["org_plan"]
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          plan?: Database["public"]["Enums"]["org_plan"]
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          plan?: Database["public"]["Enums"]["org_plan"]
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_email_settings: {
        Row: {
          id: number
          updated_at: string
          waitlist_bcc_email: string | null
        }
        Insert: {
          id?: number
          updated_at?: string
          waitlist_bcc_email?: string | null
        }
        Update: {
          id?: number
          updated_at?: string
          waitlist_bcc_email?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string
          email_milestone_digest: boolean
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          ui_locale: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email: string
          email_milestone_digest?: boolean
          id: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          ui_locale?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string
          email_milestone_digest?: boolean
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          ui_locale?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      session_attendees: {
        Row: {
          attendee_id: string
          checked_in: boolean
          checked_in_at: string | null
          session_id: string
        }
        Insert: {
          attendee_id: string
          checked_in?: boolean
          checked_in_at?: string | null
          session_id: string
        }
        Update: {
          attendee_id?: string
          checked_in?: boolean
          checked_in_at?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendees_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendees_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          capacity: number
          created_at: string
          description: string
          end_time: string
          event_id: string
          id: string
          registered_count: number
          room: string
          speaker_name: string
          speaker_title: string
          start_time: string
          title: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          description?: string
          end_time: string
          event_id: string
          id?: string
          registered_count?: number
          room?: string
          speaker_name?: string
          speaker_title?: string
          start_time: string
          title: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string
          end_time?: string
          event_id?: string
          id?: string
          registered_count?: number
          room?: string
          speaker_name?: string
          speaker_title?: string
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_production_artifacts: {
        Row: {
          artifact_role: string
          content_text: string
          created_at: string
          episode_id: string
          external_url: string | null
          id: string
          metadata: Json
          organization_id: string
          sort_order: number
          tool_platform: string
        }
        Insert: {
          artifact_role: string
          content_text?: string
          created_at?: string
          episode_id: string
          external_url?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          sort_order?: number
          tool_platform: string
        }
        Update: {
          artifact_role?: string
          content_text?: string
          created_at?: string
          episode_id?: string
          external_url?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          sort_order?: number
          tool_platform?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_production_artifacts_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "studio_production_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_production_artifacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_production_episodes: {
        Row: {
          created_at: string
          created_by: string | null
          distribution_label: string
          id: string
          notes: string
          organization_id: string
          publish_url: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          distribution_label?: string
          id?: string
          notes?: string
          organization_id: string
          publish_url?: string | null
          status: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          distribution_label?: string
          id?: string
          notes?: string
          organization_id?: string
          publish_url?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_production_episodes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_production_episodes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      toss_payment_intents: {
        Row: {
          amount_krw: number
          confirmed_at: string | null
          content_product_id: string | null
          created_at: string
          created_by: string
          id: string
          last_webhook_at: string | null
          last_webhook_payload: Json
          order_id: string
          organization_id: string
          payment_key: string | null
          status: string
        }
        Insert: {
          amount_krw: number
          confirmed_at?: string | null
          content_product_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          last_webhook_at?: string | null
          last_webhook_payload?: Json
          order_id: string
          organization_id: string
          payment_key?: string | null
          status?: string
        }
        Update: {
          amount_krw?: number
          confirmed_at?: string | null
          content_product_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          last_webhook_at?: string | null
          last_webhook_payload?: Json
          order_id?: string
          organization_id?: string
          payment_key?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "toss_payment_intents_content_product_id_fkey"
            columns: ["content_product_id"]
            isOneToOne: false
            referencedRelation: "content_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toss_payment_intents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toss_payment_intents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string
          capacity: number
          city: string
          country: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          organization_id: string
        }
        Insert: {
          address?: string
          capacity?: number
          city?: string
          country?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          organization_id: string
        }
        Update: {
          address?: string
          capacity?: number
          city?: string
          country?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          locale: string | null
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          locale?: string | null
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          locale?: string | null
          source?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_organization_id: { Args: never; Returns: string }
      user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      event_status:
        | "draft"
        | "planning"
        | "registration_open"
        | "live"
        | "completed"
        | "cancelled"
      event_type:
        | "conference"
        | "exhibition"
        | "meeting"
        | "incentive"
        | "seminar"
        | "workshop"
        | "gala"
        | "other"
      org_plan: "starter" | "professional" | "enterprise"
      registration_type: "general" | "vip" | "speaker" | "sponsor" | "media"
      user_role: "admin" | "organizer" | "coordinator" | "viewer"
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
      event_status: [
        "draft",
        "planning",
        "registration_open",
        "live",
        "completed",
        "cancelled",
      ],
      event_type: [
        "conference",
        "exhibition",
        "meeting",
        "incentive",
        "seminar",
        "workshop",
        "gala",
        "other",
      ],
      org_plan: ["starter", "professional", "enterprise"],
      registration_type: ["general", "vip", "speaker", "sponsor", "media"],
      user_role: ["admin", "organizer", "coordinator", "viewer"],
    },
  },
} as const
