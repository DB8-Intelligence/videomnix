'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { VideoMetrics } from '@/types/database'

interface RPMChartProps {
  metrics: VideoMetrics[]
}

export function RPMChart({ metrics }: RPMChartProps) {
  const dataByDate = metrics.reduce<Record<string, { date: string; rpm: number; count: number }>>(
    (acc, m) => {
      const date = new Date(m.synced_at).toLocaleDateString('pt-BR')
      if (!acc[date]) {
        acc[date] = { date, rpm: 0, count: 0 }
      }
      acc[date].rpm += Number(m.rpm)
      acc[date].count += 1
      return acc
    },
    {}
  )

  const data = Object.values(dataByDate)
    .map((d) => ({ ...d, rpm: Number((d.rpm / d.count).toFixed(2)) }))
    .reverse()

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Sem dados de RPM ainda.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => [`R$${Number(value).toFixed(2)}`, 'RPM']}
        />
        <Line
          type="monotone"
          dataKey="rpm"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
