'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

/** Iyzico HTML içindeki script'leri çıkarıp manuel çalıştırır (React dangerouslySetInnerHTML script çalıştırmaz). */
function runScriptsFromHtml(html: string): void {
  if (typeof document === 'undefined') return
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const scripts = doc.getElementsByTagName('script')
  for (let i = 0; i < scripts.length; i++) {
    const el = scripts[i]
    const src = el.getAttribute('src')
    const inline = el.textContent
    const script = document.createElement('script')
    if (src) {
      script.src = src
      script.async = true
    }
    if (inline && inline.trim()) {
      script.textContent = inline
    }
    script.type = el.type || 'text/javascript'
    document.body.appendChild(script)
  }
}

type PlanSlug = 'starter' | 'standart' | 'pro'
type PlanPeriod = 'monthly' | 'yearly'

const PLAN_LABELS: Record<PlanSlug, string> = {
  starter: 'Starter',
  standart: 'Standart',
  pro: 'Pro',
}

interface UpgradePlanClientProps {
  restaurantId: string
  restaurantName: string
}

export default function UpgradePlanClient({ restaurantId, restaurantName }: UpgradePlanClientProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanSlug>('starter')
  const [period, setPeriod] = useState<PlanPeriod>('monthly')
  const [loading, setLoading] = useState(false)
  const [checkoutFormContent, setCheckoutFormContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const iyzicoContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!checkoutFormContent || typeof document === 'undefined') return
    const container = document.getElementById('iyzipay-checkout-form')
    if (!container) return
    runScriptsFromHtml(checkoutFormContent)
  }, [checkoutFormContent])

  const handleGetPaymentForm = async () => {
    setLoading(true)
    setError(null)
    setCheckoutFormContent(null)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout
    try {
      const apiUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/payment/iyzico-checkout-form`
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, restaurant_id: restaurantId, period }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        setError('Sunucu JSON dönmedi (muhtemelen hata sayfası). Backend loglarını ve Vercel env değişkenlerini kontrol edin.')
        toast.error('Sunucu yanıtı geçersiz')
        return
      }

      const data = await res.json()

      if (res.status === 404) {
        setError('Ödeme API rotası bulunamadı (404). Dashboard uygulamasının doğru deploy edildiğinden emin olun.')
        toast.error('API bulunamadı')
        return
      }

      if (!res.ok) {
        const msg = data.error || 'Ödeme formu alınamadı'
        if (data.code === 'IYZICO_AUTH_ERROR') {
          setError('Iyzico API anahtarı hatalı. Vercel\'de IYZICO_API_KEY ve IYZICO_SECRET_KEY değerlerini kontrol edin.')
          toast.error('API anahtarı hatalı')
          return
        }
        if (data.code === 'IYZICO_PLAN_NOT_FOUND') {
          const envHint = period === 'yearly'
            ? 'IYZICO_PLAN_STARTER_YEARLY, IYZICO_PLAN_STANDARD_YEARLY, IYZICO_PLAN_PRO_YEARLY'
            : 'IYZICO_PLAN_STARTER, IYZICO_PLAN_STANDARD, IYZICO_PLAN_PRO'
          setError(`Iyzico: Plan bulunamadı. Vercel'de ${envHint} (Iyzico panelindeki Fiyatlandırma Plan Kodları) env değişkenlerini girin.`)
          toast.error('Plan bulunamadı')
          return
        }
        if (data.code === 'IYZICO_ENV_MISSING') {
          setError(msg)
          toast.error('Ortam değişkeni eksik')
          return
        }
        setError(msg)
        toast.error(msg)
        return
      }

      if (data.checkoutFormContent && typeof data.checkoutFormContent === 'string') {
        setCheckoutFormContent(data.checkoutFormContent)
        toast.success('Ödeme formu yüklendi')
      } else {
        setError('Iyzico checkoutFormContent dönmedi. Backend loglarını kontrol edin.')
        toast.error('Form içeriği boş')
      }
    } catch (e) {
      clearTimeout(timeoutId)
      if (e instanceof Error) {
        if (e.name === 'AbortError') {
          setError('İstek zaman aşımına uğradı (30 sn). Ağ ve sunucu loglarını kontrol edin.')
          toast.error('Zaman aşımı')
        } else {
          setError(e.message || 'İstek başarısız')
          toast.error(e.message || 'Hata')
        }
      } else {
        setError('İstek başarısız')
        toast.error('İstek başarısız')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-xl p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Planı Yükselt</h1>
      <p className="text-gray-600 mb-6">
        Paket seçin ve ödeme formunu açın. Ödeme sonrası aboneliğiniz otomatik aktifleşir.
      </p>

      {!checkoutFormContent ? (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Dönem</label>
            <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50 mb-4">
              <button
                type="button"
                onClick={() => setPeriod('monthly')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Aylık
              </button>
              <button
                type="button"
                onClick={() => setPeriod('yearly')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yıllık
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Paket</label>
            <div className="flex flex-wrap gap-3">
              {(['starter', 'standart', 'pro'] as const).map((plan) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedPlan === plan
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {PLAN_LABELS[plan]}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGetPaymentForm}
            disabled={loading}
            className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Yükleniyor...' : 'Ödemeye Geç'}
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <div
            ref={iyzicoContainerRef}
            id="iyzipay-checkout-form"
            className="responsive min-h-[200px] w-full"
            aria-label="Iyzico ödeme formu"
          />
          <p className="text-sm text-gray-500">
            Ödeme tamamlandığında aboneliğiniz otomatik aktifleşecektir.
          </p>
        </div>
      )}
    </div>
  )
}
