'use client'

import { useState } from 'react'
import { QueueTable } from '@/components/videos/QueueTable'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useChannels } from '@/hooks/useChannels'

export function VideosContent() {
  const { channels } = useChannels()
  const [selectedChannel, setSelectedChannel] = useState<string>('all')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fila de Produção</h1>
        <Select value={selectedChannel} onValueChange={setSelectedChannel}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os canais</SelectItem>
            {channels.map((channel) => (
              <SelectItem key={channel.id} value={channel.id}>
                {channel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QueueTable channelId={selectedChannel === 'all' ? undefined : selectedChannel} />
    </div>
  )
}
