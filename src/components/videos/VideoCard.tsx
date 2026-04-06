import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { VideoStatusBadge } from './VideoStatusBadge'
import type { ContentQueue } from '@/types/database'

interface VideoCardProps {
  video: ContentQueue
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Link href={`/videos/${video.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="flex items-center gap-4 py-3">
          {video.thumbnail_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={video.thumbnail_url}
              alt={video.title || video.topic}
              className="h-16 w-28 rounded object-cover"
            />
          ) : (
            <div className="flex h-16 w-28 items-center justify-center rounded bg-muted text-2xl">
              🎬
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium">
              {video.title || video.topic}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(video.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <VideoStatusBadge status={video.status} />
        </CardContent>
      </Card>
    </Link>
  )
}
