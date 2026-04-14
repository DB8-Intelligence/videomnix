// src/types/supabase.ts
// Gerado com base nas migrations 001–005 aplicadas
// Atualizar com: npx supabase gen types typescript --linked > src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────

export type PlanType = 'trial' | 'starter' | 'pro' | 'enterprise' | 'blocked'
export type PlanStatus = 'active' | 'trial' | 'canceled' | 'past_due' | 'blocked'

export type ContentQueueStatus =
  | 'pending' | 'scripting' | 'scripted'
  | 'voicing' | 'voiced'
  | 'rendering' | 'rendered'
  | 'thumbnailing' | 'thumbnailed'
  | 'shorting' | 'ready'
  | 'avatar_generating' | 'avatar_ready' | 'formatting'
  | 'scheduled' | 'posted' | 'failed'

export type ContentEngine = 'dark' | 'ugc'
export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube'

export type BrandStatus = 'prospect' | 'active' | 'paused' | 'closed' | 'blocked'

export type DealStage =
  | 'prospecting' | 'contacted' | 'negotiating' | 'contract'
  | 'production' | 'published' | 'paid' | 'lost'

export type DealType =
  | 'sponsored_post' | 'story' | 'reel' | 'youtube_integration'
  | 'ambassador' | 'affiliate' | 'barter' | 'event' | 'other'

export type DealPriority = 'low' | 'medium' | 'high'

export type DealActivityType =
  | 'note' | 'email' | 'whatsapp' | 'call' | 'meeting'
  | 'stage_change' | 'file' | 'contract' | 'payment'

export type AvatarStatus = 'pending' | 'training' | 'ready' | 'failed'
export type VoiceCloneStatus = 'pending' | 'ready' | 'failed'

export type ConversationStatus = 'open' | 'read' | 'archived' | 'spam'
export type MessageDirection = 'incoming' | 'outgoing'
export type MessageType = 'text' | 'image' | 'video' | 'story_reply' | 'reel_reply' | 'other'

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly'

export type ContentTemplateType = 'script' | 'caption' | 'hook' | 'cta' | 'story' | 'reel' | 'shorts' | 'all'
export type ContentTemplatePlatform = 'instagram' | 'tiktok' | 'youtube' | 'all'

export type NotificationType =
  | 'deal_deadline' | 'video_published' | 'video_failed'
  | 'new_message' | 'competitor_spike' | 'analytics_ready' | 'system'

// ─────────────────────────────────────────
// TABELAS — Motor Dark (001–003)
// ─────────────────────────────────────────

export interface User {
  id: string
  auth_id: string
  email: string
  name: string | null
  plan: string
  channels_limit: number
  videos_per_month: number
  trial_ends_at: string | null
  // Motor Social (005)
  nicho: string | null
  bio: string | null
  website: string | null
  whatsapp: string | null
  timezone: string
  avatar_url: string | null
  followers_total: number
  onboarding_done: boolean
  created_at: string
}

