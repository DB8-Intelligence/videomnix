import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateThumbnail } from '@/lib/db8-agent'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content_id, thumbnail_prompt, title, niche } = body

    const result = await generateThumbnail({ thumbnail_prompt, title, niche })

    // Update content queue
    if (content_id) {
      await supabase
        .from('content_queue')
        .update({
          thumbnail_url: result.thumbnail_url,
          status: 'shorting',
        })
        .eq('id', content_id)
    }

    return NextResponse.json({ thumbnail_url: result.thumbnail_url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
