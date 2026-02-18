import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import UpgradePlanClient from '@/components/billing/UpgradePlanClient'

export const dynamic = 'force-dynamic'

export default async function BillingUpgradePage() {
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
    .select('id, name')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!restaurant) {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <UpgradePlanClient restaurantId={restaurant.id} restaurantName={restaurant.name} />
    </div>
  )
}
