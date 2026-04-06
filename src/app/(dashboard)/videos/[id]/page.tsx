export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import { RetryButtonWrapper } from './retry-wrapper'

interface VideoDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: video } = await supabase
    .from('content_queue')
    .select('*')
    .eq('id', id)
    .single()

  if (!video) notFound()

  const { data: metrics } = await supabase
    .from('video_metrics')
    .select('*')
    .eq('content_id', id)
    .single()

  const statusSteps = [
    'pending', 'fetching', 'scripting', 'voicing',
    'rendering', 'thumbnailing', 'shorting', 'ready', 'posted'
  ]
  const currentStepIndex = statusSteps.indexOf(video.status)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{video.title || video.topic}</h1>
          <p className="text-muted-foreground">
            Criado em {new Date(video.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <Badge className="text-sm capitalize">{video.status}</Badge>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1">
            {statusSteps.map((step, i) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full ${
                  i <= currentStepIndex
                    ? video.status === 'failed'
                      ? 'bg-destructive'
                      : 'bg-primary'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Pendente</span>
            <span>Publicado</span>
          </div>
        </CardContent>
      </Card>

      {/* Script */}
      {video.script && (
        <Card>
          <CardHeader>
            <CardTitle>Roteiro</CardTitle>
          </CardHeader>
          <CardContent>
            <details>
              <summary className="cursor-pointer text-sm text-muted-foreground">
                Clique para expandir
              </summary>
              <p className="mt-4 whitespace-pre-wrap text-sm">{video.script}</p>
            </details>
          </CardContent>
        </Card>
      )}

      {/* Thumbnail */}
      {video.thumbnail_url && (
        <Card>
          <CardHeader>
            <CardTitle>Thumbnail</CardTitle>
          </CardHeader>
          <CardContent>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={video.thumbnail_url}
              alt="Thumbnail"
              className="rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* YouTube Links */}
      {video.youtube_video_id && (
        <Card>
          <CardHeader>
            <CardTitle>YouTube</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline">
              <a
                href={`https://youtube.com/watch?v=${video.youtube_video_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver no YouTube
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Métricas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-2xl font-bold">{Number(metrics.views).toLocaleString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground">Views</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.likes}</p>
                <p className="text-xs text-muted-foreground">Likes</p>
              </div>
              <div>
                <p className="text-2xl font-bold">R${Number(metrics.rpm).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">RPM</p>
              </div>
              <div>
                <p className="text-2xl font-bold">${Number(metrics.revenue_usd).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Receita</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Retry */}
      {video.status === 'failed' && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-destructive">Erro na produção</p>
              {video.error_log && (
                <p className="text-sm text-muted-foreground">{video.error_log}</p>
              )}
            </div>
            <RetryButtonWrapper contentId={id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
