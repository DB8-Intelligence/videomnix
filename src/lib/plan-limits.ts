import { createClient } from '@/lib/supabase/server'

interface PlanLimits {
  channels_limit: number
  videos_per_month: number
  plan: string
  trialExpired: boolean
}

/**
 * Verifica limites do plano do usuário.
 * Retorna null se o usuário não for encontrado.
 */
export async function getUserPlanLimits(authId: string): Promise<PlanLimits | null> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('id, plan, channels_limit, videos_per_month, trial_ends_at')
    .eq('auth_id', authId)
    .single()

  if (!profile) return null

  const trialExpired =
    profile.plan === 'trial' &&
    profile.trial_ends_at &&
    new Date(profile.trial_ends_at) < new Date()

  return {
    channels_limit: profile.channels_limit,
    videos_per_month: profile.videos_per_month,
    plan: profile.plan,
    trialExpired: !!trialExpired,
  }
}

/**
 * Verifica se o usuário pode criar mais canais.
 */
export async function canCreateChannel(authId: string): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('id, plan, channels_limit, trial_ends_at')
    .eq('auth_id', authId)
    .single()

  if (!profile) return { allowed: false, reason: 'Perfil não encontrado' }

  // Verificar trial expirado
  if (
    profile.plan === 'trial' &&
    profile.trial_ends_at &&
    new Date(profile.trial_ends_at) < new Date()
  ) {
    return { allowed: false, reason: 'Período de teste expirado. Faça upgrade para continuar.' }
  }

  // Contar canais existentes
  const { count } = await supabase
    .from('channels')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)

  if ((count || 0) >= profile.channels_limit) {
    return {
      allowed: false,
      reason: `Limite de ${profile.channels_limit} canais atingido. Faça upgrade para criar mais.`,
    }
  }

  return { allowed: true }
}

/**
 * Verifica se o usuário pode gerar mais vídeos este mês.
 */
export async function canGenerateVideo(authId: string): Promise<{ allowed: boolean; reason?: string; used?: number; limit?: number }> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('id, plan, videos_per_month, trial_ends_at')
    .eq('auth_id', authId)
    .single()

  if (!profile) return { allowed: false, reason: 'Perfil não encontrado' }

  // Verificar trial expirado
  if (
    profile.plan === 'trial' &&
    profile.trial_ends_at &&
    new Date(profile.trial_ends_at) < new Date()
  ) {
    return { allowed: false, reason: 'Período de teste expirado. Faça upgrade para continuar.' }
  }

  // Contar vídeos gerados este mês
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { count } = await supabase
    .from('content_queue')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .gte('created_at', startOfMonth)

  const used = count || 0

  if (used >= profile.videos_per_month) {
    return {
      allowed: false,
      reason: `Limite de ${profile.videos_per_month} vídeos/mês atingido. Faça upgrade para gerar mais.`,
      used,
      limit: profile.videos_per_month,
    }
  }

  return { allowed: true, used, limit: profile.videos_per_month }
}
