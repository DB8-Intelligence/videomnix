// src/lib/plans.ts
// Feature gate unificado — Três motores: Dark + UGC + Social
// Usar em TODAS as API Routes antes de processar qualquer operação

import { createClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────

export type PlanType = 'trial' | 'starter' | 'pro' | 'enterprise' | 'blocked'
export type PlanStatus = 'active' | 'trial' | 'canceled' | 'past_due' | 'blocked'

export type DarkFeature =
  | 'create_channel'
  | 'trigger_pipeline'
  | 'fetch_trending'
  | 'generate_shorts'

export type UGCFeature =
  | 'train_avatar'
  | 'generate_ugc_video'
  | 'clone_voice'
  | 'publish_instagram'
  | 'publish_tiktok'

export type SocialFeature =
  | 'crm'
  | 'inbox'
  | 'competitors'
  | 'analytics'
  | 'content_templates'

export interface PlanLimits {
  plan:              PlanType
  status:            PlanStatus
  trialExpired:      boolean
  trialEndsAt:       string | null

  // Motor Dark
  channelsLimit:     number
  videosPerMonth:    number
  darkEnabled:       boolean

  // Motor UGC
  ugcEnabled:        boolean
  avatarsLimit:      number
  ugcVideosPerMonth: number

  // Motor Social
  socialEnabled:     boolean
  brandsLimit:       number
  activeDealsLimit:  number
  competitorsLimit:  number
  inboxEnabled:      boolean
  analyticsEnabled:  boolean
  templatesEnabled:  boolean
}

// ─────────────────────────────────────────
// MATRIZ DE PLANOS
// ─────────────────────────────────────────

const PLAN_MATRIX: Record<PlanType, Omit<PlanLimits, 'plan' | 'status' | 'trialExpired' | 'trialEndsAt'>> = {
  trial: {
    darkEnabled:       true,
    channelsLimit:     1,
    videosPerMonth:    5,
    ugcEnabled:        false,
    avatarsLimit:      0,
    ugcVideosPerMonth: 0,
    socialEnabled:     true,
    brandsLimit:       3,
    activeDealsLimit:  2,
    competitorsLimit:  0,
    inboxEnabled:      false,
    analyticsEnabled:  false,
    templatesEnabled:  false,
  },
  starter: {
    darkEnabled:       true,
    channelsLimit:     2,
    videosPerMonth:    30,
    ugcEnabled:        false,
    avatarsLimit:      0,
    ugcVideosPerMonth: 0,
    socialEnabled:     true,
    brandsLimit:       10,
    activeDealsLimit:  5,
    competitorsLimit:  0,
    inboxEnabled:      false,
    analyticsEnabled:  false,
    templatesEnabled:  true,
  },
  pro: {
    darkEnabled:       true,
    channelsLimit:     5,
    videosPerMonth:    100,
    ugcEnabled:        true,
    avatarsLimit:      1,
    ugcVideosPerMonth: 60,
    socialEnabled:     true,
    brandsLimit:       -1,
    activeDealsLimit:  -1,
    competitorsLimit:  5,
    inboxEnabled:      true,
    analyticsEnabled:  true,
    templatesEnabled:  true,
  },
  enterprise: {
    darkEnabled:       true,
    channelsLimit:     -1,
    videosPerMonth:    -1,
    ugcEnabled:        true,
    avatarsLimit:      -1,
    ugcVideosPerMonth: -1,
    socialEnabled:     true,
    brandsLimit:       -1,
    activeDealsLimit:  -1,
    competitorsLimit:  -1,
    inboxEnabled:      true,
    analyticsEnabled:  true,
    templatesEnabled:  true,
  },
  blocked: {
    darkEnabled:       false,
    channelsLimit:     0,
    videosPerMonth:    0,
    ugcEnabled:        false,
    avatarsLimit:      0,
    ugcVideosPerMonth: 0,
    socialEnabled:     false,
    brandsLimit:       0,
    activeDealsLimit:  0,
    competitorsLimit:  0,
    inboxEnabled:      false,
    analyticsEnabled:  false,
    templatesEnabled:  false,
  },
}

// ─────────────────────────────────────────
// BUSCAR LIMITES DO USUÁRIO AUTENTICADO
// ─────────────────────────────────────────

export async function getUserPlanLimits(authId: string): Promise<PlanLimits | null> {
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .single()

  if (!user) return null

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_type, status, trial_ends_at')
    .eq('user_id', user.id)
    .single()

  if (!sub) return null

  const plan = sub.plan_type as PlanType
  const status = sub.status as PlanStatus
  const trialExpired =
    status === 'trial' &&
    sub.trial_ends_at != null &&
    new Date(sub.trial_ends_at) < new Date()

  return {
    plan,
    status,
    trialExpired,
    trialEndsAt: sub.trial_ends_at,
    ...PLAN_MATRIX[trialExpired ? 'blocked' : plan],
  }
}

// ─────────────────────────────────────────
// CHECAGENS — Motor Dark
// ─────────────────────────────────────────

export async function canCreateChannel(authId: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  const limits = await getUserPlanLimits(authId)
  if (!limits) return { allowed: false, reason: 'Usuário não encontrado' }
  if (!limits.darkEnabled) return { allowed: false, reason: 'Motor Dark não incluso no seu plano' }
  if (limits.trialExpired) return { allowed: false, reason: 'Trial expirado — faça upgrade para continuar' }

  if (limits.channelsLimit === -1) return { allowed: true }

  const supabase = await createClient()
  const { data: user } = await supabase.from('users').select('id').eq('auth_id', authId).single()
  if (!user) return { allowed: false, reason: 'Usuário não encontrado' }

  const { count } = await supabase
    .from('channels')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= limits.channelsLimit)
    return { allowed: false, reason: `Limite de ${limits.channelsLimit} canais atingido — faça upgrade` }

  return { allowed: true }
}

