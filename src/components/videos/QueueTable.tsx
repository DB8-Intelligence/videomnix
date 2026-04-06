'use client'

import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { VideoStatusBadge } from './VideoStatusBadge'
import { useContentQueue } from '@/hooks/useContentQueue'
import { Eye, RotateCw, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface QueueTableProps {
  channelId?: string
}

export function QueueTable({ channelId }: QueueTableProps) {
  const { queue, loading, retryFailed } = useContentQueue(channelId)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const perPage = 10

  const paged = queue.slice(page * perPage, (page + 1) * perPage)
  const totalPages = Math.ceil(queue.length / perPage)

  const handleRetry = async (id: string) => {
    setRetrying(id)
    try {
      await retryFailed(id)
    } finally {
      setRetrying(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (queue.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Nenhum vídeo na fila. Clique em &quot;Gerar vídeo agora&quot; para começar.
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tópico</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead>Publicado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="max-w-[300px] truncate font-medium">
                {item.title || item.topic}
              </TableCell>
              <TableCell>
                <VideoStatusBadge status={item.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(item.created_at).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {item.posted_at
                  ? new Date(item.posted_at).toLocaleDateString('pt-BR')
                  : '—'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/videos/${item.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  {item.status === 'failed' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRetry(item.id)}
                      disabled={retrying === item.id}
                    >
                      {retrying === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCw className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  )
}
