import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchTrending } from '@/lib/db8-agent'
import { rateLimitByUser } from '@/lib/rate-limit'
import { canGenerateVideo } from '@/lib/plan-limits'

interface TriggerRouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: TriggerRouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const { allowed: rateLimitOk } = rateLimitByUser(user.id, 'trigger')
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde um momento.' },
        { status: 429 }
      )
    }

    // Plan limits
    const planCheck = await canGenerateVideo(user.id)
    if (!planCheck.allowed) {
      return NextResponse.json(
        { error: planCheck.reason, used: planCheck.used, limit: planCheck.limit },
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

    // Get channel and verify ownership
    const { data: channel } = await supabase
      .from('channels')
      .select('*')
      .eq('id', id)
      .eq('user_id', profile.id)
      .single()

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Fetch 1 trending topic
    const result = await fetchTrending(channel.niche, channel.language, 1)
    const topics = result.topics || result.trending || []
    const topic = topics[0]

    if (!topic) {
      return NextResponse.json({ error: 'No trending topics found' }, { status: 404 })
    }

    // Insert into content queue
    const { data: queueItem, error: insertError } = await supabase
      .from('content_queue')
      .insert({
        channel_id: id,
        user_id: profile.id,
        topic: topic.title || topic,
        source_type: topic.source_type || 'api',
        source_url: topic.source_url || null,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Trigger n8n webhook to start pipeline
    const n8nUrl = process.env.N8N_BASE_URL
    if (n8nUrl) {
      fetch(`${n8nUrl}/webhook/channel-pipeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-token': process.env.N8N_WEBHOOK_TOKEN || '',
        },
        body: JSON.stringify({
          content_id: queueItem.id,
          channel_id: id,
          topic: topic.title || topic,
          niche: channel.niche,
          language: channel.language,
          voice_id: channel.voice_id,
          template_style: channel.template_style,
        }),
      }).catch(() => {
        // n8n webhook fire-and-forget
      })
    }

    return NextResponse.json({
      queued: true,
      queue_id: queueItem.id,
      usage: { used: (planCheck.used || 0) + 1, limit: planCheck.limit },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
