import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateScript } from '@/lib/db8-agent'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content_id, topic, niche, language, source_content, target_minutes } = body

    // Update status
    if (content_id) {
      await supabase
        .from('content_queue')
        .update({ status: 'scripting' })
        .eq('id', content_id)
    }

    const result = await generateScript({
      topic,
      niche,
      language,
      source_content,
      target_minutes,
    })

    // Update content queue with script data
    if (content_id) {
      await supabase
        .from('content_queue')
        .update({
          script: result.script,
          title: result.title,
          title_variants: result.title_variants,
          description: result.description,
          tags: result.tags,
          thumbnail_prompt: result.thumbnail_prompt,
          scene_descriptions: result.scene_descriptions,
          shorts_hooks: result.shorts_hooks,
          status: 'voicing',
          tokens_used: result.tokens_used || 0,
        })
        .eq('id', content_id)
    }

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
