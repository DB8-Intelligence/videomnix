'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Play, Loader2 } from 'lucide-react'

interface VoiceSelectorProps {
  voiceId: string
  onVoiceIdChange: (id: string) => void
  niche: string
  language: string
}

export function VoiceSelector({
  voiceId,
  onVoiceIdChange,
  niche,
  language,
}: VoiceSelectorProps) {
  const [testing, setTesting] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const handleTest = async () => {
    if (!voiceId) return
    setTesting(true)
    setAudioUrl(null)
    try {
      const res = await fetch('/api/db8/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: language === 'pt-BR'
            ? 'Olá! Este é um teste de voz para o seu canal no Videomnix.'
            : 'Hello! This is a voice test for your Videomnix channel.',
          voice_id: voiceId,
          niche,
          language,
        }),
      })
      const data = await res.json()
      if (data.audio_url) setAudioUrl(data.audio_url)
    } catch {
      // Voice test failed
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="voice_id">ElevenLabs Voice ID</Label>
        <div className="flex gap-2">
          <Input
            id="voice_id"
            placeholder="Cole o Voice ID do ElevenLabs"
            value={voiceId}
            onChange={(e) => onVoiceIdChange(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={!voiceId || testing}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Testar
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Acesse elevenlabs.io para encontrar ou criar vozes.
        </p>
      </div>

      {audioUrl && (
        <div className="rounded-lg border p-4">
          <p className="mb-2 text-sm font-medium">Preview da voz:</p>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
    </div>
  )
}
