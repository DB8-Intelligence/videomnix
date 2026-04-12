import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchTrending } from '@/lib/db8-agent'
import { rateLimitByUser } from '@/lib/rate-limit'
import { canGenerateVideo } from '@/lib/plan-limits'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const { allowed: rateLimitOk } = rateLimitByUser(user.id, 'fetch-trending')
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde um momento.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { channel_id } = body

    // Get channel info
    const { data: channel } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channel_id)
      .single()

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Plan limits check
    const planCheck = await canGenerateVideo(user.id)
    if (!planCheck.allowed) {
      return NextResponse.json(
        { error: planCheck.reason },
        { status: 403 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const result = await fetchTrending(channel.niche, channel.language)

    // Insert trending topics into content queue
    const topics = result.topics || result.trending || []

    // Limitar pela quantidade de vídeos restantes no plano
    const remaining = (planCheck.limit || 30) - (planCheck.used || 0)
    const limitedTopics = topics.slice(0, Math.min(topics.length, remaining))

    const inserts = limitedTopics.map((topic: { title: string; source_url?: string; source_type?: string }) => ({
      channel_id,
      user_id: profile.id,
      topic: topic.title,
      source_url: topic.source_url || null,
      source_type: topic.source_type || 'api',
      status: 'pending' as const,
    }))

    if (inserts.length > 0) {
      await supabase.from('content_queue').insert(inserts)
    }

    return NextResponse.json({
      queued: inserts.length,
      total_available: topics.length,
      limited_by_plan: topics.length > limitedTopics.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
