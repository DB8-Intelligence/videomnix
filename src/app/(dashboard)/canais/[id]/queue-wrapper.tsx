'use client'

import { QueueTable } from '@/components/videos/QueueTable'
import { TriggerButton } from '@/components/videos/TriggerButton'
import { Button } from '@/components/ui/button'
import { TrendingUp, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface QueueTableWrapperProps {
  channelId: string
}

export function QueueTableWrapper({ channelId }: QueueTableWrapperProps) {
  const [fetchingTrending, setFetchingTrending] = useState(false)

  const handleFetchTrending = async () => {
    setFetchingTrending(true)
    try {
      await fetch('/api/db8/fetch-trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: channelId }),
      })
    } catch {
      // Failed to fetch trending
    } finally {
      setFetchingTrending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <TriggerButton channelId={channelId} />
        <Button variant="outline" onClick={handleFetchTrending} disabled={fetchingTrending}>
          {fetchingTrending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <TrendingUp className="mr-2 h-4 w-4" />
          )}
          Buscar trending
        </Button>
      </div>
      <QueueTable channelId={channelId} />
    </div>
  )
}
