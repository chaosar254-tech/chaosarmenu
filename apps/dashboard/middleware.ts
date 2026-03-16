import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function isSubscriptionOverdue(subscription: {
  is_active?: boolean
  subscription_status: string
  current_period_end: string | null
} | null): boolean {
  if (!subscription) return true
  if (subscription.is_active === false) return true
  if (subscription.subscription_status === 'past_due') return true
  if (subscription.subscription_status === 'canceled') return true
  if (subscription.subscription_status === 'active') {
    if (!subscription.current_period_end) return true
    const periodEnd = new Date(subscription.current_period_end)
    const now = new Date()
    return periodEnd <= now
  }
  return false
}

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const cookieDomain = process.env.NODE_ENV === 'production' ? '.chaosarmenu.com' : undefined

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          const opts = { ...options, ...(cookieDomain && { domain: cookieDomain }) }
          request.cookies.set({ name, value, ...opts })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...opts })
        },
        remove(name: string, options: any) {
          const opts = { ...options, ...(cookieDomain && { domain: cookieDomain }) }
          request.cookies.set({ name, value: '', ...opts })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...opts })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const pathname = request.nextUrl.pathname
    const isBillingPage = pathname === '/dashboard/billing' || pathname.startsWith('/dashboard/billing/')
    const isLogoutRoute = pathname.includes('/api/auth/logout') || pathname === '/login'

    if (!session) {
      try {
        await supabase.auth.refreshSession()
        const { data: { session: refreshedSession } } = await supabase.auth.getSession()
        if (!refreshedSession) {
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          if (!user && (!userError || userError.message?.includes('session') || userError.message?.includes('expired'))) {
            return NextResponse.redirect(new URL('/login', request.url))
          }
        }
      } catch (refreshError) {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (!user && (!userError || userError.message?.includes('session') || userError.message?.includes('expired'))) {
          return NextResponse.redirect(new URL('/login', request.url))
        }
      }
    }

    if (!isBillingPage && !isLogoutRoute && session) {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // ✅ Admin kullanıcıları subscription kontrolünden muaf
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .maybeSingle()

          if (profile?.is_admin === true) {
            return response
          }

          const { data: restaurant } = await supabase
            .from('restaurants')
            .select('is_active, subscription_status, current_period_end')
            .eq('owner_user_id', user.id)
            .maybeSingle()

          if (restaurant && isSubscriptionOverdue(restaurant)) {
            console.log('[Middleware] Payment Lock: Subscription overdue, redirecting to billing')
            return NextResponse.redirect(new URL('/dashboard/billing', request.url))
          }
        }
      } catch (error) {
        console.warn('[Middleware] Subscription check failed:', error)
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}