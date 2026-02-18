import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import {
  callSubscriptionCheckoutFormInitialize,
  getPricingPlanReferenceCode,
  type IyzicoPlanSlug,
} from '@/lib/iyzico'

export const dynamic = 'force-dynamic'

const VALID_PLANS: IyzicoPlanSlug[] = ['starter', 'standart', 'pro']

function parsePlan(s: unknown): IyzicoPlanSlug | null {
  if (typeof s !== 'string') return null
  if (VALID_PLANS.includes(s as IyzicoPlanSlug)) return s as IyzicoPlanSlug
  return null
}

/**
 * POST /api/payment/iyzico-checkout-form
 * Iyzico abonelik checkout formu başlatır; checkoutFormContent ve token döner.
 * Body: { plan: 'starter'|'standart'|'pro', restaurant_id: string, period?: 'monthly'|'yearly' }
 *
 * Vercel env (zorunlu):
 * - IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL (örn: https://api.iyzipay.com)
 * - NEXT_PUBLIC_CALLBACK_URL: Ödeme dönüş URL'i (örn: https://dashboard.chaosarmenu.com/api/payment/iyzico-callback). Verilmezse request origin kullanılır.
 * - Aylık: IYZICO_PLAN_STARTER, IYZICO_PLAN_STANDARD, IYZICO_PLAN_PRO
 * - Yıllık: IYZICO_PLAN_STARTER_YEARLY, IYZICO_PLAN_STANDARD_YEARLY, IYZICO_PLAN_PRO_YEARLY
 */
const VALID_PERIODS = ['monthly', 'yearly'] as const
type PlanPeriod = (typeof VALID_PERIODS)[number]

function parsePeriod(s: unknown): PlanPeriod {
  if (typeof s === 'string' && VALID_PERIODS.includes(s as PlanPeriod)) return s as PlanPeriod
  return 'monthly'
}

/** Iyzico bazen Türkçe karakterde sorun çıkarıyor; ASCII karşılıklara çeviriyoruz. */
function normalizeForIyzico(value: string): string {
  if (!value || typeof value !== 'string') return ''
  const map: Record<string, string> = {
    ı: 'i', İ: 'I', ğ: 'g', Ğ: 'G', ü: 'u', Ü: 'U', ş: 's', Ş: 'S', ö: 'o', Ö: 'O', ç: 'c', Ç: 'C',
  }
  return value
    .trim()
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .replace(/\s+/g, ' ')
}

function ensureNonEmpty(str: string | undefined | null, fallback: string): string {
  const s = typeof str === 'string' ? str.trim() : ''
  return s.length > 0 ? s : fallback
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const planParam = body?.plan
    const restaurantId = body?.restaurant_id
    const periodParam = body?.period

    const period = parsePeriod(periodParam)
    console.log('[Iyzico Checkout Form] Request:', { plan: planParam, restaurant_id: restaurantId, period })

    const plan = parsePlan(planParam)
    if (!plan) {
      return NextResponse.json(
        { error: 'Geçersiz plan. starter, standart veya pro olmalı.' },
        { status: 400 }
      )
    }
    if (!restaurantId || typeof restaurantId !== 'string') {
      return NextResponse.json(
        { error: 'restaurant_id gerekli.' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
    }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id, owner_user_id, name')
      .eq('id', restaurantId)
      .eq('owner_user_id', user.id)
      .maybeSingle()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restoran bulunamadı veya yetkiniz yok.' }, { status: 404 })
    }

    const pricingPlanReferenceCode = getPricingPlanReferenceCode(plan, period)
    const callbackBase = process.env.NEXT_PUBLIC_CALLBACK_URL?.trim()
    const callbackUrl = callbackBase
      ? `${callbackBase.replace(/\/+$/, '')}?restaurant_id=${encodeURIComponent(restaurantId)}&plan=${encodeURIComponent(plan)}&period=${encodeURIComponent(period)}`
      : `${request.nextUrl.origin}/api/payment/iyzico-callback?restaurant_id=${encodeURIComponent(restaurantId)}&plan=${encodeURIComponent(plan)}&period=${encodeURIComponent(period)}`

    const rawName = ensureNonEmpty(user.user_metadata?.name ?? user.email?.split('@')[0], 'Restoran Sahibi')
    const rawSurname = ensureNonEmpty(user.user_metadata?.surname, 'Restoran Sahibi')
    const name = normalizeForIyzico(rawName).slice(0, 50) || 'Restoran Sahibi'
    const surname = normalizeForIyzico(rawSurname).slice(0, 50) || 'Restoran Sahibi'

    const email = ensureNonEmpty(user.email, `user-${user.id}@placeholder.local`)
    const gsmNumber = ensureNonEmpty(user.user_metadata?.phone, '+905550000000')
    const identityNumber = ensureNonEmpty(user.user_metadata?.identity_number, '11111111110')

    const rawAddress = restaurant.name ? `${restaurant.name} - Restoran` : 'Türkiye'
    const addressLine = normalizeForIyzico(ensureNonEmpty(rawAddress, 'Istanbul')).slice(0, 200)
    const contactName = `${name} ${surname}`.trim().slice(0, 100) || 'Restoran Sahibi'
    const city = normalizeForIyzico(ensureNonEmpty(user.user_metadata?.city, 'Istanbul')).slice(0, 50)
    const country = 'Turkey'

    const customer = {
      name,
      surname,
      email,
      gsmNumber,
      identityNumber,
      billingAddress: {
        address: addressLine,
        zipCode: '34000',
        contactName,
        city,
        country,
      },
      shippingAddress: {
        address: addressLine,
        zipCode: '34000',
        contactName,
        city,
        country,
      },
    }

    const subscriptionPlanForCallback = plan === 'standart' ? 'standard' : plan === 'pro' ? 'premium' : 'starter'

    const { checkoutFormContent, token } = await callSubscriptionCheckoutFormInitialize({
      pricingPlanReferenceCode,
      callbackUrl,
      subscriptionInitialStatus: 'ACTIVE',
      locale: 'tr',
      conversationId: `rest-${restaurantId}-plan-${plan}-${Date.now()}`,
      customer,
      force3Ds: 1,
    })

    return NextResponse.json({
      success: true,
      checkoutFormContent,
      token,
      subscription_plan: subscriptionPlanForCallback,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Bilinmeyen hata'
    console.error('[Iyzico Checkout Form]', message, err)

    if (message.includes('API anahtarı hatalı')) {
      return NextResponse.json({ error: message, code: 'IYZICO_AUTH_ERROR' }, { status: 401 })
    }
    if (message.includes('Plan bulunamadı') || message.includes('Plan kodu')) {
      return NextResponse.json({ error: message, code: 'IYZICO_PLAN_NOT_FOUND' }, { status: 400 })
    }
    if (message.includes('ortam değişkeni')) {
      return NextResponse.json({ error: message, code: 'IYZICO_ENV_MISSING' }, { status: 500 })
    }

    return NextResponse.json(
      { error: message, code: 'IYZICO_ERROR' },
      { status: 500 }
    )
  }
}
