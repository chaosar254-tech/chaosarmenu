/**
 * Server-side subscription check utility
 * Used in API routes to enforce soft lock mechanism
 */

import { createServerSupabaseClient } from './supabase-server'
import { hasActiveSubscription, type RestaurantSubscription } from './subscription-utils'
import { cookies } from 'next/headers'

export interface SubscriptionCheckResult {
  hasActiveSubscription: boolean
  subscription: RestaurantSubscription | null
  restaurantId: string | null
  error?: string
}

/**
 * Check subscription status for current user's restaurant
 * Returns subscription status and restaurant ID
 */
export async function checkSubscriptionStatus(): Promise<SubscriptionCheckResult> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        hasActiveSubscription: false,
        subscription: null,
        restaurantId: null,
        error: 'Unauthorized',
      }
    }

    // Get restaurant with subscription fields
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, subscription_plan, subscription_status, current_period_end, iyzico_sub_reference')
      .eq('owner_user_id', user.id)
      .maybeSingle()

    if (restaurantError || !restaurant) {
      return {
        hasActiveSubscription: false,
        subscription: null,
        restaurantId: null,
        error: 'Restaurant not found',
      }
    }

    const subscription: RestaurantSubscription = {
      subscription_plan: (restaurant.subscription_plan || 'starter') as 'starter' | 'standard' | 'premium',
      subscription_status: (restaurant.subscription_status || 'active') as 'active' | 'past_due' | 'canceled',
      current_period_end: restaurant.current_period_end || null,
      iyzico_sub_reference: restaurant.iyzico_sub_reference || null,
    }

    const isActive = hasActiveSubscription(subscription)

    return {
      hasActiveSubscription: isActive,
      subscription,
      restaurantId: restaurant.id,
    }
  } catch (error: any) {
    console.error('[Subscription Check] Error:', error)
    return {
      hasActiveSubscription: false,
      subscription: null,
      restaurantId: null,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Check if write operations are allowed (subscription is active)
 * Throws an error if subscription is expired
 */
export async function requireActiveSubscription(): Promise<SubscriptionCheckResult> {
  const check = await checkSubscriptionStatus()

  if (!check.hasActiveSubscription) {
    throw new Error('SUBSCRIPTION_EXPIRED')
  }

  return check
}
