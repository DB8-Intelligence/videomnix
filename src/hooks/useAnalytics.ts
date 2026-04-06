'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VideoMetrics, ChannelPerformance } from '@/types/database'

export function useAnalytics(channelId?: string, period: '7d' | '30d' | '90d' = '30d') {
  const [metrics, setMetrics] = useState<VideoMetrics[]>([])
  const [performance, setPerformance] = useState<ChannelPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const since = new Date()
    since.setDate(since.getDate() - days)

    let query = supabase
      .from('video_metrics')
      .select('*')
      .gte('synced_at', since.toISOString())
      .order('synced_at', { ascending: false })

    if (channelId) {
      query = query.eq('channel_id', channelId)
    }

    const { data } = await query
    if (data) setMetrics(data)

    // Fetch channel performance view
    let perfQuery = supabase.from('channel_performance').select('*')
    if (channelId) {
      perfQuery = perfQuery.eq('id', channelId)
    }
    const { data: perfData } = await perfQuery
    if (perfData) setPerformance(perfData)

    setLoading(false)
  }, [supabase, channelId, period])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const totalViews = performance.reduce((sum, p) => sum + (p.total_views || 0), 0)
  const avgRpm = performance.length
    ? performance.reduce((sum, p) => sum + (p.avg_rpm || 0), 0) / performance.length
    : 0
  const totalRevenue = performance.reduce((sum, p) => sum + (p.total_revenue_usd || 0), 0)

  return { metrics, performance, loading, totalViews, avgRpm, totalRevenue, refetch: fetchMetrics }
}
