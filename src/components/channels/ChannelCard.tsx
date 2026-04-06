'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Settings, Eye } from 'lucide-react'
import type { Channel } from '@/types/database'
import { NICHES, type NicheKey } from '@/lib/niche-config'

interface ChannelCardProps {
  channel: Channel
}

export function ChannelCard({ channel }: ChannelCardProps) {
  const niche = NICHES[channel.niche as NicheKey]

  return (
    <Card className="flex flex-col">
      <CardContent className="flex-1 pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{niche?.emoji || '📺'}</span>
            <div>
              <h3 className="font-semibold">{channel.name}</h3>
              <p className="text-sm text-muted-foreground">
                {niche?.label || channel.niche}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={channel.language === 'pt-BR' ? 'default' : 'secondary'}>
              {channel.language}
            </Badge>
            <Badge variant={channel.is_active ? 'default' : 'outline'}>
              {channel.is_active ? 'Ativo' : 'Pausado'}
            </Badge>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{channel.videos_per_week}</p>
            <p className="text-xs text-muted-foreground">vídeos/semana</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              R${Number(channel.rpm_avg || 0).toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">RPM médio</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {(channel.total_views || 0).toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-muted-foreground">views totais</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button asChild variant="default" className="flex-1">
          <Link href={`/canais/${channel.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Ver canal
          </Link>
        </Button>
        <Button asChild variant="outline" size="icon">
          <Link href={`/canais/${channel.id}/configurar`}>
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
