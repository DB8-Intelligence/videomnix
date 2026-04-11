import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
})

export const PLANS = {
  starter: {
    name: 'Starter',
    price_monthly: 9700, // R$ 97 in centavos
    channels_limit: 1,
    videos_per_month: 15,
    stripe_price_id: process.env.STRIPE_PRICE_STARTER || '',
  },
  pro: {
    name: 'Pro',
    price_monthly: 19700, // R$ 197
    channels_limit: 3,
    videos_per_month: 60,
    stripe_price_id: process.env.STRIPE_PRICE_PRO || '',
  },
  scale: {
    name: 'Scale',
    price_monthly: 39700, // R$ 397
    channels_limit: 10,
    videos_per_month: 200,
    stripe_price_id: process.env.STRIPE_PRICE_SCALE || '',
  },
} as const

export type PlanKey = keyof typeof PLANS
