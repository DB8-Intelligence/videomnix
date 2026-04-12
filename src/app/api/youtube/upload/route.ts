import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureValidToken } from '@/lib/youtube'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content_id, channel_id } = body

    // Get channel OAuth tokens
    const { data: channel } = await supabase
      .from('channels')
      .select('youtube_oauth, posting_times')
      .eq('id', channel_id)
      .single()

    if (!channel?.youtube_oauth) {
      return NextResponse.json({ error: 'YouTube not connected' }, { status: 400 })
    }

    // Get content queue item
    const { data: content } = await supabase
      .from('content_queue')
      .select('*')
      .eq('id', content_id)
      .single()

    if (!content || !content.video_url) {
      return NextResponse.json({ error: 'Video not ready' }, { status: 400 })
    }

    // Garantir token válido (refresh se expirado)
    const oauth = await ensureValidToken(
      channel_id,
      channel.youtube_oauth as { access_token: string; refresh_token: string; expires_at: number }
    )

    // Download video from storage
    const videoRes = await fetch(content.video_url)
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer())

    // Calculate scheduled publish time
    const now = new Date()
    const postingTime = channel.posting_times?.[0] || '09:00'
    const [hours, minutes] = postingTime.split(':').map(Number)
    const scheduledAt = new Date(now)
    scheduledAt.setHours(hours, minutes, 0, 0)
    if (scheduledAt <= now) {
      scheduledAt.setDate(scheduledAt.getDate() + 1)
    }

    // Initialize resumable upload
    const initRes = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${oauth.access_token}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': 'video/mp4',
          'X-Upload-Content-Length': String(videoBuffer.length),
        },
        body: JSON.stringify({
          snippet: {
            title: content.title || content.topic,
            description: content.description || '',
            tags: content.tags || [],
          },
          status: {
            privacyStatus: 'public',
            publishAt: scheduledAt.toISOString(),
            selfDeclaredMadeForKids: false,
          },
        }),
      }
    )

    const uploadUrl = initRes.headers.get('Location')
    if (!uploadUrl) {
      return NextResponse.json({ error: 'Failed to init upload' }, { status: 500 })
    }

    // Upload video
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(videoBuffer.length),
      },
      body: videoBuffer,
    })

    const uploadData = await uploadRes.json()
    const youtubeVideoId = uploadData.id

    // Update content queue
    await supabase
      .from('content_queue')
      .update({
        youtube_video_id: youtubeVideoId,
        scheduled_at: scheduledAt.toISOString(),
        posted_at: new Date().toISOString(),
        status: 'posted',
      })
      .eq('id', content_id)

    // Upload thumbnail if available
    if (content.thumbnail_url) {
      const thumbRes = await fetch(content.thumbnail_url)
      const thumbBuffer = Buffer.from(await thumbRes.arrayBuffer())

      await fetch(
        `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${youtubeVideoId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${oauth.access_token}`,
            'Content-Type': 'image/png',
          },
          body: thumbBuffer,
        }
      )
    }

    return NextResponse.json({ youtube_video_id: youtubeVideoId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
