'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MonitorPlay, Check, Loader2 } from 'lucide-react'

interface YouTubeConnectProps {
  channelId?: string
  connected: boolean
  youtubeChannelName?: string
  onConnected?: () => void
}

export function YouTubeConnect({
  channelId,
  connected,
  youtubeChannelName,
}: YouTubeConnectProps) {
  const [loading, setLoading] = useState(false)

  const handleConnect = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (channelId) params.set('channel_id', channelId)
    window.location.href = `/api/youtube/auth?${params.toString()}`
  }

  if (connected) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
        <Check className="h-5 w-5 text-green-600" />
        <div className="flex-1">
          <p className="font-medium text-green-800 dark:text-green-200">
            Canal YouTube conectado
          </p>
          {youtubeChannelName && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {youtubeChannelName}
            </p>
          )}
        </div>
        <Badge variant="outline" className="border-green-300">
          Conectado
        </Badge>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8">
      <MonitorPlay className="h-12 w-12 text-red-500" />
      <div className="text-center">
        <h3 className="font-semibold">Conectar canal YouTube</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Autorize o Videomnix a fazer upload de vídeos no seu canal.
        </p>
      </div>
      <Button onClick={handleConnect} disabled={loading} variant="destructive">
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <MonitorPlay className="mr-2 h-4 w-4" />
        )}
        Conectar YouTube
      </Button>
    </div>
  )
}
