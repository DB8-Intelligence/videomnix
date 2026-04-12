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
    const { channel_id } = body

    const { data: channel } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channel_id)
      .single()

    if (!channel?.youtube_oauth) {
      return NextResponse.json({ error: 'YouTube not connected' }, { status: 400 })
    }

    // Garantir token válido (refresh se expirado)
    const oauth = await ensureValidToken(
      channel_id,
      channel.youtube_oauth as { access_token: string; refresh_token: string; expires_at: number }
    )

    // Get posted videos
    const { data: postedVideos } = await supabase
      .from('content_queue')
      .select('id, youtube_video_id')
      .eq('channel_id', channel_id)
      .eq('status', 'posted')
      .not('youtube_video_id', 'is', null)

    if (!postedVideos || postedVideos.length === 0) {
      return NextResponse.json({ synced: 0 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let synced = 0
    for (const video of postedVideos) {
      if (!video.youtube_video_id) continue

      // Fetch video statistics
      const statsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${video.youtube_video_id}`,
        { headers: { Authorization: `Bearer ${oauth.access_token}` } }
      )
      const statsData = await statsRes.json()
      const stats = statsData.items?.[0]?.statistics

      if (stats) {
        await supabase.from('video_metrics').upsert(
          {
            content_id: video.id,
            channel_id,
            user_id: profile.id,
            youtube_video_id: video.youtube_video_id,
            views: Number(stats.viewCount || 0),
            likes: Number(stats.likeCount || 0),
            comments: Number(stats.commentCount || 0),
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'content_id' }
        )
        synced++
      }
    }

    // Update channel aggregate stats
    const { data: allMetrics } = await supabase
      .from('video_metrics')
      .select('views, rpm')
      .eq('channel_id', channel_id)

    if (allMetrics && allMetrics.length > 0) {
      const totalViews = allMetrics.reduce((sum, m) => sum + Number(m.views), 0)
      const avgRpm = allMetrics.reduce((sum, m) => sum + Number(m.rpm), 0) / allMetrics.length

      await supabase
        .from('channels')
        .update({
          total_views: totalViews,
          rpm_avg: avgRpm,
          total_videos: postedVideos.length,
        })
        .eq('id', channel_id)
    }

    return NextResponse.json({ synced })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
