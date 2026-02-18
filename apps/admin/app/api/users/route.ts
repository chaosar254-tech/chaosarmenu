import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Hardcode Supabase Admin Client (Service Role Key)
const SUPABASE_URL = "https://kenrjnphvocixvbbvwvy.supabase.co"
const SUPABASE_SERVICE_ROLE_KEY = "sb_secret_yJn8IqcaYnf9gJAZXshjqg_rUygjxTL"

const createSupabaseAdminClient = () => {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const adminClient = createSupabaseAdminClient()
    
    // Get all users from auth
    // Use high perPage value to get all users (Supabase default is 50, we set to 1000 to get all)
    const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers({
      perPage: 1000, // Get up to 1000 users (should be enough for most cases)
    })
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Kullanıcılar yüklenemedi' },
        { status: 500 }
      )
    }

    // Get profiles for additional info
    const { data: profilesData } = await adminClient
      .from('profiles')
      .select('id, is_admin')

    // Get restaurants for each user
    const { data: restaurantsData } = await adminClient
      .from('restaurants')
      .select('id, name, owner_user_id, plan, is_active, created_at')

    // Combine user data with profiles and restaurants
    const usersWithDetails = usersData.users.map(user => {
      const profile = profilesData?.find(p => p.id === user.id)
      const userRestaurants = restaurantsData?.filter(r => r.owner_user_id === user.id) || []
      
      // Check if user is actually banned (ban_expires_at exists and is in the future)
      // Supabase Auth uses 'ban_expires_at' field
      const banExpiresAt = (user as any).ban_expires_at || (user as any).banned_until
      const now = new Date()
      const isBanned = banExpiresAt ? new Date(banExpiresAt) > now : false
      
      // Debug: Log first user's ban status
      if (usersData.users.indexOf(user) === 0) {
        console.log('User ban check:', {
          email: user.email,
          ban_expires_at: (user as any).ban_expires_at,
          banned_until: (user as any).banned_until,
          isBanned,
          now: now.toISOString(),
        })
      }
      
      return {
        id: user.id,
        email: user.email,
        email_confirmed: !!user.email_confirmed_at,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        banned_until: isBanned ? banExpiresAt : null,
        is_admin: profile?.is_admin || false,
        restaurant_count: userRestaurants.length,
        restaurants: userRestaurants.map(r => ({
          id: r.id,
          name: r.name,
          plan: r.plan,
          is_active: r.is_active,
        })),
      }
    })

    return NextResponse.json({ users: usersWithDetails })
  } catch (error: any) {
    console.error('Error in GET /api/users:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
