/**
 * Server-only Supabase admin client using SERVICE ROLE KEY.
 * 
 * IMPORTANT: This file must NEVER be imported in client components.
 * The service role key bypasses RLS and must only be used server-side.
 * 
 * Usage:
 *   import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'
 *   const adminClient = createSupabaseAdminClient()
 */

import { createClient } from '@supabase/supabase-js'

let adminClient: ReturnType<typeof createClient> | null = null

export function createSupabaseAdminClient() {
  if (adminClient) {
    return adminClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  adminClient = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}


