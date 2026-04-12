'use client'

import { useState } from 'react'
import { useChannels } from '@/hooks/useChannels'
import { useAnalytics } from '@/hooks/useAnalytics'
import { RPMChart } from '@/components/analytics/RPMChart'
import { ViewsChart } from '@/components/analytics/ViewsChart'
import { ChannelStatsCard } from '@/components/analytics/ChannelStatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Eye, DollarSign, TrendingUp } from 'lucide-react'

export function AnalyticsContent() {
  const { channels } = useChannels()
  const [selectedChannel, setSelectedChannel] = useState<string>('all')
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  const { metrics, loading, totalViews, avgRpm, totalRevenue } = useAnalytics(
    selectedChannel === 'all' ? undefined : selectedChannel,
    period
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Canal" />
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

          <div className="flex rounded-lg border">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <ChannelStatsCard
              title="Views Totais"
              value={totalViews.toLocaleString('pt-BR')}
              icon={<Eye className="h-4 w-4" />}
            />
            <ChannelStatsCard
              title="RPM Médio"
              value={`R$${avgRpm.toFixed(2)}`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <ChannelStatsCard
              title="Receita Estimada"
              value={`$${totalRevenue.toFixed(2)}`}
              icon={<DollarSign className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Views por dia</CardTitle>
              </CardHeader>
              <CardContent>
                <ViewsChart metrics={metrics} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>RPM por dia</CardTitle>
              </CardHeader>
              <CardContent>
                <RPMChart metrics={metrics} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
