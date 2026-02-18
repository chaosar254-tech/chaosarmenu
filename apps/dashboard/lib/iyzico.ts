/**
 * Iyzico API - HMAC-SHA256 auth and Subscription Checkout Form Initialize
 * Env: IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL
 * Plan codes (Iyzico panel Fiyatlandırma Plan Kodu): IYZICO_PLAN_STARTER, IYZICO_PLAN_STANDARD, IYZICO_PLAN_PRO
 */

import crypto from 'crypto'

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    throw new Error(`Iyzico: ${name} ortam değişkeni tanımlı değil`)
  }
  return value.trim()
}

/**
 * Iyzico HMAC-SHA256 Authorization header
 * payload = randomKey + uriPath + bodyString
 * signature = HMAC-SHA256(payload, secretKey)
 * authString = "apiKey:" + apiKey + "&randomKey:" + randomKey + "&signature:" + signature
 * header = "IYZWSv2 " + Base64(authString)
 */
export function generateIyzicoAuthHeader(
  apiKey: string,
  secretKey: string,
  uriPath: string,
  bodyString: string
): { authorization: string; 'x-iyzi-rnd': string } {
  const randomKey = `${Date.now()}${Math.random().toString(36).slice(2, 11)}`
  const payload = bodyString
    ? randomKey + uriPath + bodyString
    : randomKey + uriPath
  const signature = crypto.createHmac('sha256', secretKey).update(payload).digest('hex')
  const authString = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`
  const base64Auth = Buffer.from(authString, 'utf8').toString('base64')
  return {
    authorization: `IYZWSv2 ${base64Auth}`,
    'x-iyzi-rnd': randomKey,
  }
}

const SUBSCRIPTION_INIT_PATH = '/v2/subscription/checkoutform/initialize'
const SUBSCRIPTION_CHECKOUTFORM_RETRIEVE_PATH = '/v2/subscription/checkoutform'

export type IyzicoPlanSlug = 'starter' | 'standart' | 'pro'

/** Plan slug -> env key for pricing plan reference code (monthly) */
export const IYZICO_PLAN_ENV_KEYS: Record<IyzicoPlanSlug, string> = {
  starter: 'IYZICO_PLAN_STARTER',
  standart: 'IYZICO_PLAN_STANDARD',
  pro: 'IYZICO_PLAN_PRO',
}

/** Plan slug -> env key for yearly pricing plan reference code */
export const IYZICO_PLAN_YEARLY_ENV_KEYS: Record<IyzicoPlanSlug, string> = {
  starter: 'IYZICO_PLAN_STARTER_YEARLY',
  standart: 'IYZICO_PLAN_STANDARD_YEARLY',
  pro: 'IYZICO_PLAN_PRO_YEARLY',
}

export type IyzicoPlanPeriod = 'monthly' | 'yearly'

export function getPricingPlanReferenceCode(planSlug: IyzicoPlanSlug, period: IyzicoPlanPeriod = 'monthly'): string {
  const envKey = period === 'yearly' ? IYZICO_PLAN_YEARLY_ENV_KEYS[planSlug] : IYZICO_PLAN_ENV_KEYS[planSlug]
  const code = process.env[envKey]
  if (!code || code.trim() === '') {
    throw new Error(`Iyzico: Plan kodu bulunamadı. ${envKey} (${planSlug}, ${period}) ortam değişkenini Iyzico panelindeki Fiyatlandırma Plan Koduna ayarlayın.`)
  }
  return code.trim()
}

export interface SubscriptionCheckoutCustomer {
  name: string
  surname: string
  email: string
  gsmNumber: string
  identityNumber: string
  billingAddress: {
    address: string
    zipCode: string
    contactName: string
    city: string
    country: string
  }
  shippingAddress: {
    address: string
    zipCode: string
    contactName: string
    city: string
    country: string
  }
}

export interface SubscriptionCheckoutInitRequest {
  pricingPlanReferenceCode: string
  callbackUrl: string
  subscriptionInitialStatus?: 'ACTIVE' | 'PENDING'
  locale?: 'tr' | 'en'
  conversationId?: string
  customer: SubscriptionCheckoutCustomer
  /** 1 = 3D Secure zorunlu (banka kartı ile abonelik için gerekli). 0 ise banka kartları reddedilir. */
  force3Ds?: 0 | 1
}

export interface SubscriptionCheckoutInitResponse {
  status: string
  checkoutFormContent?: string
  token?: string
  errorMessage?: string
  errorCode?: string
}

export async function callSubscriptionCheckoutFormInitialize(
  request: SubscriptionCheckoutInitRequest
): Promise<{ checkoutFormContent: string; token: string }> {
  const apiKey = getEnv('IYZICO_API_KEY')
  const secretKey = getEnv('IYZICO_SECRET_KEY')
  const baseUrl = getEnv('IYZICO_BASE_URL').replace(/\/+$/, '')

  const body = {
    locale: request.locale ?? 'tr',
    callbackUrl: request.callbackUrl,
    pricingPlanReferenceCode: request.pricingPlanReferenceCode,
    subscriptionInitialStatus: request.subscriptionInitialStatus ?? 'ACTIVE',
    conversationId: request.conversationId ?? `conv-${Date.now()}`,
    customer: request.customer,
    force3Ds: request.force3Ds !== undefined ? request.force3Ds : 1,
  }

  const bodyString = JSON.stringify(body)
  const { authorization, 'x-iyzi-rnd': xIyziRnd } = generateIyzicoAuthHeader(
    apiKey,
    secretKey,
    SUBSCRIPTION_INIT_PATH,
    bodyString
  )

  const url = `${baseUrl}${SUBSCRIPTION_INIT_PATH}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authorization,
      'x-iyzi-rnd': xIyziRnd,
    },
    body: bodyString,
  })

  const data = (await res.json()) as SubscriptionCheckoutInitResponse

  if (data.status !== 'success' || !data.checkoutFormContent || !data.token) {
    const msg = data.errorMessage || data.errorCode || 'Iyzico yanıt vermedi'
    if (res.status === 401 || /api.*key|anahtar|invalid|unauthorized/i.test(String(msg))) {
      throw new Error('Iyzico API anahtarı hatalı. IYZICO_API_KEY ve IYZICO_SECRET_KEY değerlerini kontrol edin.')
    }
    if (/plan|pricing|bulunamadı|not found/i.test(String(msg))) {
      throw new Error('Iyzico: Plan bulunamadı. Iyzico panelindeki Fiyatlandırma Plan Kodlarını (IYZICO_PLAN_STARTER, IYZICO_PLAN_STANDARD, IYZICO_PLAN_PRO) kontrol edin.')
    }
    throw new Error(`Iyzico: ${msg}`)
  }

  return {
    checkoutFormContent: data.checkoutFormContent,
    token: data.token,
  }
}

