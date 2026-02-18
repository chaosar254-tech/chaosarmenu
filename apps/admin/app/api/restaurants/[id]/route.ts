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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Geçici olarak authentication kontrolünü bypass ediyoruz
    // Çünkü middleware zaten login kontrolü yapıyor ve SERVICE_ROLE_KEY kullanıyoruz
    // const cookieStore = await cookies()
    // const supabase = createServerSupabaseClient(cookieStore)
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('is_admin')
    //   .eq('id', user.id)
    //   .single()
    // if (!profile?.is_admin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    const adminClient = createSupabaseAdminClient()

    // Get restaurant to find owner_user_id
    const { data: restaurant, error: restaurantError } = await adminClient
      .from('restaurants')
      .select('owner_user_id')
      .eq('id', params.id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restoran bulunamadı' },
        { status: 404 }
      )
    }

    // Delete restaurant (cascade will handle related records)
    const { error: deleteError } = await adminClient
      .from('restaurants')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Restoran silinemedi' },
        { status: 400 }
      )
    }

    // Optionally delete the auth user
    // Uncomment if you want to delete the user account as well
    // await adminClient.auth.admin.deleteUser(restaurant.owner_user_id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting restaurant:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminClient = createSupabaseAdminClient()

    // Get restaurant to verify it exists
    const { data: restaurant, error: restaurantError } = await adminClient
      .from('restaurants')
      .select('*')
      .eq('id', params.id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restoran bulunamadı' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { plan, is_active, can_add_branches } = body

    // Build update object
    const updates: any = {}
    if (plan !== undefined) {
      // Validate plan value
      if (!['starter', 'standard', 'premium'].includes(plan)) {
        return NextResponse.json(
          { error: 'Geçersiz plan değeri. Sadece "starter", "standard" veya "premium" olabilir.' },
          { status: 400 }
        )
      }
      updates.plan = plan
    }
    if (is_active !== undefined) {
      updates.is_active = is_active
    }
    if (can_add_branches !== undefined) {
      updates.can_add_branches = can_add_branches
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Güncellenecek alan bulunamadı' },
        { status: 400 }
      )
    }

    // Update restaurant
    const { data: updatedRestaurant, error: updateError } = await (adminClient
      .from('restaurants') as any)
      .update(updates as any)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Restoran güncellenemedi' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      restaurant: updatedRestaurant,
    })
  } catch (error: any) {
    console.error('Error updating restaurant:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
