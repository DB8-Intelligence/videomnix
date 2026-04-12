'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface TriggerButtonProps {
  channelId: string
  onTriggered?: () => void
}

export function TriggerButton({ channelId, onTriggered }: TriggerButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleTrigger = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/channels/${channelId}/trigger`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error('Erro ao gerar vídeo', { description: data.error })
        return
      }

      toast.success('Vídeo adicionado à fila!', {
        description: 'O pipeline de produção foi iniciado.',
      })
      onTriggered?.()
    } catch {
      toast.error('Falha na conexão com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleTrigger} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Zap className="mr-2 h-4 w-4" />
      )}
      Gerar vídeo agora
    </Button>
  )
}
