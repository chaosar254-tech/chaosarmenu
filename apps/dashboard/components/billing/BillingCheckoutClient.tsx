'use client'

import Link from 'next/link'

interface BillingCheckoutClientProps {
  plan: string
  period: 'monthly' | 'yearly'
  paymentLink: string | null
  /** Iyzico'dan gelen HTML form; varsa güvenli şekilde render edilir */
  checkoutFormContent?: string | null
}

export default function BillingCheckoutClient({
  plan,
  period,
  paymentLink,
  checkoutFormContent,
}: BillingCheckoutClientProps) {

  const hasFormContent = typeof checkoutFormContent === 'string' && checkoutFormContent.trim().length > 0
  const hasPaymentLink = typeof paymentLink === 'string' && paymentLink.trim().length > 0

  return (
    <div className="bg-white shadow rounded-xl p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ödeme</h1>
        <p className="text-sm text-gray-600 mt-1">
          Paket: <span className="font-medium capitalize">{plan}</span> · {period === 'yearly' ? 'Yıllık' : 'Aylık'}
        </p>
      </div>

      {hasFormContent ? (
        <div className="checkout-form-wrapper">
          <div
            className="iyzico-checkout-form"
            dangerouslySetInnerHTML={{ __html: checkoutFormContent }}
          />
        </div>
      ) : hasPaymentLink ? (
        <div className="space-y-4">
          <p className="text-gray-600">
            Ödeme sayfasına yönlendirileceksiniz. Aşağıdaki butona tıklayın.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Ödemeye Git
            </a>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Ödeme Yöntemlerine Dön
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-4">
            Ödeme linki henüz ayarlanmamış. Lütfen Ödeme Yöntemleri sayfasından aylık veya yıllık ödeme linkinizi (İyzico Pay Link) girin.
          </p>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Ödeme Yöntemlerine Git
          </Link>
        </div>
      )}
    </div>
  )
}