export interface Channel {
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

export interface ContentQueue {
  id: string
  channel_id: string | null
  user_id: string
  status: ContentQueueStatus
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
  // Motor UGC (004)
  engine: ContentEngine
  avatar_id: string | null
  voice_clone_id: string | null
  social_account_id: string | null
  platform: SocialPlatform
  scheduled_at: string | null
  published_url: string | null
  published_platform_id: string | null
  // Motor Social (005)
  posted_at: string | null
  retry_count: number
  error_log: string | null
  cost_usd: number
  tokens_used: number
  created_at: string
  updated_at: string
}

export interface VideoMetrics {
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

export interface DataSource {
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

// ─────────────────────────────────────────
// TABELAS — Motor UGC (004)
// ─────────────────────────────────────────

export interface Subscription {
  id: string
  user_id: string
  plan_type: PlanType
  status: PlanStatus
  trial_ends_at: string | null
  current_period_end: string | null
  kiwify_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface Avatar {
  id: string
  user_id: string
  name: string
  status: AvatarStatus
  source_video_url: string | null
  source_photos_urls: string[]
  heygem_avatar_id: string | null
  gpu_job_id: string | null
  training_started_at: string | null
  training_completed_at: string | null
  error_message: string | null
  retry_count: number
  is_default: boolean
  consent_confirmed: boolean
  consent_confirmed_at: string | null
  consent_ip_address: string | null
  created_at: string
  updated_at: string
}

export interface VoiceClone {
  id: string
  user_id: string
  name: string
  status: VoiceCloneStatus
  source_audio_url: string | null
  elevenlabs_voice_id: string | null
  is_default: boolean
  error_message: string | null
  consent_confirmed: boolean
  consent_confirmed_at: string | null
  created_at: string
  updated_at: string
}

export interface SocialAccount {
  id: string
  user_id: string
  platform: SocialPlatform
  platform_account_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  // access_token e refresh_token NUNCA retornar ao cliente
  followers_count: number
  following_count: number
  posts_count: number
  engagement_rate: number
  is_active: boolean
  last_synced_at: string | null
  created_at: string
}

// ─────────────────────────────────────────
// TABELAS — Motor Social (005)
// ─────────────────────────────────────────

export interface Brand {
  id: string
  user_id: string
  name: string
  category: string | null
  website: string | null
  instagram: string | null
  logo_url: string | null
  description: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_role: string | null
  status: BrandStatus
  total_deals: number
  total_revenue: number
  avg_deal_value: number
  tags: string[]
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  user_id: string
  brand_id: string | null
  title: string
  description: string | null
  value: number | null
  currency: string
  stage: DealStage
  deal_type: DealType
  deliverables: Json
  start_date: string | null
  deadline: string | null
  published_at: string | null
  payment_due: string | null
  content_queue_id: string | null
  priority: DealPriority
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DealActivity {
  id: string
  deal_id: string
  user_id: string
  type: DealActivityType
  content: string | null
  metadata: Json
  created_at: string
}

export interface Competitor {
  id: string
  user_id: string
  name: string
  platform: SocialPlatform
  username: string
  profile_url: string | null
  avatar_url: string | null
  niche: string | null
  notes: string | null
  followers_count: number
  avg_views: number
  avg_engagement: number
  posting_frequency: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CompetitorSnapshot {
  id: string
  competitor_id: string
  user_id: string
  followers_count: number | null
  following_count: number | null
  posts_count: number | null
  avg_views: number | null
  avg_likes: number | null
  avg_comments: number | null
  engagement_rate: number | null
  top_posts: Json
  snapshotted_at: string
}

export interface Conversation {
  id: string
  user_id: string
  social_account_id: string | null
  platform: SocialPlatform
  external_thread_id: string
  participant_username: string | null
  participant_name: string | null
  participant_avatar: string | null
  participant_user_id: string | null
  status: ConversationStatus
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  brand_id: string | null
  deal_id: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  user_id: string
  external_id: string | null
  direction: MessageDirection
  content: string | null
  media_urls: string[]
  message_type: MessageType
  is_read: boolean
  sent_at: string
  created_at: string
}

export interface AnalyticsSnapshot {
  id: string
  user_id: string
  social_account_id: string | null
  platform: SocialPlatform
  period: AnalyticsPeriod
  followers_count: number
  followers_gained: number
  followers_lost: number
  total_views: number
  total_likes: number
  total_comments: number
  total_shares: number
  avg_engagement_rate: number
  reach: number
  impressions: number
  profile_visits: number
  // YouTube específico
  watch_time_hours: number
  avg_view_duration_s: number
  revenue_usd: number  // AdSense YouTube — não é módulo financeiro
  rpm: number
  top_posts: Json
  snapshotted_at: string
  snapshot_day: string  // GENERATED ALWAYS AS — só leitura
}

export interface ContentTemplate {
  id: string
  user_id: string | null  // null = template global
  name: string
  description: string | null
  platform: ContentTemplatePlatform | null
  content_type: ContentTemplateType | null
  niche: string | null
  template: string
  variables: string[]
  is_global: boolean
  usage_count: number
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  action_url: string | null
  metadata: Json
  is_read: boolean
  created_at: string
}

// ─────────────────────────────────────────
// TIPOS DE INSERT / UPDATE (omitem campos auto-gerados)
// ─────────────────────────────────────────

export type BrandInsert = Omit<Brand, 'id' | 'created_at' | 'updated_at' | 'total_deals' | 'total_revenue' | 'avg_deal_value'>
export type BrandUpdate = Partial<Omit<Brand, 'id' | 'user_id' | 'created_at'>>

export type DealInsert = Omit<Deal, 'id' | 'created_at' | 'updated_at'>
export type DealUpdate = Partial<Omit<Deal, 'id' | 'user_id' | 'created_at'>>

export type DealActivityInsert = Omit<DealActivity, 'id' | 'created_at'>

export type CompetitorInsert = Omit<Competitor, 'id' | 'created_at' | 'updated_at'>
export type CompetitorUpdate = Partial<Omit<Competitor, 'id' | 'user_id' | 'created_at'>>

export type ConversationInsert = Omit<Conversation, 'id' | 'created_at' | 'updated_at'>
export type MessageInsert = Omit<Message, 'id' | 'created_at'>

export type NotificationInsert = Omit<Notification, 'id' | 'created_at'>
export type ContentTemplateInsert = Omit<ContentTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'>

// ─────────────────────────────────────────
// TIPOS COMPOSTOS (joins frequentes)
// ─────────────────────────────────────────

export interface DealWithBrand extends Deal {
  brand: Pick<Brand, 'id' | 'name' | 'logo_url' | 'category' | 'status'> | null
}

export interface DealWithActivities extends DealWithBrand {
  activities: DealActivity[]
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
  social_account: Pick<SocialAccount, 'id' | 'platform' | 'username' | 'avatar_url'> | null
  brand: Pick<Brand, 'id' | 'name' | 'logo_url'> | null
}

export interface BrandWithDeals extends Brand {
  deals: Deal[]
}

export interface CompetitorWithSnapshots extends Competitor {
  snapshots: CompetitorSnapshot[]
}
