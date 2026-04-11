import { SupabaseClient } from '@supabase/supabase-js'

interface UsageCheckResult {
  allowed: boolean
  reason?: string
  profile?: {
    id: string
    plan: string
    channels_limit: number
    videos_per_month: number
    trial_ends_at: string
  }
}

/**
 * Checks if user has an active plan (not expired trial)
 */
export async function checkPlanActive(
  supabase: SupabaseClient,
  authUserId: string
): Promise<UsageCheckResult> {
  const { data: profile } = await supabase
    .from('users')
    .select('id, plan, channels_limit, videos_per_month, trial_ends_at')
    .eq('auth_id', authUserId)
    .single()

  if (!profile) {
    return { allowed: false, reason: 'Profile not found' }
  }

  // Check trial expiration
  if (profile.plan === 'trial') {
    const trialEnd = new Date(profile.trial_ends_at)
    if (trialEnd < new Date()) {
      return { allowed: false, reason: 'Trial expired. Please upgrade your plan.', profile }
    }
  }

  return { allowed: true, profile }
}

/**
 * Checks if user can create a new channel (within limit)
 */
export async function checkChannelLimit(
  supabase: SupabaseClient,
  userId: string,
  channelsLimit: number
): Promise<UsageCheckResult> {
  const { count } = await supabase
    .from('channels')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const currentCount = count || 0
  if (currentCount >= channelsLimit) {
    return {
      allowed: false,
      reason: `Channel limit reached (${currentCount}/${channelsLimit}). Please upgrade your plan.`,
    }
  }

  return { allowed: true }
}

/**
 * Checks if user can create more videos this month
 */
export async function checkVideoLimit(
  supabase: SupabaseClient,
  userId: string,
  videosPerMonth: number
): Promise<UsageCheckResult> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('content_queue')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  const currentCount = count || 0
  if (currentCount >= videosPerMonth) {
    return {
      allowed: false,
      reason: `Monthly video limit reached (${currentCount}/${videosPerMonth}). Please upgrade your plan.`,
    }
  }

  return { allowed: true }
}
