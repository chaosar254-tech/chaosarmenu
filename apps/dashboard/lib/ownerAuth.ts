import { createServerSupabaseClient } from './supabase-server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Check if current user owns a restaurant
 * Returns { user, restaurant } if owner, null otherwise
 * Redirects to /login if not authenticated
 */
export async function requireOwner() {
  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Check if user owns a restaurant
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug')
    .eq('owner_user_id', user.id)
    .single()

  return {
    user,
    restaurant: restaurant || null,
  }
}

