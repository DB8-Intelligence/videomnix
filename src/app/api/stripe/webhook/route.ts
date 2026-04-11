import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS, PlanKey } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// Use service role for webhook — no user session available
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.user_id
      const plan = session.metadata?.plan as PlanKey | undefined

      if (userId && plan && PLANS[plan]) {
        await supabase
          .from('users')
          .update({
            plan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            channels_limit: PLANS[plan].channels_limit,
            videos_per_month: PLANS[plan].videos_per_month,
          })
          .eq('id', userId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object
      const customerId = subscription.customer as string

      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (user) {
        if (subscription.status === 'active') {
          // Find which plan matches the price
          const priceId = subscription.items.data[0]?.price?.id
          const matchedPlan = Object.entries(PLANS).find(
            ([, config]) => config.stripe_price_id === priceId
          )
          if (matchedPlan) {
            const [planKey, planConfig] = matchedPlan
            await supabase
              .from('users')
              .update({
                plan: planKey,
                channels_limit: planConfig.channels_limit,
                videos_per_month: planConfig.videos_per_month,
              })
              .eq('id', user.id)
          }
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const customerId = subscription.customer as string

      await supabase
        .from('users')
        .update({
          plan: 'trial',
          channels_limit: 2,
          videos_per_month: 30,
          stripe_subscription_id: null,
        })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const customerId = invoice.customer as string
      console.error(`Payment failed for customer ${customerId}`)
      // Could notify user via WhatsApp or email
      break
    }
  }

  return NextResponse.json({ received: true })
}
