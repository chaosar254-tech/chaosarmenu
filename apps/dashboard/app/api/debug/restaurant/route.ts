import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * DEBUG endpoint to check restaurant status
 * GET /api/debug/restaurant
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        authError: authError?.message,
      }, { status: 401 })
    }

    // Try single query
    const { data: restaurantSingle, error: errorSingle } = await supabase
      .from('restaurants')
      .select('id, name, slug, owner_user_id, created_at')
      .eq('owner_user_id', user.id)
      .single()

    // Try maybeSingle query
    const { data: restaurantMaybe, error: errorMaybe } = await supabase
      .from('restaurants')
      .select('id, name, slug, owner_user_id, created_at')
      .eq('owner_user_id', user.id)
      .maybeSingle()

    // Try multiple query
    const { data: restaurantsAll, error: errorAll } = await supabase
      .from('restaurants')
      .select('id, name, slug, owner_user_id, created_at')
      .eq('owner_user_id', user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      queries: {
        single: {
          data: restaurantSingle,
          error: errorSingle ? {
            message: errorSingle.message,
            code: errorSingle.code,
            details: errorSingle.details,
            hint: errorSingle.hint,
          } : null,
        },
        maybeSingle: {
          data: restaurantMaybe,
          error: errorMaybe ? {
            message: errorMaybe.message,
            code: errorMaybe.code,
            details: errorMaybe.details,
            hint: errorMaybe.hint,
          } : null,
        },
        all: {
          count: restaurantsAll?.length || 0,
          data: restaurantsAll,
          error: errorAll ? {
            message: errorAll.message,
            code: errorAll.code,
            details: errorAll.details,
            hint: errorAll.hint,
          } : null,
        },
      },
      summary: {
        hasRestaurant: !!restaurantMaybe,
        restaurantCount: restaurantsAll?.length || 0,
        recommendedAction: !restaurantMaybe 
          ? 'Restoran bulunamadı. Admin panelinden bir restoran oluşturulması gerekiyor.'
          : 'Restoran bulundu.',
      },
    })
  } catch (error: any) {
    console.error('[DEBUG] Restaurant check error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}
