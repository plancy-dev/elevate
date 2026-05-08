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
      content_item_source_map: {
        Row: {
          content_item_id: string
          created_at: string
          excerpt: string | null
          id: string
          metadata: Json
          snippet_hash: string
          source_id: string
          source_published_at: string | null
          source_title: string | null
          source_url: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          excerpt?: string | null
          id?: string
          metadata?: Json
          snippet_hash: string
          source_id: string
          source_published_at?: string | null
          source_title?: string | null
          source_url: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          metadata?: Json
          snippet_hash?: string
          source_id?: string
          source_published_at?: string | null
          source_title?: string | null
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_item_source_map_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_item_source_map_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body_markdown: string
          created_at: string
          created_by: string | null
          cta_variant: string | null
          fact_check_score: number | null
          generation_model: string | null
          generation_prompt_version: string | null
          id: string
          locale: string
          metadata: Json
          published_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scheduled_at: string | null
          slug: string | null
          source_quality_score: number | null
          status: string
          summary: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          body_markdown?: string
          created_at?: string
          created_by?: string | null
          cta_variant?: string | null
          fact_check_score?: number | null
          generation_model?: string | null
          generation_prompt_version?: string | null
          id?: string
          locale?: string
          metadata?: Json
          published_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          slug?: string | null
          source_quality_score?: number | null
          status?: string
          summary?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          body_markdown?: string
          created_at?: string
          created_by?: string | null
          cta_variant?: string | null
          fact_check_score?: number | null
          generation_model?: string | null
          generation_prompt_version?: string | null
          id?: string
          locale?: string
          metadata?: Json
          published_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          slug?: string | null
          source_quality_score?: number | null
          status?: string
          summary?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_product_lemon_links: {
        Row: {
          content_product_id: string
          created_at: string
          lemon_product_id: string | null
          lemon_variant_id: string
          updated_at: string
        }
        Insert: {
          content_product_id: string
          created_at?: string
          lemon_product_id?: string | null
          lemon_variant_id: string
          updated_at?: string
        }
        Update: {
          content_product_id?: string
          created_at?: string
          lemon_product_id?: string | null
          lemon_variant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_product_lemon_links_content_product_id_fkey"
            columns: ["content_product_id"]
            isOneToOne: true
            referencedRelation: "content_products"
            referencedColumns: ["id"]
          },
        ]
      }
      content_products: {
        Row: {
          created_at: string
          currency: string
          delivery_mode: string
          description: string
          id: string
          is_active: boolean
          original_file_name: string | null
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
          original_file_name?: string | null
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
          original_file_name?: string | null
          price_cents?: number
          product_kind?: string
          slug?: string
          storage_object_path?: string | null
          title?: string
        }
        Relationships: []
      }
      content_publications: {
        Row: {
          attempt_count: number
          channel: string
          content_item_id: string
          created_at: string
          id: string
          last_error: string | null
          metadata: Json
          processed_at: string | null
          provider: string
          provider_message_id: string | null
          scheduled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          channel: string
          content_item_id: string
          created_at?: string
          id?: string
          last_error?: string | null
          metadata?: Json
          processed_at?: string | null
          provider?: string
          provider_message_id?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          channel?: string
          content_item_id?: string
          created_at?: string
          id?: string
          last_error?: string | null
          metadata?: Json
          processed_at?: string | null
          provider?: string
          provider_message_id?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_publications_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_runs: {
        Row: {
          created_at: string
          ended_at: string | null
          error_details: Json | null
          error_summary: string | null
          id: string
          initiated_by: string | null
          metadata: Json
          run_type: string
          started_at: string | null
          status: string
          trigger_type: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          error_details?: Json | null
          error_summary?: string | null
          id?: string
          initiated_by?: string | null
          metadata?: Json
          run_type: string
          started_at?: string | null
          status?: string
          trigger_type?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          error_details?: Json | null
          error_summary?: string | null
          id?: string
          initiated_by?: string | null
          metadata?: Json
          run_type?: string
          started_at?: string | null
          status?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_runs_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_sources: {
        Row: {
          base_url: string
          created_at: string
          fetch_interval_minutes: number
          id: string
          is_active: boolean
          kind: string
          locale: string | null
          metadata: Json
          name: string
          rss_url: string | null
          topic_tags: string[]
          trust_weight: number
          updated_at: string
        }
        Insert: {
          base_url: string
          created_at?: string
          fetch_interval_minutes?: number
          id?: string
          is_active?: boolean
          kind: string
          locale?: string | null
          metadata?: Json
          name: string
          rss_url?: string | null
          topic_tags?: string[]
          trust_weight?: number
          updated_at?: string
        }
        Update: {
          base_url?: string
          created_at?: string
          fetch_interval_minutes?: number
          id?: string
          is_active?: boolean
          kind?: string
          locale?: string | null
          metadata?: Json
          name?: string
          rss_url?: string | null
          topic_tags?: string[]
          trust_weight?: number
          updated_at?: string
        }
        Relationships: []
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
      newsletter_subscribers: {
        Row: {
          consent_at: string | null
          created_at: string
          email: string
          email_normalized: string | null
          frequency_pref: string
          id: string
          locale: string
          metadata: Json
          source: string
          source_ref: string | null
          status: string
          tags: string[]
          unsubscribe_at: string | null
          updated_at: string
        }
        Insert: {
          consent_at?: string | null
          created_at?: string
          email: string
          email_normalized?: string | null
          frequency_pref?: string
          id?: string
          locale?: string
          metadata?: Json
          source?: string
          source_ref?: string | null
          status?: string
          tags?: string[]
          unsubscribe_at?: string | null
          updated_at?: string
        }
        Update: {
          consent_at?: string | null
          created_at?: string
          email?: string
          email_normalized?: string | null
          frequency_pref?: string
          id?: string
          locale?: string
          metadata?: Json
          source?: string
          source_ref?: string | null
          status?: string
          tags?: string[]
          unsubscribe_at?: string | null
          updated_at?: string
        }
        Relationships: []
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
          id: number
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
          dashboard_access: boolean
          display_name: string
          email: string
          email_milestone_digest: boolean
          id: string
          loading_spinner_tempo: string
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          sidebar_icon_tone: string
          ui_locale: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dashboard_access?: boolean
          display_name?: string
          email: string
          email_milestone_digest?: boolean
          id: string
          loading_spinner_tempo?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          sidebar_icon_tone?: string
          ui_locale?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dashboard_access?: boolean
          display_name?: string
          email?: string
          email_milestone_digest?: boolean
          id?: string
          loading_spinner_tempo?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          sidebar_icon_tone?: string
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
      studio_distribution_channels: {
        Row: {
          channel_url: string
          created_at: string
          id: string
          label: string
          metadata: Json
          notes: string
          organization_id: string
          platform: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          channel_url: string
          created_at?: string
          id?: string
          label: string
          metadata?: Json
          notes?: string
          organization_id: string
          platform?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          channel_url?: string
          created_at?: string
          id?: string
          label?: string
          metadata?: Json
          notes?: string
          organization_id?: string
          platform?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_distribution_channels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_episode_draft_snapshots: {
        Row: {
          created_at: string
          episode_id: string
          hook: string
          id: string
          metadata: Json
          organization_id: string
          script_draft: string
          source: string
          title: string
        }
        Insert: {
          created_at?: string
          episode_id: string
          hook?: string
          id?: string
          metadata?: Json
          organization_id: string
          script_draft?: string
          source: string
          title?: string
        }
        Update: {
          created_at?: string
          episode_id?: string
          hook?: string
          id?: string
          metadata?: Json
          organization_id?: string
          script_draft?: string
          source?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_episode_draft_snapshots_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "studio_production_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_episode_draft_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_episode_draft_templates: {
        Row: {
          bias_body: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          bias_body: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          bias_body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_episode_draft_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_episode_draft_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_episode_llm_threads: {
        Row: {
          created_at: string
          episode_id: string
          id: string
          model: string
          organization_id: string
          provider: string
          turns: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          episode_id: string
          id?: string
          model?: string
          organization_id: string
          provider: string
          turns?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          episode_id?: string
          id?: string
          model?: string
          organization_id?: string
          provider?: string
          turns?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_episode_llm_threads_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: true
            referencedRelation: "studio_production_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_episode_llm_threads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_episode_performance: {
        Row: {
          average_view_duration_seconds: number | null
          average_view_percentage: number | null
          click_through_rate: number | null
          comments: number
          created_at: string
          episode_id: string
          estimated_revenue_usd: number | null
          fetched_at: string
          id: string
          impressions: number
          likes: number
          metadata: Json | null
          organization_id: string
          shares: number
          snapshot_date: string
          subscriber_change: number
          views: number
          watch_time_minutes: number
          youtube_video_id: string | null
        }
        Insert: {
          average_view_duration_seconds?: number | null
          average_view_percentage?: number | null
          click_through_rate?: number | null
          comments?: number
          created_at?: string
          episode_id: string
          estimated_revenue_usd?: number | null
          fetched_at?: string
          id?: string
          impressions?: number
          likes?: number
          metadata?: Json | null
          organization_id: string
          shares?: number
          snapshot_date?: string
          subscriber_change?: number
          views?: number
          watch_time_minutes?: number
          youtube_video_id?: string | null
        }
        Update: {
          average_view_duration_seconds?: number | null
          average_view_percentage?: number | null
          click_through_rate?: number | null
          comments?: number
          created_at?: string
          episode_id?: string
          estimated_revenue_usd?: number | null
          fetched_at?: string
          id?: string
          impressions?: number
          likes?: number
          metadata?: Json | null
          organization_id?: string
          shares?: number
          snapshot_date?: string
          subscriber_change?: number
          views?: number
          watch_time_minutes?: number
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_episode_performance_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "studio_production_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_episode_performance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_format_packs: {
        Row: {
          created_at: string
          description: string
          display_name: string
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          studio_niche_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          display_name: string
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          studio_niche_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_name?: string
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          studio_niche_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_format_packs_studio_niche_id_fkey"
            columns: ["studio_niche_id"]
            isOneToOne: false
            referencedRelation: "studio_niches"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_format_templates: {
        Row: {
          caption_style: string
          created_at: string
          display_name: string
          format_pack_id: string
          hook_structure: string
          id: string
          is_active: boolean
          metadata: Json
          script_prompt_shell: string
          slug: string
          sort_order: number
          target_duration_seconds: number | null
          thumbnail_spec: string
          updated_at: string
        }
        Insert: {
          caption_style?: string
          created_at?: string
          display_name: string
          format_pack_id: string
          hook_structure?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          script_prompt_shell?: string
          slug: string
          sort_order?: number
          target_duration_seconds?: number | null
          thumbnail_spec?: string
          updated_at?: string
        }
        Update: {
          caption_style?: string
          created_at?: string
          display_name?: string
          format_pack_id?: string
          hook_structure?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          script_prompt_shell?: string
          slug?: string
          sort_order?: number
          target_duration_seconds?: number | null
          thumbnail_spec?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_format_templates_format_pack_id_fkey"
            columns: ["format_pack_id"]
            isOneToOne: false
            referencedRelation: "studio_format_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_niches: {
        Row: {
          created_at: string
          description: string
          display_name: string
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          display_name: string
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_name?: string
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      studio_org_provider_connections: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          last_verified_at: string | null
          organization_id: string
          provider: string
          secret_ciphertext: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_verified_at?: string | null
          organization_id: string
          provider: string
          secret_ciphertext: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_verified_at?: string | null
          organization_id?: string
          provider?: string
          secret_ciphertext?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_org_provider_connections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_org_provider_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_org_provider_connections_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          pipeline_prefs: Json
          project_id: string | null
          publish_url: string | null
          status: string
          studio_distribution_channel_id: string | null
          studio_format_template_id: string | null
          studio_niche_id: string | null
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
          pipeline_prefs?: Json
          project_id?: string | null
          publish_url?: string | null
          status: string
          studio_distribution_channel_id?: string | null
          studio_format_template_id?: string | null
          studio_niche_id?: string | null
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
          pipeline_prefs?: Json
          project_id?: string | null
          publish_url?: string | null
          status?: string
          studio_distribution_channel_id?: string | null
          studio_format_template_id?: string | null
          studio_niche_id?: string | null
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
          {
            foreignKeyName: "studio_production_episodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_production_episodes_studio_distribution_channel_id_fkey"
            columns: ["studio_distribution_channel_id"]
            isOneToOne: false
            referencedRelation: "studio_distribution_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_production_episodes_studio_format_template_id_fkey"
            columns: ["studio_format_template_id"]
            isOneToOne: false
            referencedRelation: "studio_format_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_production_episodes_studio_niche_id_fkey"
            columns: ["studio_niche_id"]
            isOneToOne: false
            referencedRelation: "studio_niches"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_projects: {
        Row: {
          brand_guide: string
          character_bible: Json
          character_reference_image_storage_path: string | null
          character_reference_image_url: string | null
          created_at: string
          default_template_key: string | null
          description: string
          id: string
          name: string
          organization_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          brand_guide?: string
          character_bible?: Json
          character_reference_image_storage_path?: string | null
          character_reference_image_url?: string | null
          created_at?: string
          default_template_key?: string | null
          description?: string
          id?: string
          name: string
          organization_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          brand_guide?: string
          character_bible?: Json
          character_reference_image_storage_path?: string | null
          character_reference_image_url?: string | null
          created_at?: string
          default_template_key?: string | null
          description?: string
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_scheduled_posts: {
        Row: {
          buffer_channel_id: string
          buffer_post_id: string | null
          caption: string
          created_at: string
          created_by: string | null
          episode_id: string
          id: string
          idempotency_key: string
          last_error: string | null
          organization_id: string
          platform: string
          retry_count: number
          scheduled_at: string
          status: string
          updated_at: string
          video_url: string
        }
        Insert: {
          buffer_channel_id: string
          buffer_post_id?: string | null
          caption: string
          created_at?: string
          created_by?: string | null
          episode_id: string
          id?: string
          idempotency_key: string
          last_error?: string | null
          organization_id: string
          platform: string
          retry_count?: number
          scheduled_at: string
          status?: string
          updated_at?: string
          video_url: string
        }
        Update: {
          buffer_channel_id?: string
          buffer_post_id?: string | null
          caption?: string
          created_at?: string
          created_by?: string | null
          episode_id?: string
          id?: string
          idempotency_key?: string
          last_error?: string | null
          organization_id?: string
          platform?: string
          retry_count?: number
          scheduled_at?: string
          status?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_scheduled_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_scheduled_posts_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "studio_production_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_scheduled_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_video_assembly_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          episode_id: string
          error_message: string | null
          id: string
          input: Json
          max_retries: number
          organization_id: string
          output_artifact_id: string | null
          processing_started_at: string | null
          retry_count: number
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          episode_id: string
          error_message?: string | null
          id?: string
          input?: Json
          max_retries?: number
          organization_id: string
          output_artifact_id?: string | null
          processing_started_at?: string | null
          retry_count?: number
          started_at?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          episode_id?: string
          error_message?: string | null
          id?: string
          input?: Json
          max_retries?: number
          organization_id?: string
          output_artifact_id?: string | null
          processing_started_at?: string | null
          retry_count?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_video_assembly_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_video_assembly_jobs_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "studio_production_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_video_assembly_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_video_assembly_jobs_output_artifact_id_fkey"
            columns: ["output_artifact_id"]
            isOneToOne: false
            referencedRelation: "studio_production_artifacts"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_youtube_channel_tokens: {
        Row: {
          access_token_cipher: string
          channel_id: string
          channel_title: string | null
          connected_at: string
          created_at: string
          id: string
          last_used_at: string | null
          organization_id: string
          project_id: string | null
          refresh_token_cipher: string
          scopes: string
          token_expiry: string | null
          updated_at: string
        }
        Insert: {
          access_token_cipher: string
          channel_id: string
          channel_title?: string | null
          connected_at?: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          organization_id: string
          project_id?: string | null
          refresh_token_cipher: string
          scopes?: string
          token_expiry?: string | null
          updated_at?: string
        }
        Update: {
          access_token_cipher?: string
          channel_id?: string
          channel_title?: string | null
          connected_at?: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          organization_id?: string
          project_id?: string | null
          refresh_token_cipher?: string
          scopes?: string
          token_expiry?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_youtube_channel_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_youtube_channel_tokens_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
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
      user_blog_subscription_webhook_events: {
        Row: {
          event_id: string
          event_name: string
          lemon_squeezy_subscription_id: string | null
          payload: Json
          payment_provider: string | null
          payment_subscription_id: string | null
          processed_at: string
        }
        Insert: {
          event_id: string
          event_name: string
          lemon_squeezy_subscription_id?: string | null
          payload?: Json
          payment_provider?: string | null
          payment_subscription_id?: string | null
          processed_at?: string
        }
        Update: {
          event_id?: string
          event_name?: string
          lemon_squeezy_subscription_id?: string | null
          payload?: Json
          payment_provider?: string | null
          payment_subscription_id?: string | null
          processed_at?: string
        }
        Relationships: []
      }
      user_blog_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          lemon_squeezy_subscription_id: string | null
          lemon_squeezy_variant_id: number | null
          manage_subscription_url: string | null
          payment_product_id: string | null
          payment_provider: string | null
          payment_subscription_id: string | null
          subscription_status:
            | Database["public"]["Enums"]["blog_subscription_status"]
            | null
          subscription_tier: Database["public"]["Enums"]["blog_subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          lemon_squeezy_subscription_id?: string | null
          lemon_squeezy_variant_id?: number | null
          manage_subscription_url?: string | null
          payment_product_id?: string | null
          payment_provider?: string | null
          payment_subscription_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["blog_subscription_status"]
            | null
          subscription_tier?: Database["public"]["Enums"]["blog_subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          lemon_squeezy_subscription_id?: string | null
          lemon_squeezy_variant_id?: number | null
          manage_subscription_url?: string | null
          payment_product_id?: string | null
          payment_provider?: string | null
          payment_subscription_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["blog_subscription_status"]
            | null
          subscription_tier?: Database["public"]["Enums"]["blog_subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blog_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
      claim_studio_video_assembly_job: {
        Args: never
        Returns: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          episode_id: string
          error_message: string | null
          id: string
          input: Json
          max_retries: number
          organization_id: string
          output_artifact_id: string | null
          processing_started_at: string | null
          retry_count: number
          started_at: string | null
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "studio_video_assembly_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      reset_stale_studio_video_assembly_jobs: {
        Args: { stale_before?: string }
        Returns: {
          failed_count: number
          requeued_count: number
        }[]
      }
      user_organization_id: { Args: never; Returns: string }
      user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      blog_subscription_status: "active" | "cancelled" | "expired" | "past_due"
      blog_subscription_tier: "free" | "monthly" | "annual"
      org_plan: "starter" | "professional" | "enterprise"
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
      blog_subscription_status: ["active", "cancelled", "expired", "past_due"],
      blog_subscription_tier: ["free", "monthly", "annual"],
      org_plan: ["starter", "professional", "enterprise"],
      user_role: ["admin", "organizer", "coordinator", "viewer"],
    },
  },
} as const