export async function canTriggerPipeline(authId: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  const limits = await getUserPlanLimits(authId)
  if (!limits) return { allowed: false, reason: 'Usuário não encontrado' }
  if (!limits.darkEnabled) return { allowed: false, reason: 'Motor Dark não incluso no seu plano' }
  if (limits.trialExpired) return { allowed: false, reason: 'Trial expirado' }
  if (limits.videosPerMonth === -1) return { allowed: true }

  const supabase = await createClient()
  const { data: user } = await supabase.from('users').select('id').eq('auth_id', authId).single()
  if (!user) return { allowed: false, reason: 'Usuário não encontrado' }

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('content_queue')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('engine', 'dark')
    .in('status', ['posted', 'ready', 'rendering', 'scripted'])
    .gte('created_at', startOfMonth.toISOString())

  if ((count ?? 0) >= limits.videosPerMonth)
    return {
      allowed: false,
      reason: `Limite de ${limits.videosPerMonth} vídeos/mês atingido — faça upgrade`,
    }

  return { allowed: true }
}

// ─────────────────────────────────────────
// CHECAGENS — Motor UGC
// ─────────────────────────────────────────

export async function canUseUGC(authId: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  const limits = await getUserPlanLimits(authId)
  if (!limits) return { allowed: false, reason: 'Usuário não encontrado' }
  if (!limits.ugcEnabled)
    return { allowed: false, reason: 'Motor UGC disponível nos planos Pro e Enterprise — faça upgrade' }
  if (limits.trialExpired) return { allowed: false, reason: 'Trial expirado' }
  return { allowed: true }
}

export async function canTrainAvatar(authId: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  const ugc = await canUseUGC(authId)
  if (!ugc.allowed) return ugc

  const limits = await getUserPlanLimits(authId)
  if (!limits || limits.avatarsLimit === -1) return { allowed: true }

  const supabase = await createClient()
  const { data: user } = await supabase.from('users').select('id').eq('auth_id', authId).single()
  if (!user) return { allowed: false, reason: 'Usuário não encontrado' }

  const { count } = await supabase
    .from('avatars')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'ready')

  if ((count ?? 0) >= limits.avatarsLimit)
    return { allowed: false, reason: `Limite de ${limits.avatarsLimit} avatar(s) atingido — faça upgrade` }

  return { allowed: true }
}

