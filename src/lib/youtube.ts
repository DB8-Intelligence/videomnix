import { createServerClient } from '@supabase/ssr'

interface YouTubeOAuth {
  access_token: string
  refresh_token: string
  expires_at: number
}

/**
 * Garante que o access_token do YouTube está válido.
 * Se expirado, faz refresh via Google OAuth2 e salva no banco.
 */
export async function ensureValidToken(
  channelId: string,
  oauth: YouTubeOAuth
): Promise<YouTubeOAuth> {
  // Token ainda válido (com margem de 5min)
  if (oauth.expires_at > Date.now() + 5 * 60 * 1000) {
    return oauth
  }

  if (!oauth.refresh_token) {
    throw new Error('YouTube refresh_token ausente. Reconecte o canal.')
  }

  // Refresh token via Google
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      refresh_token: oauth.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Falha ao renovar token YouTube: ${error}`)
  }

  const tokens = await res.json()

  const updatedOAuth: YouTubeOAuth = {
    access_token: tokens.access_token,
    refresh_token: oauth.refresh_token, // Google nem sempre retorna novo refresh_token
    expires_at: Date.now() + (tokens.expires_in || 3600) * 1000,
  }

  // Salvar tokens atualizados no banco (service_role para bypass RLS)
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

  await supabase
    .from('channels')
    .update({ youtube_oauth: updatedOAuth })
    .eq('id', channelId)

  return updatedOAuth
}
