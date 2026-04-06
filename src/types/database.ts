import type { Database } from '@/lib/supabase/types'

export type Tables = Database['public']['Tables']
export type Views = Database['public']['Views']

export type User = Tables['users']['Row']
export type UserInsert = Tables['users']['Insert']
export type UserUpdate = Tables['users']['Update']

export type Channel = Tables['channels']['Row']
export type ChannelInsert = Tables['channels']['Insert']
export type ChannelUpdate = Tables['channels']['Update']

export type ContentQueue = Tables['content_queue']['Row']
export type ContentQueueInsert = Tables['content_queue']['Insert']
export type ContentQueueUpdate = Tables['content_queue']['Update']

export type VideoMetrics = Tables['video_metrics']['Row']
export type VideoMetricsInsert = Tables['video_metrics']['Insert']

export type DataSource = Tables['data_sources']['Row']
export type DataSourceInsert = Tables['data_sources']['Insert']

export type ChannelPerformance = Views['channel_performance']['Row']

export type ContentStatus =
  | 'pending'
  | 'fetching'
  | 'scripting'
  | 'voicing'
  | 'rendering'
  | 'thumbnailing'
  | 'shorting'
  | 'ready'
  | 'posted'
  | 'failed'
