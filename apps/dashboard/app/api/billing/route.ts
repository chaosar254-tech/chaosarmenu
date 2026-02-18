import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/billing
 * Get billing settings for the restaurant (creates default if doesn't exist)
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get restaurant owned by user
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_user_id', user.id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Get billing settings (or create default if doesn't exist)
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

      if (insertError) {
        console.error('[Billing] Failed to create default settings:', insertError)
        return NextResponse.json(
          { error: 'Failed to create billing settings' },
          { status: 500 }
        )
      }

      billingSettings = newSettings
    } else if (billingError) {
      console.error('[Billing] Error fetching settings:', billingError)
      return NextResponse.json(
        { error: 'Failed to fetch billing settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: billingSettings })
  } catch (error: any) {
    console.error('GET /api/billing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/billing
 * Update billing settings (upsert)
 */
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get restaurant owned by user
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_user_id', user.id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      setup_fee_enabled,
      setup_fee_amount,
      setup_fee_payment_link,
      subscription_period,
      subscription_monthly_price,
      subscription_yearly_price,
      subscription_monthly_link,
      subscription_yearly_link,
      plan,
      status,
      trial_end_at,
    } = body

    // Validation
    const errors: string[] = []

    // Validate amounts (must be >= 0 if provided)
    if (setup_fee_amount !== undefined && setup_fee_amount < 0) {
      errors.push('Kurulum ücreti 0 veya daha büyük olmalıdır')
    }
    if (subscription_monthly_price !== undefined && subscription_monthly_price < 0) {
      errors.push('Aylık abonelik ücreti 0 veya daha büyük olmalıdır')
    }
    if (subscription_yearly_price !== undefined && subscription_yearly_price < 0) {
      errors.push('Yıllık abonelik ücreti 0 veya daha büyük olmalıdır')
    }

    // Validate URLs (optional but must be valid if provided)
    const validateUrl = (url: string | null | undefined, fieldName: string): string | null => {
      if (!url || url.trim() === '') return null
      const trimmed = url.trim()
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        errors.push(`${fieldName} geçerli bir URL olmalıdır (http:// veya https:// ile başlamalı)`)
        return null
      }
      return trimmed
    }

    const validatedSetupFeeLink = validateUrl(setup_fee_payment_link, 'Kurulum ücreti ödeme linki')
    const validatedMonthlyLink = validateUrl(subscription_monthly_link, 'Aylık abonelik ödeme linki')
    const validatedYearlyLink = validateUrl(subscription_yearly_link, 'Yıllık abonelik ödeme linki')

    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      )
    }

    // Build update data (only include provided fields)
    const updateData: any = {}
    if (setup_fee_enabled !== undefined) updateData.setup_fee_enabled = setup_fee_enabled
    if (setup_fee_amount !== undefined) updateData.setup_fee_amount = setup_fee_amount
    if (setup_fee_payment_link !== undefined) updateData.setup_fee_payment_link = validatedSetupFeeLink
    if (subscription_period !== undefined) updateData.subscription_period = subscription_period
    if (subscription_monthly_price !== undefined) updateData.subscription_monthly_price = subscription_monthly_price
    if (subscription_yearly_price !== undefined) updateData.subscription_yearly_price = subscription_yearly_price
    if (subscription_monthly_link !== undefined) updateData.subscription_monthly_link = validatedMonthlyLink
    if (subscription_yearly_link !== undefined) updateData.subscription_yearly_link = validatedYearlyLink
    if (plan !== undefined) updateData.plan = plan
    if (status !== undefined) updateData.status = status
    if (trial_end_at !== undefined) updateData.trial_end_at = trial_end_at

    // Upsert billing settings
    const { data: updatedSettings, error: upsertError } = await supabase
      .from('billing_settings')
      .upsert({
        restaurant_id: restaurant.id,
        ...updateData,
      }, {
        onConflict: 'restaurant_id',
      })
      .select()
      .single()

    if (upsertError) {
      console.error('[Billing] Upsert error:', upsertError)
      return NextResponse.json(
        { error: 'Failed to update billing settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Ödeme ayarları başarıyla güncellendi',
    })
  } catch (error: any) {
    console.error('PUT /api/billing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

