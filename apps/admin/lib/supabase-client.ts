/**
 * Client-side Supabase client for browser use.
 * Bu dosya sadece client component'lerde import edilmelidir.
 * Ortak cookie domain'i ve güvenli ayarlarla @supabase/ssr createBrowserClient kullanır.
 */

import { createBrowserClient } from '@supabase/ssr'

// Helper function to get and validate environment variables
function getSupabaseEnvVars() {
  // Get environment variables - these must be set in Vercel or .env.local
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || ''

  // Debug: Log what we're getting (in development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Supabase Client] Environment check:', {
      hasUrl: !!supabaseUrl,
      urlLength: supabaseUrl.length,
      hasKey: !!supabaseAnonKey,
      keyLength: supabaseAnonKey.length,
      urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
    })
  }

  // Remove trailing slashes and quotes from URL
  supabaseUrl = supabaseUrl.replace(/\/+$/, '').replace(/^["']|["']$/g, '')
  supabaseAnonKey = supabaseAnonKey.replace(/^["']|["']$/g, '')

  // Validate that environment variables are set
  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = 
      'CRITICAL ERROR: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing!\n' +
      'Please check:\n' +
      '1. Your .env.local file exists in apps/admin/.env.local\n' +
      '2. The variables are named correctly (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)\n' +
      '3. You have restarted the dev server after adding/changing .env.local\n' +
      `Current values: URL=${supabaseUrl ? 'SET' : 'MISSING'}, KEY=${supabaseAnonKey ? 'SET' : 'MISSING'}`
    throw new Error(errorMsg)
  }

  // Validate URL format: https://<project-ref>.supabase.co
  if (!supabaseUrl.match(/^https:\/\/[a-z0-9-]+\.supabase\.co$/)) {
    throw new Error(
      `CRITICAL ERROR: NEXT_PUBLIC_SUPABASE_URL is invalid! Expected format: https://<project-ref>.supabase.co, got: ${supabaseUrl}`
    )
  }

  return { supabaseUrl, supabaseAnonKey }
}

// Singleton pattern: Create client only once
let supabaseBrowserClient: ReturnType<typeof createBrowserClient> | undefined

export function createSupabaseBrowserClient() {
  if (supabaseBrowserClient) {
    return supabaseBrowserClient
  }

  // Get and validate environment variables at runtime
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnvVars()

  console.log('[Supabase Client] Initialized with URL:', supabaseUrl)

  // ÖNEMLİ: createBrowserClient için custom cookies objesi geçmiyoruz.
  // GoTrueClient, dahili olarak document.cookie üzerinden çalışıyor.
  supabaseBrowserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      name: 'sb-auth-token',
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      domain: (() => {
        if (typeof window === 'undefined') return undefined
        const hostname = window.location.hostname
        if (hostname === 'localhost' || hostname === '127.0.0.1') return undefined
        if (hostname === 'chaosarmenu.com' || hostname.endsWith('.chaosarmenu.com')) return '.chaosarmenu.com'
        return undefined
      })(),
    },
  })

  return supabaseBrowserClient
}

// Export singleton instance for backward compatibility
export const supabase = createSupabaseBrowserClient()
