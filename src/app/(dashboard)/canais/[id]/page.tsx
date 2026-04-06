export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import Link from 'next/link'
import { NICHES, type NicheKey } from '@/lib/niche-config'
import { QueueTableWrapper } from './queue-wrapper'
import { MetricsWrapper } from './metrics-wrapper'

interface ChannelDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ChannelDetailPage({ params }: ChannelDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: channel } = await supabase
    .from('channels')
    .select('*')
    .eq('id', id)
    .single()

  if (!channel) notFound()

  const niche = NICHES[channel.niche as NicheKey]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{niche?.emoji || '📺'}</span>
          <div>
            <h1 className="text-3xl font-bold">{channel.name}</h1>
            <div className="mt-1 flex gap-2">
              <Badge>{channel.language}</Badge>
              <Badge variant={channel.is_active ? 'default' : 'outline'}>
                {channel.is_active ? 'Ativo' : 'Pausado'}
              </Badge>
              <Badge variant="secondary">{niche?.label || channel.niche}</Badge>
            </div>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/canais/${id}/configurar`}>
            <Settings className="mr-2 h-4 w-4" />
            Configurar
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="fila">
        <TabsList>
          <TabsTrigger value="fila">Fila de Produção</TabsTrigger>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="fila" className="mt-4">
          <QueueTableWrapper channelId={id} />
        </TabsContent>

        <TabsContent value="metricas" className="mt-4">
          <MetricsWrapper channelId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
