import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import DashboardLayoutClient from '@/components/DashboardLayoutClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient(cookieStore)
  
  // Check session first (more reliable during navigation)
  let { data: { session } } = await supabase.auth.getSession()
  
  // If no session, try refreshing it once before redirecting (handles race conditions)
  if (!session) {
    try {
      await supabase.auth.refreshSession()
      const { data: { session: refreshedSession } } = await supabase.auth.getSession()
      session = refreshedSession
    } catch (refreshError) {
      // Refresh failed, will check getUser below
      console.warn('[DashboardLayout] Session refresh failed:', refreshError)
    }
  }

  // Get user - use session if available, otherwise fetch fresh
  // This handles cases where session is null but cookies exist (race condition)
  let { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // Only redirect if we're certain there's no user after retry
  // Allow through if userError is not a critical auth error (might be transient)
  if (!user) {
    // If getUser also fails and we have no session, then redirect
    if (!session || (userError && !userError.message?.includes('JWT'))) {
      redirect('/login')
    }
    // If we have a session but no user, try to get user from session
    if (session?.user) {
      user = session.user
    } else {
      redirect('/login')
    }
  }

  // Get user's restaurant with subscription fields (with retry on error)
  // Only fetch if user is confirmed to exist
  let restaurant = null
  let restaurantError = null
  
  if (user) {
    try {
      const result = await supabase
        .from('restaurants')
        .select('id, name, slug, is_active, subscription_plan, subscription_status, current_period_end, iyzico_sub_reference')
        .eq('owner_user_id', user.id)
        .maybeSingle()
      
      restaurant = result.data
      restaurantError = result.error
    } catch (error) {
      // If restaurant query fails, log but don't redirect (user might not have a restaurant yet)
      console.warn('[DashboardLayout] Restaurant query failed (non-critical):', error)
      restaurantError = error as any
    }
  }

  // Extract subscription data
  const subscription = restaurant ? {
    subscription_plan: (restaurant.subscription_plan || 'starter') as 'starter' | 'standard' | 'premium',
    subscription_status: (restaurant.subscription_status || 'active') as 'active' | 'past_due' | 'canceled',
    current_period_end: restaurant.current_period_end || null,
    iyzico_sub_reference: restaurant.iyzico_sub_reference || null,
    is_active: restaurant.is_active !== false,
  } : null

  // Note: Payment lock is handled in middleware.ts for better performance
  // Middleware checks subscription status before the request reaches the layout

  return (
    <DashboardLayoutClient 
      restaurant={restaurant ? { id: restaurant.id, name: restaurant.name, slug: restaurant.slug } : null}
      subscription={subscription}
    >
      {children}
    </DashboardLayoutClient>
  )
}

