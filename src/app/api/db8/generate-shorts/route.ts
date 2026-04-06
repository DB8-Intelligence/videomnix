import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateShorts } from '@/lib/db8-agent'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content_id, video_url, script, max_shorts } = body

    const result = await generateShorts({ video_url, script, max_shorts })

    // Upload shorts to storage
    const shorts_urls: string[] = []
    const shorts = result.shorts || []
    for (let i = 0; i < shorts.length; i++) {
      const short = shorts[i]
      if (short.video_b64) {
        const buffer = Buffer.from(short.video_b64, 'base64')
        const fileName = `${content_id}-short-${i}.mp4`
        const { data: uploadData } = await supabase.storage
          .from('channel-shorts')
          .upload(fileName, buffer, {
            contentType: 'video/mp4',
            upsert: true,
          })

        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('channel-shorts')
            .getPublicUrl(fileName)
          shorts_urls.push(urlData.publicUrl)
        }
      } else if (short.url) {
        shorts_urls.push(short.url)
      }
    }

    // Update content queue
    if (content_id) {
      await supabase
        .from('content_queue')
        .update({
          shorts_urls,
          status: 'ready',
        })
        .eq('id', content_id)
    }

    return NextResponse.json({ shorts_urls })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
