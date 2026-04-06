import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchTrending } from '@/lib/db8-agent'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const inserts = topics.map((topic: { title: string; source_url?: string; source_type?: string }) => ({
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

    return NextResponse.json({ queued: inserts.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
