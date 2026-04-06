import { Badge } from '@/components/ui/badge'
import type { ContentStatus } from '@/types/database'

const STATUS_CONFIG: Record<ContentStatus, { label: string; className: string }> = {
  pending: { label: 'Aguardando', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  fetching: { label: 'Buscando tema', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  scripting: { label: 'Gerando roteiro', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  voicing: { label: 'Gerando voz', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  rendering: { label: 'Renderizando', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  thumbnailing: { label: 'Gerando thumbnail', className: 'bg-pink-100 text-pink-700 border-pink-200' },
  shorting: { label: 'Gerando Shorts', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  ready: { label: 'Pronto', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  posted: { label: 'Publicado', className: 'bg-green-100 text-green-700 border-green-200' },
  failed: { label: 'Falhou', className: 'bg-red-100 text-red-700 border-red-200' },
}

interface VideoStatusBadgeProps {
  status: string
}

export function VideoStatusBadge({ status }: VideoStatusBadgeProps) {
  const config = STATUS_CONFIG[status as ContentStatus] || {
    label: status,
    className: 'bg-gray-100 text-gray-700',
  }

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
