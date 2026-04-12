'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Save, Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { User } from '@/types/database'

const TIMEZONES = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Belem',
  'America/Fortaleza',
  'America/Recife',
  'America/Bahia',
  'America/Cuiaba',
  'America/Porto_Velho',
  'America/Rio_Branco',
  'America/Noronha',
]

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  trial: { label: 'Trial (14 dias)', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  starter: { label: 'Starter', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  pro: { label: 'Pro', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  enterprise: { label: 'Enterprise', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
}

interface ConfiguracoesContentProps {
  profile: User
}

export function ConfiguracoesContent({ profile }: ConfiguracoesContentProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState(profile.name || '')
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp || '')
  const [timezone, setTimezone] = useState(profile.timezone || 'America/Sao_Paulo')

  const planInfo = PLAN_LABELS[profile.plan] || PLAN_LABELS.trial

  const trialEndsAt = profile.trial_ends_at
    ? new Date(profile.trial_ends_at)
    : null
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const handleSave = async () => {
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({
        name: name.trim() || null,
        whatsapp: whatsapp.trim() || null,
        timezone,
      })
      .eq('id', profile.id)

    setSaving(false)

    if (error) {
      toast.error('Erro ao salvar', { description: error.message })
    } else {
      toast.success('Perfil atualizado!')
      router.refresh()
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>

      {/* Plano */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Plano
          </CardTitle>
          <CardDescription>
            Seu plano atual e limites de uso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className={planInfo.color}>{planInfo.label}</Badge>
            {profile.plan === 'trial' && trialDaysLeft > 0 && (
              <span className="text-sm text-muted-foreground">
                {trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''} restante{trialDaysLeft !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-bold">{profile.channels_limit}</p>
              <p className="text-xs text-muted-foreground">Canais permitidos</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-bold">{profile.videos_per_month}</p>
              <p className="text-xs text-muted-foreground">Vídeos/mês</p>
            </div>
          </div>

          {profile.plan === 'trial' && (
            <p className="text-sm text-muted-foreground">
              Faça upgrade para desbloquear mais canais e vídeos por mês.
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Perfil */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>
            Informações da sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email não pode ser alterado.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+55 11 99999-9999"
            />
            <p className="text-xs text-muted-foreground">
              Opcional. Usado para notificações de status.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Fuso horário</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz.replace('America/', '').replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar alterações
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
