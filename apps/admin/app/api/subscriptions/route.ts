import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// Type definitions for restaurant data
interface RestaurantSubscriptionData {
  id: string
  name: string
  slug: string
  owner_user_id: string
  created_at: string
  subscription_plan: 'starter' | 'standard' | 'premium' | null
  subscription_status: 'active' | 'past_due' | 'canceled' | null
  current_period_end: string | null
  iyzico_sub_reference: string | null
}

interface RestaurantForUpdate {
  id: string
  subscription_status: 'active' | 'past_due' | 'canceled' | null
  current_period_end: string | null
  subscription_plan: 'starter' | 'standard' | 'premium' | null
}

/**
 * GET /api/subscriptions
 * Get all restaurants with subscription data for admin management
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Check if user is admin
    // Geçici olarak admin kontrolünü esnek tutuyoruz (middleware'de de bypass var)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    // Geçici olarak admin kontrolünü bypass ediyoruz (production'da aktif edilecek)
    if (profileError) {
      console.warn('[Subscriptions API GET] Profile not found for user:', user.id, 'Allowing access temporarily')
    } else if (profile && !profile.is_admin) {
      console.warn('[Subscriptions API GET] User is not admin:', user.id, 'Allowing access temporarily')
      // Production'da bu satırı aktif edin:
      // return NextResponse.json(
      //   { error: 'Forbidden - Admin access required' },
      //   { status: 403 }
      // )
    }

    // Use admin client to get all restaurants with subscription fields
    const adminClient = createSupabaseAdminClient()

    // Get filter params
    const searchParams = request.nextUrl.searchParams
    const statusFilter = searchParams.get('status') // 'active', 'past_due', 'canceled'
    const sortBy = searchParams.get('sort') || 'current_period_end' // 'current_period_end', 'name', 'created_at'

    let query = adminClient
      .from('restaurants')
      .select('id, name, slug, owner_user_id, created_at, subscription_plan, subscription_status, current_period_end, iyzico_sub_reference')

    // Apply status filter
    if (statusFilter && ['active', 'past_due', 'canceled'].includes(statusFilter)) {
      query = query.eq('subscription_status', statusFilter)
    }

    // Apply sorting
    const ascending = sortBy === 'current_period_end' ? true : false // Expires soon first for period_end
    query = query.order(sortBy, { ascending })

    const { data: restaurants, error: restaurantsError } = await query

    if (restaurantsError) {
      console.error('[Subscriptions API] Error fetching restaurants:', restaurantsError)
      return NextResponse.json(
        { error: 'Failed to fetch restaurants' },
        { status: 500 }
      )
    }

    // Get owner emails and phone numbers (from auth.users metadata if available)
    const restaurantsWithOwnerInfo: (RestaurantSubscriptionData & { owner_email: string; owner_phone: string | null })[] = []
    
    if (restaurants) {
      for (const restaurant of restaurants as RestaurantSubscriptionData[]) {
        const { data: ownerData } = await adminClient.auth.admin.getUserById(
          restaurant.owner_user_id
        )
        
        restaurantsWithOwnerInfo.push({
          ...restaurant,
          owner_email: ownerData?.user?.email || 'N/A',
          owner_phone: ownerData?.user?.phone || ownerData?.user?.user_metadata?.phone || null,
        })
      }
    }

    return NextResponse.json({ 
      restaurants: restaurantsWithOwnerInfo,
      count: restaurantsWithOwnerInfo.length,
    })
  } catch (error: any) {
    console.error('[Subscriptions API] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/subscriptions
 * Update restaurant subscription (extend period, change plan, change status)
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Check if user is admin
    // Geçici olarak admin kontrolünü esnek tutuyoruz (middleware'de de bypass var)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    // Geçici olarak admin kontrolünü bypass ediyoruz (production'da aktif edilecek)
    if (profileError) {
      console.warn('[Subscriptions API PATCH] Profile not found for user:', user.id, 'Allowing access temporarily')
    } else if (profile && !profile.is_admin) {
      console.warn('[Subscriptions API PATCH] User is not admin:', user.id, 'Allowing access temporarily')
      // Production'da bu satırı aktif edin:
      // return NextResponse.json(
      //   { error: 'Forbidden - Admin access required' },
      //   { status: 403 }
      // )
    }

    const body = await request.json()
    const { 
      restaurant_id, 
      action, 
      value,
      target_date // Optional: specific target date (for custom date picker)
    } = body

    if (!restaurant_id || !action) {
      return NextResponse.json(
        { error: 'restaurant_id and action are required' },
        { status: 400 }
      )
    }

    const adminClient = createSupabaseAdminClient()

    // Get current restaurant data
    const { data: restaurant, error: restaurantError } = await adminClient
      .from('restaurants')
      .select('id, subscription_status, current_period_end, subscription_plan')
      .eq('id', restaurant_id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Type assertion for restaurant data
    const restaurantData = restaurant as RestaurantForUpdate

    let updateData: any = {}

    // Handle different actions
    switch (action) {
      case 'extend_subscription':
        // If target_date is provided, use it directly (custom date picker)
        if (target_date) {
          const targetDate = new Date(target_date)
          if (isNaN(targetDate.getTime())) {
            return NextResponse.json(
              { error: 'Invalid target_date format' },
              { status: 400 }
            )
          }
          updateData = {
            current_period_end: targetDate.toISOString(),
            subscription_status: 'active',
          }
          break
        }

        // Otherwise, use value (days) for preset buttons
        // value can be positive (extend) or negative (decrease): 30, 90, 180, 365, -7, -30, -90
        const validValues = [30, 90, 180, 365, -7, -30, -90, -180, -365]
        if (value === null || value === undefined || !validValues.includes(value)) {
          return NextResponse.json(
            { error: 'Invalid extension value. Must be 30, 90, 180, 365, -7, -30, or -90 days, or provide target_date' },
            { status: 400 }
          )
        }
        
        // Calculate new expiration date
        // If current expiration is NULL or in the past: New Date = Now + days
        // If current expiration is in the future: New Date = Current Expiration + days
        const now = new Date()
        const currentEnd = restaurantData.current_period_end 
          ? new Date(restaurantData.current_period_end) 
          : null
        
        let newEnd: Date
        if (!currentEnd || currentEnd <= now) {
          // NULL or in the past: start from now
          newEnd = new Date(now)
          newEnd.setDate(newEnd.getDate() + value)
        } else {
          // In the future: add to existing date
          newEnd = new Date(currentEnd)
          newEnd.setDate(newEnd.getDate() + value)
        }
        
        updateData = {
          current_period_end: newEnd.toISOString(),
          subscription_status: 'active', // Ensure status is active when extending
        }
        break

      case 'change_plan':
        // value should be 'starter', 'standard', or 'premium'
        if (!value || !['starter', 'standard', 'premium'].includes(value)) {
          return NextResponse.json(
            { error: 'Invalid plan. Must be starter, standard, or premium' },
            { status: 400 }
          )
        }
        
        updateData = {
          subscription_plan: value,
        }
        break

      case 'change_status':
        // value should be 'active', 'past_due', or 'canceled'
        if (!value || !['active', 'past_due', 'canceled'].includes(value)) {
          return NextResponse.json(
            { error: 'Invalid status. Must be active, past_due, or canceled' },
            { status: 400 }
          )
        }
        
        updateData = {
          subscription_status: value,
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be extend_subscription, change_plan, or change_status' },
          { status: 400 }
        )
    }

    // Update restaurant
    const { data: updatedRestaurant, error: updateError } = await (adminClient
      .from('restaurants') as any)
      .update(updateData as any)
      .eq('id', restaurant_id)
      .select()
      .single()

    if (updateError) {
      console.error('[Subscriptions API] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully',
      data: updatedRestaurant,
    })
  } catch (error: any) {
    console.error('[Subscriptions API] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
