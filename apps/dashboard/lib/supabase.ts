'use client'

import 'client-only'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** Cookie domain for cross-subdomain auth (chaosarmenu.com, dashboard.chaosarmenu.com). */
function getCookieDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') return undefined
  if (hostname === 'chaosarmenu.com' || hostname.endsWith('.chaosarmenu.com')) return '.chaosarmenu.com'
  return undefined
}

let _client: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error(
      '[Supabase] createBrowserClient can only be used in the browser. ' +
        'Use createServerSupabaseClient(cookieStore) in Server Components/Route Handlers.'
    )
  }
  if (_client) return _client
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  }
  _client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return undefined
        const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
        return match ? decodeURIComponent(match[2]) : undefined
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        if (typeof document === 'undefined') return
        const path = (options.path as string) || '/'
        let cookie = `${name}=${encodeURIComponent(value)}; path=${path}`
        if (options.maxAge != null) cookie += `; max-age=${options.maxAge}`
        if (options.sameSite) cookie += `; samesite=${options.sameSite as string}`
        if (options.secure) cookie += '; secure'
        if (options.domain) cookie += `; domain=${options.domain}`
        document.cookie = cookie
      },
      remove(name: string, options: Record<string, unknown>) {
        if (typeof document === 'undefined') return
        const path = (options.path as string) || '/'
        document.cookie = `${name}=; path=${path}; max-age=0`
      },
    },
    cookieOptions: {
      domain: getCookieDomain(),
      path: '/',
      sameSite: 'lax',
      secure: window.location?.protocol === 'https:',
    },
  })
  return _client
}

/**
 * Client-side Supabase. Use ONLY in Client Components.
 * Lazy-initialized on first access (browser only) to avoid SSR "cookies.get" errors.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabase()[prop as keyof SupabaseClient]
  },
})

