'use client'

import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Film, Tv } from 'lucide-react'

interface UsageWidgetProps {
  videosUsed: number
  videosLimit: number
  channelsUsed: number
  channelsLimit: number
  plan: string
}

export function UsageWidget({
  videosUsed,
  videosLimit,
  channelsUsed,
  channelsLimit,
  plan,
}: UsageWidgetProps) {
  const videosPct = videosLimit > 0 ? Math.min(100, (videosUsed / videosLimit) * 100) : 0
  const channelsPct = channelsLimit > 0 ? Math.min(100, (channelsUsed / channelsLimit) * 100) : 0

  const isUnlimited = plan === 'enterprise'

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Uso do plano</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Film className="h-3.5 w-3.5" />
              Vídeos este mês
            </span>
            <span className="font-medium">
              {videosUsed}{isUnlimited ? '' : ` / ${videosLimit}`}
            </span>
          </div>
          {!isUnlimited && (
            <Progress
              value={videosPct}
              className="h-2"
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Tv className="h-3.5 w-3.5" />
              Canais
            </span>
            <span className="font-medium">
              {channelsUsed}{isUnlimited ? '' : ` / ${channelsLimit}`}
            </span>
          </div>
          {!isUnlimited && (
            <Progress
              value={channelsPct}
              className="h-2"
            />
          )}
        </div>

        {videosPct >= 80 && !isUnlimited && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            ⚠ Você está próximo do limite mensal.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
