import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const cookieDomain = process.env.NODE_ENV === 'production' ? '.chaosarmenu.com' : undefined

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any) {
          const opts = (o: any) => ({ ...o, ...(cookieDomain && { domain: cookieDomain }) })
          cookiesToSet.forEach(({ name, value }: any) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }: any) =>
            response.cookies.set(name, value, opts(options || {}))
          )
        },
      },
    }
  )

  // Refresh the token
  const { data: { user } } = await supabase.auth.getUser()

  // If user is authenticated and trying to access /unauthorized, check their role and redirect appropriately
  if (user && request.nextUrl.pathname === '/unauthorized') {
    try {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()

      const isAdmin = profile?.is_admin === true

      if (isAdmin) {
        // User is admin, redirect to admin dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Check if user owns a restaurant
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_user_id', user.id)
        .maybeSingle()

      if (restaurant) {
        // User is a restaurant owner, redirect to restaurant dashboard
        return NextResponse.redirect(new URL('https://dashboard.chaosarmenu.com', request.url))
      }

      // User has no role, allow access to unauthorized page
    } catch (error) {
      // If there's an error checking roles, allow through (unauthorized page will handle it)
      console.warn('[Middleware] Error checking user role:', error)
    }
  }

  // If user is authenticated and trying to access /login, redirect to their dashboard
  if (user && request.nextUrl.pathname === '/login') {
    try {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()

      const isAdmin = profile?.is_admin === true

      if (isAdmin) {
        // User is admin, redirect to admin dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Check if user owns a restaurant
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_user_id', user.id)
        .maybeSingle()

      if (restaurant) {
        // User is a restaurant owner, redirect to restaurant dashboard
        return NextResponse.redirect(new URL('https://dashboard.chaosarmenu.com', request.url))
      }

      // User has no role, allow access to login page (they might want to logout)
    } catch (error) {
      // If there's an error checking roles, allow through
      console.warn('[Middleware] Error checking user role:', error)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
