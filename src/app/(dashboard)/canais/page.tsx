export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { ChannelCard } from '@/components/channels/ChannelCard'

export default async function CanaisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (!profile) return null

  const { data: channels } = await supabase
    .from('channels')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meus Canais</h1>
        <Button asChild>
          <Link href="/canais/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Canal
          </Link>
        </Button>
      </div>

      {channels && channels.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl">📺</span>
          <h2 className="mt-4 text-xl font-semibold">Nenhum canal criado</h2>
          <p className="mt-2 text-muted-foreground">
            Crie seu primeiro canal para começar a produzir vídeos automaticamente.
          </p>
          <Button asChild className="mt-4">
            <Link href="/canais/novo">
              <Plus className="mr-2 h-4 w-4" />
              Criar Canal
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
