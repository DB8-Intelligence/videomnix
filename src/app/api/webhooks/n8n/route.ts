import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    // Validate webhook token
    const token = request.headers.get('x-webhook-token')
    if (token !== process.env.N8N_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { event, content_id, data } = body

    // Use service role for webhooks (no user auth)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    )

    switch (event) {
      case 'video_ready': {
        await supabase
          .from('content_queue')
          .update({
            status: 'ready',
            video_url: data?.video_url,
          })
          .eq('id', content_id)

        // Auto-trigger YouTube upload
        const { data: content } = await supabase
          .from('content_queue')
          .select('channel_id')
          .eq('id', content_id)
          .single()

        if (content) {
          // Trigger upload via internal API
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          await fetch(`${appUrl}/api/youtube/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content_id,
              channel_id: content.channel_id,
            }),
          })
        }
        break
      }

      case 'video_failed': {
        await supabase
          .from('content_queue')
          .update({
            status: 'failed',
            error_log: data?.error || 'Unknown error from n8n',
            retry_count: data?.retry_count || 0,
          })
          .eq('id', content_id)
        break
      }

      case 'shorts_ready': {
        await supabase
          .from('content_queue')
          .update({
            shorts_urls: data?.shorts_urls || [],
            status: 'ready',
          })
          .eq('id', content_id)
        break
      }

      case 'analytics_synced': {
        // Analytics data sync handled
        break
      }

      default:
        return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
