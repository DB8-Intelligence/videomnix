'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { VideoMetrics } from '@/types/database'

interface ViewsChartProps {
  metrics: VideoMetrics[]
}

export function ViewsChart({ metrics }: ViewsChartProps) {
  const dataByDate = metrics.reduce<Record<string, { date: string; views: number }>>(
    (acc, m) => {
      const date = new Date(m.synced_at).toLocaleDateString('pt-BR')
      if (!acc[date]) {
        acc[date] = { date, views: 0 }
      }
      acc[date].views += Number(m.views)
      return acc
    },
    {}
  )

  const data = Object.values(dataByDate).reverse()

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Sem dados de views ainda.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => [Number(value).toLocaleString('pt-BR'), 'Views']}
        />
        <Area
          type="monotone"
          dataKey="views"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary) / 0.1)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
