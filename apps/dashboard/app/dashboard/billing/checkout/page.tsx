import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BillingCheckoutClient from '@/components/billing/BillingCheckoutClient'

export const dynamic = 'force-dynamic'

const PLAN_IDS = ['starter', 'standart', 'pro'] as const
const PERIODS = ['monthly', 'yearly'] as const

type PlanId = (typeof PLAN_IDS)[number]
type Period = (typeof PERIODS)[number]

function parsePlan(s: string | null): PlanId | null {
  if (s && PLAN_IDS.includes(s as PlanId)) return s as PlanId
  return null
}

function parsePeriod(s: string | null): Period | null {
  if (s && PERIODS.includes(s as Period)) return s as Period
  return null
}

export default async function BillingCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const planParam = typeof params?.plan === 'string' ? params.plan : Array.isArray(params?.plan) ? params.plan[0] : null
  const periodParam = typeof params?.period === 'string' ? params.period : Array.isArray(params?.period) ? params.period[0] : null

  const plan = parsePlan(planParam ?? null)
  const period = parsePeriod(periodParam ?? null)

  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!restaurant) {
    redirect('/dashboard')
  }

  let paymentLink: string | null = null
  let subscriptionPeriod: 'monthly' | 'yearly' = 'monthly'

  const { data: billing } = await supabase
    .from('billing_settings')
    .select('subscription_monthly_link, subscription_yearly_link, subscription_period')
    .eq('restaurant_id', restaurant.id)
    .maybeSingle()

  if (billing) {
    subscriptionPeriod = (period === 'yearly' ? 'yearly' : 'monthly') as 'monthly' | 'yearly'
    paymentLink = subscriptionPeriod === 'yearly' ? billing.subscription_yearly_link : billing.subscription_monthly_link
  }

  return (
    <div className="max-w-2xl mx-auto">
      <BillingCheckoutClient
        plan={plan ?? 'starter'}
        period={subscriptionPeriod}
        paymentLink={paymentLink}
      />
    </div>
  )
}
