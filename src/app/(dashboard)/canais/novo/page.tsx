export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChannelWizard } from '@/components/channels/ChannelWizard'
import { canCreateChannel } from '@/lib/plan-limits'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Crown } from 'lucide-react'
import Link from 'next/link'

export default async function NovoCanal() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const check = await canCreateChannel(user.id)

  if (!check.allowed) {
    return (
      <div className="mx-auto max-w-xl space-y-6 py-12">
        <h1 className="text-3xl font-bold">Criar Novo Canal</h1>
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <Crown className="h-12 w-12 text-yellow-600" />
            <h2 className="text-xl font-semibold">{check.reason}</h2>
            <p className="text-sm text-muted-foreground">
              Atualize seu plano para desbloquear mais canais e funcionalidades.
            </p>
            <Button asChild>
              <Link href="/configuracoes">Ver planos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Criar Novo Canal</h1>
      <ChannelWizard />
    </div>
  )
}
