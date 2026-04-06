import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateVoice } from '@/lib/db8-agent'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content_id, script, voice_id, niche, language } = body

    const result = await generateVoice({ script, voice_id, niche, language })

    // If we get audio data, store it in Supabase Storage
    let audio_url = result.audio_url
    if (result.audio_b64) {
      const buffer = Buffer.from(result.audio_b64, 'base64')
      const fileName = `${content_id || crypto.randomUUID()}.mp3`
      const { data: uploadData } = await supabase.storage
        .from('channel-audio')
        .upload(fileName, buffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        })

      if (uploadData) {
        const { data: urlData } = supabase.storage
          .from('channel-audio')
          .getPublicUrl(fileName)
        audio_url = urlData.publicUrl
      }
    }

    // Update content queue
    if (content_id) {
      await supabase
        .from('content_queue')
        .update({
          audio_url,
          status: 'rendering',
        })
        .eq('id', content_id)
    }

    return NextResponse.json({ audio_url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
