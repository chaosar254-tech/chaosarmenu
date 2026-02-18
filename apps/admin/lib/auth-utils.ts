import { createServerSupabaseClient } from './supabase-server'
import { cookies } from 'next/headers'

/**
 * Get user role and determine appropriate dashboard redirect
 * Returns the dashboard URL based on user's role:
 * - Admin users -> '/dashboard' (admin dashboard)
 * - Restaurant owners -> 'https://dashboard.chaosarmenu.com' (restaurant dashboard)
 * - No role -> null
 */
export async function getUserRoleAndDashboard(): Promise<{
  isAdmin: boolean
  isRestaurantOwner: boolean
  dashboardUrl: string | null
}> {
  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      isAdmin: false,
      isRestaurantOwner: false,
      dashboardUrl: null,
    }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin = profile?.is_admin === true

  // Check if user owns a restaurant
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  const isRestaurantOwner = !!restaurant

  // Determine dashboard URL based on role priority (admin > restaurant owner)
  let dashboardUrl: string | null = null
  if (isAdmin) {
    dashboardUrl = '/dashboard' // Admin dashboard
  } else if (isRestaurantOwner) {
    dashboardUrl = 'https://dashboard.chaosarmenu.com' // Restaurant dashboard
  }

  return {
    isAdmin,
    isRestaurantOwner,
    dashboardUrl,
  }
}

/**
 * Redirect user to appropriate dashboard based on their role
 * If user is authenticated but doesn't have access, redirect to their dashboard
 */
export async function redirectToAppropriateDashboard(): Promise<never> {
  const { dashboardUrl } = await getUserRoleAndDashboard()

  if (dashboardUrl) {
    // Use dynamic import to avoid circular dependencies
    const { redirect } = await import('next/navigation')
    redirect(dashboardUrl)
  } else {
    // No role, redirect to login
    const { redirect } = await import('next/navigation')
    redirect('/login')
  }
}
