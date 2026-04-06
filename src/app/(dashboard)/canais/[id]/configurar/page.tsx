'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { YouTubeConnect } from '@/components/channels/YouTubeConnect'
import { Loader2, Save, Pause, Play, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Channel } from '@/types/database'

export default function ConfigurarCanal() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [channel, setChannel] = useState<Channel | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [voiceId, setVoiceId] = useState('')
  const [videosPerWeek, setVideosPerWeek] = useState(4)

  useEffect(() => {
    const fetchChannel = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('channels')
        .select('*')
        .eq('id', id)
        .single()
      if (data) {
        setChannel(data)
        setName(data.name)
        setVoiceId(data.voice_id || '')
        setVideosPerWeek(data.videos_per_week)
      }
      setLoading(false)
    }
    fetchChannel()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('channels')
      .update({
        name,
        voice_id: voiceId || null,
        videos_per_week: videosPerWeek,
      })
      .eq('id', id)
    setSaving(false)
  }

  const handleToggleActive = async () => {
    if (!channel) return
    const supabase = createClient()
    const { data } = await supabase
      .from('channels')
      .update({ is_active: !channel.is_active })
      .eq('id', id)
      .select()
      .single()
    if (data) setChannel(data)
  }

  const handleDelete = async () => {
    if (deleteConfirm !== channel?.name) return
    const supabase = createClient()
    await supabase.from('channels').delete().eq('id', id)
    router.push('/canais')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!channel) return <p>Canal não encontrado.</p>

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Configurar Canal</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do canal</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="voice_id">Voice ID (ElevenLabs)</Label>
            <Input
              id="voice_id"
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              placeholder="Cole o Voice ID"
            />
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
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>YouTube</CardTitle>
        </CardHeader>
        <CardContent>
          <YouTubeConnect
            channelId={id}
            connected={!!channel.youtube_channel_id}
          />
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={handleToggleActive}
          >
            {channel.is_active ? (
              <><Pause className="mr-2 h-4 w-4" />Pausar Canal</>
            ) : (
              <><Play className="mr-2 h-4 w-4" />Ativar Canal</>
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Canal
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Digite o nome do canal ({channel.name}) para confirmar a exclusão.
                  Esta ação é irreversível.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={channel.name}
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleteConfirm !== channel.name}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
