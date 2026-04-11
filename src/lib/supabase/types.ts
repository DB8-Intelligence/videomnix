export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_id: string
          email: string
          name: string | null
          plan: string
          channels_limit: number
          videos_per_month: number
          trial_ends_at: string
          whatsapp: string | null
          timezone: string
          onboarding_done: boolean
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          auth_id: string
          email: string
          name?: string | null
          plan?: string
          channels_limit?: number
          videos_per_month?: number
          trial_ends_at?: string
          whatsapp?: string | null
          timezone?: string
          onboarding_done?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          auth_id?: string
          email?: string
          name?: string | null
          plan?: string
          channels_limit?: number
          videos_per_month?: number
          trial_ends_at?: string
          whatsapp?: string | null
          timezone?: string
          onboarding_done?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          user_id: string
          name: string
          niche: string
          language: string
          youtube_channel_id: string | null
          youtube_oauth: Json | null
          voice_id: string | null
          template_style: string
          videos_per_week: number
          posting_times: string[]
          rpm_avg: number
          total_views: number
          total_videos: number
          is_active: boolean
          config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          niche: string
          language?: string
          youtube_channel_id?: string | null
          youtube_oauth?: Json | null
          voice_id?: string | null
          template_style?: string
          videos_per_week?: number
          posting_times?: string[]
          rpm_avg?: number
          total_views?: number
          total_videos?: number
          is_active?: boolean
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          niche?: string
          language?: string
          youtube_channel_id?: string | null
          youtube_oauth?: Json | null
          voice_id?: string | null
          template_style?: string
          videos_per_week?: number
          posting_times?: string[]
          rpm_avg?: number
          total_views?: number
          total_videos?: number
          is_active?: boolean
          config?: Json
          created_at?: string
          updated_at?: string
        }
      }
      content_queue: {
        Row: {
          id: string
          channel_id: string
          user_id: string
          status: string
          topic: string
          source_type: string | null
          source_url: string | null
          source_raw: string | null
          script: string | null
          title: string | null
          title_variants: string[] | null
          description: string | null
          tags: string[] | null
          thumbnail_prompt: string | null
          scene_descriptions: string[] | null
          shorts_hooks: string[] | null
          audio_url: string | null
          video_url: string | null
          thumbnail_url: string | null
          shorts_urls: string[] | null
          youtube_video_id: string | null
          youtube_shorts_ids: string[] | null
          scheduled_at: string | null
          posted_at: string | null
          retry_count: number
          error_log: string | null
          cost_usd: number
          tokens_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          user_id: string
          status?: string
          topic: string
          source_type?: string | null
          source_url?: string | null
          source_raw?: string | null
          script?: string | null
          title?: string | null
          title_variants?: string[] | null
          description?: string | null
          tags?: string[] | null
          thumbnail_prompt?: string | null
          scene_descriptions?: string[] | null
          shorts_hooks?: string[] | null
          audio_url?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          shorts_urls?: string[] | null
          youtube_video_id?: string | null
          youtube_shorts_ids?: string[] | null
          scheduled_at?: string | null
          posted_at?: string | null
          retry_count?: number
          error_log?: string | null
          cost_usd?: number
          tokens_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          user_id?: string
          status?: string
          topic?: string
          source_type?: string | null
          source_url?: string | null
          source_raw?: string | null
          script?: string | null
          title?: string | null
          title_variants?: string[] | null
          description?: string | null
          tags?: string[] | null
          thumbnail_prompt?: string | null
          scene_descriptions?: string[] | null
          shorts_hooks?: string[] | null
          audio_url?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          shorts_urls?: string[] | null
          youtube_video_id?: string | null
          youtube_shorts_ids?: string[] | null
          scheduled_at?: string | null
          posted_at?: string | null
          retry_count?: number
          error_log?: string | null
          cost_usd?: number
          tokens_used?: number
          created_at?: string
          updated_at?: string
        }
      }
      video_metrics: {
        Row: {
          id: string
          content_id: string
          channel_id: string
          user_id: string
          youtube_video_id: string
          views: number
          likes: number
          comments: number
          shares: number
          watch_time_min: number
          avg_view_pct: number
          impressions: number
          ctr: number
          revenue_usd: number
          rpm: number
          synced_at: string
        }
        Insert: {
          id?: string
          content_id: string
          channel_id: string
          user_id: string
          youtube_video_id: string
          views?: number
          likes?: number
          comments?: number
          shares?: number
          watch_time_min?: number
          avg_view_pct?: number
          impressions?: number
          ctr?: number
          revenue_usd?: number
          rpm?: number
          synced_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          channel_id?: string
          user_id?: string
          youtube_video_id?: string
          views?: number
          likes?: number
          comments?: number
          shares?: number
          watch_time_min?: number
          avg_view_pct?: number
          impressions?: number
          ctr?: number
          revenue_usd?: number
          rpm?: number
          synced_at?: string
        }
      }
      data_sources: {
        Row: {
          id: string
          channel_id: string
          name: string
          type: string
          url: string
          fetch_frequency: string
          keywords_filter: string[] | null
          min_score: number
          last_fetched: string | null
          last_item_id: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          name: string
          type: string
          url: string
          fetch_frequency?: string
          keywords_filter?: string[] | null
          min_score?: number
          last_fetched?: string | null
          last_item_id?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          name?: string
          type?: string
          url?: string
          fetch_frequency?: string
          keywords_filter?: string[] | null
          min_score?: number
          last_fetched?: string | null
          last_item_id?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      channel_performance: {
        Row: {
          id: string
          name: string
          niche: string
          language: string
          user_id: string
          total_videos: number
          posted_videos: number
          total_views: number
          total_revenue_usd: number
          avg_rpm: number
          avg_retention: number
          avg_ctr: number
        }
      }
    }
    Functions: {
      get_user_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
  }
}
