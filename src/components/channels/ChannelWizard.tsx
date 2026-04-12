'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NicheSelector } from './NicheSelector'
import { VoiceSelector } from './VoiceSelector'
import { YouTubeConnect } from './YouTubeConnect'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { NICHES, type NicheKey } from '@/lib/niche-config'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const STEPS = [
  { title: 'Nicho', description: 'Escolha o nicho do canal' },
  { title: 'Idioma & Frequência', description: 'Configure idioma e postagens' },
  { title: 'Voz', description: 'Configure a voz do canal' },
  { title: 'YouTube', description: 'Conecte seu canal' },
]

const POSTING_TIMES = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
]

export function ChannelWizard() {
  const router = useRouter()
  const { profile } = useAuth()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 1 - Niche
  const [name, setName] = useState('')
  const [niche, setNiche] = useState<NicheKey | null>(null)

  // Step 2 - Language & Frequency
  const [language, setLanguage] = useState<'pt-BR' | 'en-US'>('pt-BR')
  const [videosPerWeek, setVideosPerWeek] = useState(4)
  const [postingTimes, setPostingTimes] = useState<string[]>(['09:00', '18:00'])

  // Step 3 - Voice
  const [voiceId, setVoiceId] = useState('')

  const canAdvance = () => {
    switch (step) {
      case 0: return !!niche && !!name.trim()
      case 1: return postingTimes.length > 0
      case 2: return true
      case 3: return true
      default: return false
    }
  }

  const handleFinish = async () => {
    if (!profile || !niche) return
    setSaving(true)

    const supabase = createClient()
    const nicheConfig = NICHES[niche]

    const { data, error } = await supabase
      .from('channels')
      .insert({
        user_id: profile.id,
        name: name.trim(),
        niche,
        language,
        videos_per_week: videosPerWeek,
        posting_times: postingTimes,
        voice_id: voiceId || null,
        template_style: nicheConfig.template_style,
      })
      .select()
      .single()

    if (error) {
      toast.error('Erro ao criar canal', { description: error.message })
      setSaving(false)
      return
    }

    // Mark onboarding as done
    await supabase
      .from('users')
      .update({ onboarding_done: true })
      .eq('id', profile.id)

    toast.success('Canal criado!', { description: `${name} está pronto para produzir vídeos.` })
    router.push(`/canais/${data.id}`)
  }

  const togglePostingTime = (time: string) => {
    setPostingTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                i <= step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-8 transition-colors',
                  i < step ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold">{STEPS[step].title}</h2>
        <p className="text-muted-foreground">{STEPS[step].description}</p>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 0 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Nome do canal</Label>
              <Input
                id="channel-name"
                placeholder="Ex: Tech AI Brasil"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <NicheSelector selected={niche} onSelect={setNiche} language={language} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Idioma do canal</Label>
              <div className="flex gap-2">
                {(['pt-BR', 'en-US'] as const).map((lang) => (
                  <Button
                    key={lang}
                    variant={language === lang ? 'default' : 'outline'}
                    onClick={() => setLanguage(lang)}
                  >
                    {lang === 'pt-BR' ? '🇧🇷 Português (BR)' : '🇺🇸 English (US)'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vídeos por semana: {videosPerWeek}</Label>
              <input
                type="range"
                min={1}
                max={7}
                value={videosPerWeek}
                onChange={(e) => setVideosPerWeek(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>7</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Horários de postagem</Label>
              <div className="flex flex-wrap gap-2">
                {POSTING_TIMES.map((time) => (
                  <Button
                    key={time}
                    size="sm"
                    variant={postingTimes.includes(time) ? 'default' : 'outline'}
                    onClick={() => togglePostingTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <VoiceSelector
            voiceId={voiceId}
            onVoiceIdChange={setVoiceId}
            niche={niche || 'ia_tech'}
            language={language}
          />
        )}

        {step === 3 && (
          <YouTubeConnect connected={false} />
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
            Próximo
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={saving || !canAdvance()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Canal
          </Button>
        )}
      </div>
    </div>
  )
}