/** Iyzico subscription checkout form retrieve response (GET /v2/subscription/checkoutform/{token}) */
export interface SubscriptionCheckoutFormRetrieveResponse {
  status: string
  token?: string
  data?: {
    referenceCode: string
    parentReferenceCode?: string
    pricingPlanReferenceCode: string
    customerReferenceCode: string
    subscriptionStatus: string
    trialDays?: number
    trialStartDate?: number
    trialEndDate?: number
    createdDate?: number
    startDate?: number
    endDate?: number
  }
  errorMessage?: string
  errorCode?: string
}

/**
 * Retrieve subscription result after checkout form completion.
 * GET https://api.iyzipay.com/v2/subscription/checkoutform/{token}
 */
export async function getSubscriptionCheckoutFormResult(
  token: string
): Promise<SubscriptionCheckoutFormRetrieveResponse['data']> {
  const apiKey = getEnv('IYZICO_API_KEY')
  const secretKey = getEnv('IYZICO_SECRET_KEY')
  const baseUrl = getEnv('IYZICO_BASE_URL').replace(/\/+$/, '')

  const uriPath = `${SUBSCRIPTION_CHECKOUTFORM_RETRIEVE_PATH}/${token}`
  const { authorization, 'x-iyzi-rnd': xIyziRnd } = generateIyzicoAuthHeader(
    apiKey,
    secretKey,
    uriPath,
    ''
  )

  const url = `${baseUrl}${uriPath}`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authorization,
      'x-iyzi-rnd': xIyziRnd,
    },
  })

  const data = (await res.json()) as SubscriptionCheckoutFormRetrieveResponse

  if (data.status !== 'success' || !data.data) {
    const msg = data.errorMessage || data.errorCode || 'Iyzico yanıt vermedi'
    throw new Error(`Iyzico retrieve: ${msg}`)
  }

  return data.data
}

const SUBSCRIPTION_CANCEL_PATH_PREFIX = '/v2/subscription/subscriptions'

/**
 * Cancel subscription at Iyzico.
 * POST /v2/subscription/subscriptions/{subscriptionReferenceCode}/cancel
 * Body (optional): { subscriptionReferenceCode: "..." }
 */
export async function cancelSubscription(subscriptionReferenceCode: string): Promise<void> {
  const apiKey = getEnv('IYZICO_API_KEY')
  const secretKey = getEnv('IYZICO_SECRET_KEY')
  const baseUrl = getEnv('IYZICO_BASE_URL').replace(/\/+$/, '')

  const uriPath = `${SUBSCRIPTION_CANCEL_PATH_PREFIX}/${subscriptionReferenceCode}/cancel`
  const body = JSON.stringify({ subscriptionReferenceCode })
  const { authorization, 'x-iyzi-rnd': xIyziRnd } = generateIyzicoAuthHeader(
    apiKey,
    secretKey,
    uriPath,
    body
  )

  const url = `${baseUrl}${uriPath}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authorization,
      'x-iyzi-rnd': xIyziRnd,
    },
    body,
  })

  const data = (await res.json()) as { status: string; errorMessage?: string; errorCode?: string }

  if (data.status !== 'success') {
    const msg = data.errorMessage || data.errorCode || 'Iyzico iptal yanıt vermedi'
    throw new Error(`Iyzico cancel: ${msg}`)
  }
}
