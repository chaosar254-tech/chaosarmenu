import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/** Cookie domain for cross-subdomain auth (chaosarmenu.com, dashboard.chaosarmenu.com). */
function getCookieDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') return undefined
  if (hostname === 'chaosarmenu.com' || hostname.endsWith('.chaosarmenu.com')) return '.chaosarmenu.com'
  return undefined
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookieOptions: {
    domain: getCookieDomain(),
    path: '/',
    sameSite: 'lax',
    secure: typeof window !== 'undefined' && window.location?.protocol === 'https:',
  },
})

