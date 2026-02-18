import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BillingClient from '@/components/billing/BillingClient'

export default async function BillingPage() {
  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_user_id', user.id)
    .single()

  if (!restaurant) {
    redirect('/dashboard')
  }

  // Fetch billing settings (create default if doesn't exist)
  let { data: billingSettings, error: billingError } = await supabase
    .from('billing_settings')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .single()

  // If not found, create default settings
  if (billingError && billingError.code === 'PGRST116') {
    const { data: newSettings, error: insertError } = await supabase
      .from('billing_settings')
      .insert({
        restaurant_id: restaurant.id,
        setup_fee_enabled: true,
        setup_fee_amount: 0,
        subscription_period: 'monthly',
        subscription_monthly_price: 0,
        subscription_yearly_price: 0,
        plan: 'trial',
        status: 'trial',
      })
      .select()
      .single()

    if (!insertError) {
      billingSettings = newSettings
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ödeme Yöntemleri</h1>
        <p className="mt-2 text-sm text-gray-600">
          Plan bilgileriniz, ödeme ayarları ve faturalar
        </p>
      </div>
      <BillingClient initialSettings={billingSettings} restaurantId={restaurant.id} />
    </div>
  )
}

