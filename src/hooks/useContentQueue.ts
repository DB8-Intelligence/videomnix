'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ContentQueue } from '@/types/database'

export function useContentQueue(channelId?: string) {
  const [queue, setQueue] = useState<ContentQueue[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('content_queue')
      .select('*')
      .order('created_at', { ascending: false })

    if (channelId) {
      query = query.eq('channel_id', channelId)
    }

    const { data, error } = await query
    if (!error && data) setQueue(data)
    setLoading(false)
  }, [supabase, channelId])

  useEffect(() => {
    fetchQueue()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('content_queue_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_queue',
          ...(channelId ? { filter: `channel_id=eq.${channelId}` } : {}),
        },
        () => {
          fetchQueue()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, channelId, fetchQueue])

  const triggerGeneration = async (channelId: string) => {
    const res = await fetch(`/api/channels/${channelId}/trigger`, {
      method: 'POST',
    })
    if (!res.ok) throw new Error('Failed to trigger generation')
    return res.json()
  }

  const retryFailed = async (contentId: string) => {
    const { error } = await supabase
      .from('content_queue')
      .update({ status: 'pending', retry_count: 0, error_log: null })
      .eq('id', contentId)
    if (error) throw error
    fetchQueue()
  }

  return { queue, loading, triggerGeneration, retryFailed, refetch: fetchQueue }
}
