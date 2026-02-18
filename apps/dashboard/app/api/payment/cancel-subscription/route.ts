import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { cancelSubscription } from '@/lib/iyzico'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payment/cancel-subscription
 * Iyzico aboneliğini iptal eder; veritabanında cancel_at_period_end = true yapar.
 * Kullanıcı parası ödenmiş dönemin sonuna (current_period_end) kadar paneli kullanmaya devam eder.
 */
export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, iyzico_sub_reference, cancel_at_period_end, current_period_end')
      .eq('owner_user_id', user.id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    if (restaurant.cancel_at_period_end) {
      return NextResponse.json({
        success: true,
        message: 'Abonelik zaten iptal edilecek şekilde işaretlendi.',
        current_period_end: restaurant.current_period_end,
      })
    }

    const referenceCode = restaurant.iyzico_sub_reference?.trim()
    if (!referenceCode) {
      return NextResponse.json(
        { error: 'Abonelik referansı bulunamadı. Önce bir abonelik başlatmış olmalısınız.' },
        { status: 400 }
      )
    }

    await cancelSubscription(referenceCode)

    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ cancel_at_period_end: true })
      .eq('id', restaurant.id)

    if (updateError) {
      console.error('[Cancel Subscription] DB update failed:', updateError)
      return NextResponse.json(
        { error: 'İptal Iyzico tarafında tamamlandı ancak kayıt güncellenemedi.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Abonelik iptal edildi. Ödediğiniz dönemin sonuna kadar paneli kullanmaya devam edebilirsiniz.',
      current_period_end: restaurant.current_period_end,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bilinmeyen hata'
    console.error('[Cancel Subscription]', message, err)
    if (message.includes('Iyzico cancel:')) {
      return NextResponse.json(
        { error: message.replace(/^Iyzico cancel: /, '') },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Abonelik iptal edilemedi.' }, { status: 500 })
  }
}
