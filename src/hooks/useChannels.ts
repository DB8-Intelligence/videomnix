'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Channel, ChannelInsert, ChannelUpdate } from '@/types/database'

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchChannels = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setChannels(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  const createChannel = async (channel: ChannelInsert) => {
    const { data, error } = await supabase
      .from('channels')
      .insert(channel)
      .select()
      .single()
    if (error) throw error
    setChannels((prev) => [data, ...prev])
    return data
  }

  const updateChannel = async (id: string, updates: ChannelUpdate) => {
    const { data, error } = await supabase
      .from('channels')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setChannels((prev) => prev.map((c) => (c.id === id ? data : c)))
    return data
  }

  const deleteChannel = async (id: string) => {
    const { error } = await supabase.from('channels').delete().eq('id', id)
    if (error) throw error
    setChannels((prev) => prev.filter((c) => c.id !== id))
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    return updateChannel(id, { is_active: isActive })
  }

  return { channels, loading, createChannel, updateChannel, deleteChannel, toggleActive, refetch: fetchChannels }
}
