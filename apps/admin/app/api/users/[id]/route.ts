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

// GET: Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminClient = createSupabaseAdminClient()
    const userId = params.id

    // Get user from auth
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId)
    
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Get profile
    const { data: profileData } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Get user's restaurants
    const { data: restaurantsData } = await adminClient
      .from('restaurants')
      .select('*')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false })

    // Get user's activity logs (if exists)
    const { data: activityLogs } = await adminClient
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    // Check if user is actually banned (ban_expires_at exists and is in the future)
    const banExpiresAt = (userData.user as any).ban_expires_at || (userData.user as any).banned_until
    const isBanned = banExpiresAt && new Date(banExpiresAt) > new Date()

    const userDetails = {
      id: userData.user.id,
      email: userData.user.email,
      email_confirmed: !!userData.user.email_confirmed_at,
      email_confirmed_at: userData.user.email_confirmed_at,
      created_at: userData.user.created_at,
      last_sign_in_at: userData.user.last_sign_in_at,
      banned_until: isBanned ? banExpiresAt : null,
      is_admin: profileData?.is_admin || false,
      profile: profileData,
      restaurants: restaurantsData || [],
      activity_logs: activityLogs || [],
    }

    return NextResponse.json({ user: userDetails })
  } catch (error: any) {
    console.error('Error in GET /api/users/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

// PUT: Update user (ban/unban, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminClient = createSupabaseAdminClient()
    const userId = params.id
    const body = await request.json()
    const { action, banned_until } = body

    if (action === 'ban') {
      // Ban user
      const banDate = banned_until ? new Date(banned_until) : new Date('2099-12-31')
      const { error } = await adminClient.auth.admin.updateUserById(userId, {
        ban_expires_at: banDate.toISOString(),
      })

      if (error) {
        return NextResponse.json(
          { error: 'Kullanıcı yasaklanamadı: ' + error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Kullanıcı yasaklandı' 
      })
    } else if (action === 'unban') {
      // Unban user
      const { error } = await adminClient.auth.admin.updateUserById(userId, {
        ban_expires_at: null,
      })

      if (error) {
        return NextResponse.json(
          { error: 'Kullanıcı yasağı kaldırılamadı: ' + error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Kullanıcı yasağı kaldırıldı' 
      })
    } else if (action === 'reset_password') {
      // Reset password (send reset email)
      const { error } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: body.email,
      })

      if (error) {
        return NextResponse.json(
          { error: 'Şifre sıfırlama e-postası gönderilemedi: ' + error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Şifre sıfırlama e-postası gönderildi' 
      })
    }

    return NextResponse.json(
      { error: 'Geçersiz işlem' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error in PUT /api/users/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
