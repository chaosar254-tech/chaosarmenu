import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/billing/payments
 * Returns payment history for the current user's restaurant (Ödeme Geçmişi).
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_user_id', user.id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, amount, currency, plan, period, status, paid_at, invoice_url, created_at')
      .eq('restaurant_id', restaurant.id)
      .order('paid_at', { ascending: false })

    if (paymentsError) {
      console.error('[Billing Payments]', paymentsError)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    return NextResponse.json({ data: payments ?? [] })
  } catch (err) {
    console.error('[Billing Payments]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
