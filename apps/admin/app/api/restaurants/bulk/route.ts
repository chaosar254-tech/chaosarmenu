import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { logActivity } from '../../../activity-logs/logger'

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

export async function PUT(request: NextRequest) {
  try {
    // Get admin user for activity logging
    const cookieStore = await cookies()
    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(
      SUPABASE_URL,
      'sb_publishable_XmtDASp8l0cdNY-neWiLhQ_SpCsuTxX',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createSupabaseAdminClient()
    const body = await request.json()
    const { restaurantIds, action, value } = body

    if (!Array.isArray(restaurantIds) || restaurantIds.length === 0) {
      return NextResponse.json(
        { error: 'Restoran ID listesi gereklidir' },
        { status: 400 }
      )
    }

    if (!action || !['plan', 'is_active', 'can_add_branches'].includes(action)) {
      return NextResponse.json(
        { error: 'Geçersiz işlem. plan, is_active veya can_add_branches olmalıdır.' },
        { status: 400 }
      )
    }

    // Validate plan value if action is plan
    if (action === 'plan' && !['starter', 'standard', 'premium'].includes(value)) {
      return NextResponse.json(
        { error: 'Geçersiz plan değeri' },
        { status: 400 }
      )
    }

    // Validate boolean value if action is is_active or can_add_branches
    if ((action === 'is_active' || action === 'can_add_branches') && typeof value !== 'boolean') {
      return NextResponse.json(
        { error: 'Geçersiz değer. Boolean olmalıdır.' },
        { status: 400 }
      )
    }

    // Get current values for logging
    const { data: currentRestaurants } = await adminClient
      .from('restaurants')
      .select('id, name, plan, is_active, can_add_branches')
      .in('id', restaurantIds)

    // Build update object
    const updates: any = {}
    updates[action] = value

    // Perform bulk update
    const { data: updatedRestaurants, error: updateError } = await (adminClient
      .from('restaurants') as any)
      .update(updates as any)
      .in('id', restaurantIds)
      .select()

    if (updateError) {
      console.error('Bulk update error:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Toplu güncelleme başarısız' },
        { status: 400 }
      )
    }

    // Log activity for each restaurant
    for (const restaurantId of restaurantIds) {
      const currentRestaurant = currentRestaurants?.find(r => r.id === restaurantId)
      const changes = {
        old: currentRestaurant ? { [action]: currentRestaurant[action as keyof typeof currentRestaurant] } : {},
        new: { [action]: value },
      }

      await logActivity(
        user.id,
        'update',
        'restaurant',
        restaurantId,
        changes,
        `Toplu işlem: ${action} değiştirildi`,
        request
      )
    }

    return NextResponse.json({
      success: true,
      updated: updatedRestaurants?.length || 0,
      message: `${updatedRestaurants?.length || 0} restoran başarıyla güncellendi`,
    })
  } catch (error: any) {
    console.error('Error in bulk update:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
