/**
 * Server-only Supabase admin client using SERVICE ROLE KEY.
 * * IMPORTANT: This file must NEVER be imported in client components.
 * The service role key bypasses RLS and must only be used server-side.
 */

import { createClient } from '@supabase/supabase-js'

export function createSupabaseAdminClient() {
  // 1. URL'yi ortam değişkeninden al (yoksa boş string dönsün ki hata fırlatabilelim)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  // 2. Service Role Key'i Vercel'in gizli kasasından al
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // 3. Kontrol et: Eğer Vercel'e eklemeyi unuttuysan hemen hata versin
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "KRİTİK HATA: Supabase URL veya Service Role Key bulunamadı! Lütfen Vercel Environment Variables ayarlarını kontrol et."
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}