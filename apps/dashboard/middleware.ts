import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Check if subscription is overdue (is_active false, past_due, canceled, or expired)
 */
function isSubscriptionOverdue(subscription: {
  is_active?: boolean
  subscription_status: string
  current_period_end: string | null
} | null): boolean {
  if (!subscription) {
    return true // No subscription = overdue
  }

  if (subscription.is_active === false) {
    return true
  }

  if (subscription.subscription_status === 'past_due') {
    return true
  }

  if (subscription.subscription_status === 'canceled') {
    return true
  }

  if (subscription.subscription_status === 'active') {
    if (!subscription.current_period_end) {
      return true
    }
    const periodEnd = new Date(subscription.current_period_end)
    const now = new Date()
    return periodEnd <= now
  }

  return false
}

export async function middleware(request: NextRequest) {
  // Skip middleware for static files, API routes, and Next.js internals
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const cookieDomain = process.env.NODE_ENV === 'production' ? '.chaosarmenu.com' : undefined

  // getAll/setAll pattern - @supabase/ssr recommended for middleware (Edge runtime)
  // get/set/remove can cause "cookies.get" undefined in some Edge contexts
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          const opts = (o: Record<string, unknown> = {}) => ({ ...o, ...(cookieDomain && { domain: cookieDomain }) })
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, opts(options as Record<string, unknown>))
          )
        },
      },
    }
  )

  // Check session first (more reliable during navigation)
  const { data: { session } } = await supabase.auth.getSession()

  // Protect dashboard routes - only allow authenticated users
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const pathname = request.nextUrl.pathname
    const isBillingPage = pathname === '/dashboard/billing' || pathname.startsWith('/dashboard/billing/')
    const isLogoutRoute = pathname.includes('/api/auth/logout') || pathname === '/login'
    
    // If no session, try refreshing it once before redirecting
    if (!session) {
      try {
        await supabase.auth.refreshSession()
        const { data: { session: refreshedSession } } = await supabase.auth.getSession()
        
        // If still no session after refresh, check getUser as fallback
        if (!refreshedSession) {
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          // Only redirect if we're certain there's no user
          // If userError exists but is not a "no user" error, allow through (might be transient)
          if (!user && (!userError || userError.message?.includes('session') || userError.message?.includes('expired'))) {
            return NextResponse.redirect(new URL('/login', request.url))
          }
        }
      } catch (refreshError) {
        // If refresh fails, check getUser as final fallback
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        // Only redirect on clear authentication failures
        if (!user && (!userError || userError.message?.includes('session') || userError.message?.includes('expired'))) {
          return NextResponse.redirect(new URL('/login', request.url))
        }
      }
    }

    // Payment Lock: Check subscription status for authenticated users
    // Skip check for billing page and logout routes
    if (!isBillingPage && !isLogoutRoute && session) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Fetch restaurant subscription status
          const { data: restaurant } = await supabase
            .from('restaurants')
            .select('is_active, subscription_status, current_period_end')
            .eq('owner_user_id', user.id)
            .maybeSingle()
          
          // Check if subscription is overdue
          if (restaurant && isSubscriptionOverdue(restaurant)) {
            console.log('[Middleware] Payment Lock: Subscription overdue, redirecting to billing')
            return NextResponse.redirect(new URL('/dashboard/billing', request.url))
          }
        }
      } catch (error) {
        // If subscription check fails, log but don't block (might be transient)
        console.warn('[Middleware] Subscription check failed:', error)
      }
    }
  }

  // Allow everyone to access login page - no redirects
  // Login page will handle its own logic (logout if needed)

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}

