import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const channelId = searchParams.get('state') || ''

  if (!code) {
    return NextResponse.redirect(new URL('/canais', request.url))
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.YOUTUBE_CLIENT_ID!,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
        redirect_uri: process.env.YOUTUBE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()

    if (!tokens.access_token) {
      return NextResponse.redirect(new URL('/canais', request.url))
    }

    // Get YouTube channel info
    const ytRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    )
    const ytData = await ytRes.json()
    const ytChannel = ytData.items?.[0]

    // Save to database
    if (channelId) {
      const supabase = await createClient()
      await supabase
        .from('channels')
        .update({
          youtube_channel_id: ytChannel?.id || null,
          youtube_oauth: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: Date.now() + tokens.expires_in * 1000,
          },
        })
        .eq('id', channelId)

      return NextResponse.redirect(
        new URL(`/canais/${channelId}/configurar`, request.url)
      )
    }

    return NextResponse.redirect(new URL('/canais', request.url))
  } catch {
    return NextResponse.redirect(new URL('/canais', request.url))
  }
}