// ─────────────────────────────────────────
// CHECAGENS — Motor Social
// ─────────────────────────────────────────

export async function canUseSocialFeature(
  authId: string,
  feature: SocialFeature
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getUserPlanLimits(authId)
  if (!limits) return { allowed: false, reason: 'Usuário não encontrado' }
  if (!limits.socialEnabled)
    return { allowed: false, reason: 'Motor Social não disponível no seu plano' }
  if (limits.trialExpired) return { allowed: false, reason: 'Trial expirado' }

  switch (feature) {
    case 'inbox':
      if (!limits.inboxEnabled)
        return { allowed: false, reason: 'Inbox disponível nos planos Pro e Enterprise' }
      break
    case 'competitors':
      if (limits.competitorsLimit === 0)
        return { allowed: false, reason: 'Monitor de concorrentes disponível nos planos Pro e Enterprise' }
      break
    case 'analytics':
      if (!limits.analyticsEnabled)
        return { allowed: false, reason: 'Analytics avançado disponível nos planos Pro e Enterprise' }
      break
    case 'crm':
    case 'content_templates':
      break
  }

  return { allowed: true }
}

export async function canAddBrand(authId: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  const check = await canUseSocialFeature(authId, 'crm')
  if (!check.allowed) return check

  const limits = await getUserPlanLimits(authId)
  if (!limits || limits.brandsLimit === -1) return { allowed: true }

  const supabase = await createClient()
  const { data: user } = await supabase.from('users').select('id').eq('auth_id', authId).single()
  if (!user) return { allowed: false, reason: 'Usuário não encontrado' }

  const { count } = await supabase
    .from('brands')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .neq('status', 'blocked')

  if ((count ?? 0) >= limits.brandsLimit)
    return {
      allowed: false,
      reason: `Limite de ${limits.brandsLimit} marca(s) atingido — faça upgrade`,
    }

  return { allowed: true }
}

export async function canAddCompetitor(authId: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  const check = await canUseSocialFeature(authId, 'competitors')
  if (!check.allowed) return check

  const limits = await getUserPlanLimits(authId)
  if (!limits || limits.competitorsLimit === -1) return { allowed: true }

  const supabase = await createClient()
  const { data: user } = await supabase.from('users').select('id').eq('auth_id', authId).single()
  if (!user) return { allowed: false, reason: 'Usuário não encontrado' }

  const { count } = await supabase
    .from('competitors')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_active', true)

  if ((count ?? 0) >= limits.competitorsLimit)
    return {
      allowed: false,
      reason: `Limite de ${limits.competitorsLimit} concorrente(s) atingido — faça upgrade`,
    }

  return { allowed: true }
}

// ─────────────────────────────────────────
// HELPER — limites formatados para o frontend
// ─────────────────────────────────────────

export function formatLimitsForUI(limits: PlanLimits) {
  const fmt = (v: number) => v === -1 ? 'Ilimitado' : String(v)
  return {
    plan: limits.plan,
    status: limits.status,
    trialExpired: limits.trialExpired,
    trialEndsAt: limits.trialEndsAt,
    motors: {
      dark: {
        enabled: limits.darkEnabled,
        channels: fmt(limits.channelsLimit),
        videosPerMonth: fmt(limits.videosPerMonth),
      },
      ugc: {
        enabled: limits.ugcEnabled,
        avatars: fmt(limits.avatarsLimit),
        videosPerMonth: fmt(limits.ugcVideosPerMonth),
      },
      social: {
        enabled: limits.socialEnabled,
        brands: fmt(limits.brandsLimit),
        deals: fmt(limits.activeDealsLimit),
        competitors: fmt(limits.competitorsLimit),
        inbox: limits.inboxEnabled,
        analytics: limits.analyticsEnabled,
        templates: limits.templatesEnabled,
      },
    },
  }
}
