import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PAYMENT_PENDING_PATH = '/odeme-bekleniyor'

/**
 * Restoran erişim açık mı?
 * is_active true, subscription_status 'active' ve current_period_end (varsa) gelecekte olmalı.
 */
function hasActiveAccess(row: {
  is_active?: boolean
  subscription_status: string | null
  current_period_end: string | null
} | null): boolean {
  if (!row) return false
  if (row.is_active === false) return false
  if (row.subscription_status !== 'active') return false
  if (row.current_period_end) {
    if (new Date(row.current_period_end) <= new Date()) return false
  }
  return true
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Sadece menü rotalarını kontrol et: /menu/:restaurantSlug/... (ve /menu/:restaurantSlug)
  if (!pathname.startsWith('/menu/')) {
    return NextResponse.next()
  }

  // /menu/[restaurantSlug]/[branchSlug] veya /menu/[restaurantSlug] — ilk segment restoran slug
  const menuMatch = pathname.match(/^\/menu\/([^/]+)(?:\/|$)/)
  if (!menuMatch) return NextResponse.next()

  const restaurantSlug = menuMatch[1]
  if (!restaurantSlug) return NextResponse.next()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next()
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('is_active, subscription_status, current_period_end')
      .eq('slug', restaurantSlug)
      .maybeSingle()

    if (!hasActiveAccess(restaurant)) {
      const url = new URL(PAYMENT_PENDING_PATH, request.url)
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }
  } catch (e) {
    console.warn('[Menu Middleware] Subscription check failed:', e)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/menu/:path*'],
}
