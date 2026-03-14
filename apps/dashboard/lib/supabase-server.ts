import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const cookieDomain = process.env.NODE_ENV === 'production' ? '.chaosarmenu.com' : undefined

/**
 * Server-side Supabase client. cookieStore MUST be from await cookies() inside an async function.
 * Never call cookies() at top level or pass a Promise.
 */
export function createServerSupabaseClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  if (!cookieStore || typeof cookieStore.get !== 'function') {
    throw new Error(
      '[Supabase] createServerSupabaseClient requires cookieStore from await cookies(). ' +
        'Ensure you call: const cookieStore = await cookies(); createServerSupabaseClient(cookieStore)'
    )
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...(cookieDomain && { domain: cookieDomain }), ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...(cookieDomain && { domain: cookieDomain }), ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

