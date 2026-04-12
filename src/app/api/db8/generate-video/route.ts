import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateVideo } from '@/lib/db8-agent'
import { rateLimitByUser } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { allowed } = rateLimitByUser(user.id, 'generate-video')
    if (!allowed) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde.' }, { status: 429 })
    }

    const body = await request.json()
    const { content_id, audio_url, niche, template_style, scene_descriptions } = body

    const res = await generateVideo({
      audio_url,
      niche,
      template_style,
      scene_descriptions,
    })

    // Get video data as buffer
    const videoBuffer = Buffer.from(await res.arrayBuffer())
    const fileName = `${content_id || crypto.randomUUID()}.mp4`

    const { data: uploadData } = await supabase.storage
      .from('channel-videos')
      .upload(fileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      })

    let video_url = ''
    if (uploadData) {
      const { data: urlData } = supabase.storage
        .from('channel-videos')
        .getPublicUrl(fileName)
      video_url = urlData.publicUrl
    }

    // Update content queue
    if (content_id) {
      await supabase
        .from('content_queue')
        .update({
          video_url,
          status: 'thumbnailing',
        })
        .eq('id', content_id)
    }

    return NextResponse.json({ video_url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
