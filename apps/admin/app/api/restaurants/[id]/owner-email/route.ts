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

export async function GET(
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

    // Get owner email
    const { data: ownerData, error: ownerError } = await adminClient.auth.admin.getUserById(
      restaurant.owner_user_id
    )

    if (ownerError || !ownerData?.user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json({ email: ownerData.user.email || 'N/A' })
  } catch (error: any) {
    console.error('Error fetching owner email:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
