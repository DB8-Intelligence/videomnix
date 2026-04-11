import { SupabaseClient } from '@supabase/supabase-js'

interface YouTubeOAuth {
  access_token: string
  refresh_token: string
  expires_at?: number
}

/**
 * Refreshes YouTube OAuth token if expired or about to expire.
 * Updates the channel record with new token.
 * Returns a valid access token.
 */
export async function getValidAccessToken(
  supabase: SupabaseClient,
  channelId: string,
  oauth: YouTubeOAuth
): Promise<string> {
  // If token hasn't expired yet (with 5-minute buffer), return it
  if (oauth.expires_at && oauth.expires_at > Date.now() + 5 * 60 * 1000) {
    return oauth.access_token
  }

  // Token is expired or no expiry info — try refresh
  if (!oauth.refresh_token) {
    throw new Error('No refresh token available. User needs to reconnect YouTube.')
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      refresh_token: oauth.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!tokenRes.ok) {
    const errorData = await tokenRes.text()
    console.error('YouTube token refresh failed:', errorData)
    throw new Error('Failed to refresh YouTube token. User may need to reconnect.')
  }

  const tokenData = await tokenRes.json()
  const newAccessToken = tokenData.access_token
  const expiresIn = tokenData.expires_in || 3600
  const expiresAt = Date.now() + expiresIn * 1000

  // Save refreshed token back to channel
  await supabase
    .from('channels')
    .update({
      youtube_oauth: {
        access_token: newAccessToken,
        refresh_token: oauth.refresh_token,
        expires_at: expiresAt,
      },
    })
    .eq('id', channelId)

  return newAccessToken
}
