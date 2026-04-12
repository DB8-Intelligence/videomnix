import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Webhook Kiwify para gerenciar planos de pagamento.
 * Eventos suportados:
 * - order_approved: ativa plano
 * - refund: reverte para trial
 * - subscription_canceled: reverte para trial
 * - chargeback: bloqueia conta
 *
 * Kiwify envia POST com JSON. Validar via token no header Authorization.
 * Docs: https://kiwify.com.br/docs/webhooks
 */

const PLAN_MAP: Record<string, { plan: string; channels_limit: number; videos_per_month: number }> = {
  starter: { plan: 'starter', channels_limit: 2, videos_per_month: 30 },
  pro: { plan: 'pro', channels_limit: 5, videos_per_month: 100 },
  enterprise: { plan: 'enterprise', channels_limit: 999, videos_per_month: 9999 },
}

export async function POST(request: NextRequest) {
  try {
    // Validar token Kiwify
    const signature = request.headers.get('x-kiwify-signature') ||
                      request.headers.get('authorization')?.replace('Bearer ', '')

    if (signature !== process.env.KIWIFY_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()

    // Kiwify envia: order_status, Customer.email, Product.name
    const event = body.order_status || body.event
    const buyerEmail = body.Customer?.email || body.customer?.email
    if (!buyerEmail) {
      return NextResponse.json({ error: 'Customer email not found' }, { status: 400 })
    }

    // Extrair plano do nome do produto
    const productName = (body.Product?.name || body.product?.name || '').toLowerCase()
    const planKey = Object.keys(PLAN_MAP).find((key) => productName.includes(key)) || 'starter'

    // Service role para bypass RLS
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
      case 'order_approved':
      case 'paid': {
        const planConfig = PLAN_MAP[planKey]

        const { error } = await supabase
          .from('users')
          .update({
            plan: planConfig.plan,
            channels_limit: planConfig.channels_limit,
            videos_per_month: planConfig.videos_per_month,
          })
          .eq('email', buyerEmail)

        if (error) {
          console.error('Kiwify plan update error:', error)
          return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
        }

        return NextResponse.json({ ok: true, plan: planConfig.plan })
      }

      case 'refund':
      case 'subscription_canceled':
      case 'canceled': {
        const { error } = await supabase
          .from('users')
          .update({
            plan: 'trial',
            channels_limit: 2,
            videos_per_month: 30,
            trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('email', buyerEmail)

        if (error) {
          console.error('Kiwify cancellation error:', error)
          return NextResponse.json({ error: 'Failed to revert plan' }, { status: 500 })
        }

        return NextResponse.json({ ok: true, plan: 'trial' })
      }

      case 'chargeback': {
        const { error } = await supabase
          .from('users')
          .update({
            plan: 'blocked',
            channels_limit: 0,
            videos_per_month: 0,
          })
          .eq('email', buyerEmail)

        if (error) {
          console.error('Kiwify chargeback error:', error)
        }

        return NextResponse.json({ ok: true, plan: 'blocked' })
      }

      default:
        return NextResponse.json({ ok: true, skipped: event })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Kiwify webhook error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
