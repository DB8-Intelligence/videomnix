'use client'

import { useAnalytics } from '@/hooks/useAnalytics'
import { RPMChart } from '@/components/analytics/RPMChart'
import { ViewsChart } from '@/components/analytics/ViewsChart'
import { ChannelStatsCard } from '@/components/analytics/ChannelStatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface MetricsWrapperProps {
  channelId: string
}

export function MetricsWrapper({ channelId }: MetricsWrapperProps) {
  const { metrics, loading, totalViews, avgRpm, totalRevenue } =
    useAnalytics(channelId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <ChannelStatsCard
          title="Views Totais"
          value={totalViews.toLocaleString('pt-BR')}
        />
        <ChannelStatsCard
          title="RPM Médio"
          value={`R$${avgRpm.toFixed(2)}`}
        />
        <ChannelStatsCard
          title="Receita Total"
          value={`$${totalRevenue.toFixed(2)}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>RPM (últimos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <RPMChart metrics={metrics} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Views (acumulado)</CardTitle>
        </CardHeader>
        <CardContent>
          <ViewsChart metrics={metrics} />
        </CardContent>
      </Card>
    </div>
  )
}
