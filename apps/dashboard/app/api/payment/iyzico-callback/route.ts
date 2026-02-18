import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { calculateNextPeriodEnd } from '@/lib/subscription-utils'
import { getSubscriptionCheckoutFormResult } from '@/lib/iyzico'

export const dynamic = 'force-dynamic'

/** Ödeme dönüşünde kullanıcıyı ana domain'e yönlendir (cookie/oturum doğru domain'de okunsun). */
function getDashboardOrigin(): string {
  try {
    const callbackUrl = process.env.NEXT_PUBLIC_CALLBACK_URL?.trim()
    if (callbackUrl) {
      const u = new URL(callbackUrl)
      return u.origin
    }
  } catch {
    /* ignore */
  }
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    try {
      const u = new URL(process.env.NEXT_PUBLIC_APP_URL.trim())
      return u.origin
    } catch {
      /* ignore */
    }
  }
  return ''
}

function redirectToBilling(success: boolean, requestOrigin: string) {
  const base = getDashboardOrigin() || requestOrigin || (process.env?.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const url = new URL('/dashboard/billing', base)
  url.searchParams.set('payment', success ? 'success' : 'failed')
  return NextResponse.redirect(url)
}

/** Plan + period -> amount (TRY), SubscriptionCard ile aynı fiyatlar */
function getPlanAmount(plan: 'starter' | 'standard' | 'premium', period: 'monthly' | 'yearly'): number {
  const map: Record<string, { monthly: number; yearly: number }> = {
    starter: { monthly: 990, yearly: 11286 },
    standard: { monthly: 1490, yearly: 16092 },
    premium: { monthly: 2490, yearly: 26892 },
  }
  return map[plan]?.[period] ?? map.starter.monthly
}

/**
 * GET /api/payment/iyzico-callback?token=xxx&restaurant_id=yyy&plan=starter
 * Iyzico abonelik checkout formu tamamlandığında tarayıcı bu URL'e GET ile yönlendirir.
 * Token ile Iyzico'dan sonucu alıp restoranı günceller ve /dashboard/billing'e yönlendirir.
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Iyzico Callback GET] Başladı')
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const restaurantId = searchParams.get('restaurant_id')
    const planParam = searchParams.get('plan')
    const periodParam = (searchParams.get('period') as 'monthly' | 'yearly' | null) || 'monthly'

    if (!token || !restaurantId) {
      console.error('[Iyzico Callback GET] Missing token or restaurant_id', { hasToken: !!token, hasRestaurantId: !!restaurantId })
      return redirectToBilling(false, request.nextUrl.origin)
    }
    console.log('[Iyzico Callback GET] Token alındı, restoran_id:', restaurantId, 'plan:', planParam)

    const subscriptionPlan = planParam === 'standart' ? 'standard' : planParam === 'pro' ? 'premium' : 'starter'

    console.log('[Iyzico Callback GET] Restoran aranıyor:', restaurantId)
    const adminClient = createSupabaseAdminClient()
    console.log('[Iyzico Callback GET] Supabase admin client oluşturuldu (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY kullanılıyor)')
    const { data: restaurant, error: restaurantError } = await adminClient
      .from('restaurants')
      .select('id')
      .eq('id', restaurantId)
      .single()

    if (restaurantError || !restaurant) {
      console.error('[Iyzico Callback GET] Restoran bulunamadı:', restaurantId, restaurantError)
      return redirectToBilling(false, request.nextUrl.origin)
    }
    console.log('[Iyzico Callback GET] Restoran bulundu:', restaurantId)

    console.log('[Iyzico Callback GET] Iyzico sonucu bekleniyor (getSubscriptionCheckoutFormResult)...')
    const result = await getSubscriptionCheckoutFormResult(token)
    console.log('[Iyzico Callback GET] Iyzico sonucu alındı:', result?.subscriptionStatus ?? (result ? 'ok' : 'null'))
    if (!result || result.subscriptionStatus !== 'ACTIVE') {
      console.log('[Iyzico Callback GET] Abonelik aktif değil:', result?.subscriptionStatus)
      return redirectToBilling(false, request.nextUrl.origin)
    }

    const nextPeriodEnd = result.endDate
      ? new Date(typeof result.endDate === 'number' ? result.endDate : Number(result.endDate))
      : calculateNextPeriodEnd()

    console.log('[Iyzico Callback GET] Veritabanı güncelleniyor (restaurants)...')
    const { error: updateError } = await adminClient
      .from('restaurants')
      .update({
        is_active: true,
        subscription_status: 'active',
        subscription_plan: subscriptionPlan,
        current_period_end: nextPeriodEnd.toISOString(),
        iyzico_sub_reference: result.referenceCode,
      })
      .eq('id', restaurantId)

    if (updateError) {
      console.error('[Iyzico Callback GET] Veritabanı güncellemesi başarısız:', updateError)
      return redirectToBilling(false, request.nextUrl.origin)
    }

    const amount = getPlanAmount(subscriptionPlan, periodParam)
    await adminClient.from('payments').insert({
      restaurant_id: restaurantId,
      amount,
      plan: subscriptionPlan,
      period: periodParam,
      status: 'success',
      paid_at: new Date().toISOString(),
      iyzico_reference: result.referenceCode,
    }).then(({ error: payErr }) => {
      if (payErr) console.error('[Iyzico Callback GET] payments insert:', payErr)
    })

    console.log('[Iyzico Callback GET] Veritabanı güncellendi, yönlendiriliyor (success)')
    return redirectToBilling(true, request.nextUrl.origin)
  } catch (e) {
    const err = e as Error
    console.error('[Iyzico Callback GET] Beklenmeyen hata:', err?.message, err?.stack)
    return NextResponse.json(
      {
        error: err?.message ?? 'Unknown error',
        step: 'iyzico_callback_get',
        ...(process.env.NODE_ENV === 'development' && err?.stack ? { stack: err.stack } : {}),
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/payment/iyzico-callback
 * Iyzico ödeme sonucunu application/x-www-form-urlencoded ile POST eder (token=xxx&restaurant_id=yyy&plan=...).
 * Body JSON değil; request.text() + URLSearchParams ile parse ediyoruz. Token ile Iyzico sonucu alınıp restoran güncellenir.
 */
export async function POST(request: NextRequest) {
  const requestOrigin = new URL(request.url).origin
  let step = 'post_start'
  try {
    console.log('[Iyzico Callback POST] Başladı')
    step = 'post_read_body'
    const rawBody = await request.text()
    console.log('[Iyzico Callback POST] Body alındı (content-type form-urlencoded), uzunluk:', rawBody?.length ?? 0, 'ilk 120 karakter:', rawBody?.slice(0, 120) ?? '')

    step = 'post_parse_params'
    const params = new URLSearchParams(rawBody || '')
    const token = params.get('token')
    const restaurantId = params.get('restaurant_id') || new URL(request.url).searchParams.get('restaurant_id')
    const planParam = params.get('plan') || new URL(request.url).searchParams.get('plan')
    const periodParam = params.get('period') || new URL(request.url).searchParams.get('period')
    const period = periodParam === 'yearly' ? 'yearly' : 'monthly'

    console.log('[Iyzico Callback POST] Parse edildi:', { hasToken: !!token, restaurant_id: restaurantId ?? '(yok)', plan: planParam ?? '(yok)', period })

    if (!token) {
      console.error('[Iyzico Callback POST] Eksik: token yok (body veya URL)', { keys: Array.from(params.keys()) })
      return redirectToBilling(false, requestOrigin)
    }
    if (!restaurantId) {
      console.error('[Iyzico Callback POST] Eksik: restaurant_id yok')
      return redirectToBilling(false, requestOrigin)
    }

    const subscriptionPlan = planParam === 'standart' ? 'standard' : planParam === 'pro' ? 'premium' : 'starter'

    step = 'post_supabase_client'
    console.log('[Iyzico Callback POST] Supabase admin client oluşturuluyor')
    const adminClient = createSupabaseAdminClient()

    step = 'post_restaurant_lookup'
    console.log('[Iyzico Callback POST] Restoran aranıyor:', restaurantId)
    const { data: restaurant, error: restaurantError } = await adminClient
      .from('restaurants')
      .select('id')
      .eq('id', restaurantId)
      .single()

    if (restaurantError || !restaurant) {
      console.error('[Iyzico Callback POST] Restoran bulunamadı:', restaurantId, restaurantError)
      return redirectToBilling(false, requestOrigin)
    }
    console.log('[Iyzico Callback POST] Restoran bulundu:', restaurantId)

    step = 'post_iyzico_result'
    console.log('[Iyzico Callback POST] Iyzico sonucu bekleniyor (getSubscriptionCheckoutFormResult)...')
    const result = await getSubscriptionCheckoutFormResult(token)
    console.log('[Iyzico Callback POST] Iyzico sonucu alındı:', result?.subscriptionStatus ?? (result ? 'ok' : 'null'))

    if (!result || result.subscriptionStatus !== 'ACTIVE') {
      console.log('[Iyzico Callback POST] Abonelik aktif değil, başarısız sayılıyor:', result?.subscriptionStatus)
      return redirectToBilling(false, requestOrigin)
    }

    const nextPeriodEnd = result.endDate
      ? new Date(typeof result.endDate === 'number' ? result.endDate : Number(result.endDate))
      : calculateNextPeriodEnd()

    step = 'post_db_update'
    console.log('[Iyzico Callback POST] Veritabanı güncelleniyor (restaurants)...')
    const { error: updateError } = await adminClient
      .from('restaurants')
      .update({
        is_active: true,
        subscription_status: 'active',
        subscription_plan: subscriptionPlan,
        current_period_end: nextPeriodEnd.toISOString(),
        iyzico_sub_reference: result.referenceCode,
      })
      .eq('id', restaurantId)

    if (updateError) {
      console.error('[Iyzico Callback POST] Veritabanı güncellemesi başarısız:', updateError)
      return redirectToBilling(false, requestOrigin)
    }

    const amount = getPlanAmount(subscriptionPlan, period)
    await adminClient.from('payments').insert({
      restaurant_id: restaurantId,
      amount,
      plan: subscriptionPlan,
      period,
      status: 'success',
      paid_at: new Date().toISOString(),
      iyzico_reference: result.referenceCode,
    }).then(({ error: payErr }) => {
      if (payErr) console.error('[Iyzico Callback POST] payments insert:', payErr)
    })

    console.log('[Iyzico Callback POST] Abonelik aktif edildi, billing sayfasına yönlendiriliyor:', restaurantId, subscriptionPlan)
    return redirectToBilling(true, requestOrigin)
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[Iyzico Callback POST] Beklenmeyen hata:', {
      step,
      message: err.message,
      name: err.name,
      stack: err.stack,
    })
    return redirectToBilling(false, requestOrigin)
  }
}
