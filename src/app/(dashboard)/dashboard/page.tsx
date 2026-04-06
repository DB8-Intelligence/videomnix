export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tv, Film, Eye, DollarSign, Plus, Zap } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  if (!profile) return null

  const { data: channels } = await supabase
    .from('channels')
    .select('*')
    .eq('user_id', profile.id)

  const { data: recentQueue } = await supabase
    .from('content_queue')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: performance } = await supabase
    .from('channel_performance')
    .select('*')
    .eq('user_id', profile.id)

  const totalChannels = channels?.length || 0
  const totalViews = performance?.reduce((sum, p) => sum + Number(p.total_views || 0), 0) || 0
  const totalRevenue = performance?.reduce((sum, p) => sum + Number(p.total_revenue_usd || 0), 0) || 0
  const thisMonthVideos = recentQueue?.filter((q) => {
    const created = new Date(q.created_at)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  }).length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/canais/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Canal
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Canais</CardTitle>
            <Tv className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChannels}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vídeos este mês</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonthVideos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Views Totais</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels Grid */}
      {channels && channels.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Canais Ativos</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel) => (
              <Card key={channel.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {channel.niche === 'ia_tech' ? '🤖' :
                       channel.niche === 'financas' ? '💰' :
                       channel.niche === 'curiosidades' ? '🧠' :
                       channel.niche === 'horror' ? '👻' :
                       channel.niche === 'motivacional' ? '⚡' : '📺'}
                    </span>
                    <div>
                      <Link href={`/canais/${channel.id}`} className="font-semibold hover:underline">
                        {channel.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">{channel.language}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Queue */}
      {recentQueue && recentQueue.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Fila Recente</h2>
          <div className="space-y-2">
            {recentQueue.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{item.title || item.topic}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className="text-sm capitalize text-muted-foreground">{item.status}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {totalChannels === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Crie seu primeiro canal</h3>
            <p className="mt-2 text-muted-foreground">
              Configure um canal YouTube automatizado em minutos.
            </p>
            <Button asChild className="mt-4">
              <Link href="/canais/novo">
                <Plus className="mr-2 h-4 w-4" />
                Criar Canal
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
