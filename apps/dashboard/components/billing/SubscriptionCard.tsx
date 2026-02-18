'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import PricingPlans from './PricingPlans'

interface SubscriptionCardProps {
  period: 'monthly' | 'yearly'
  monthlyPrice: number
  yearlyPrice: number
  monthlyLink: string | null
  yearlyLink: string | null
  onUpdate: (data: {
    subscription_period: 'monthly' | 'yearly'
    subscription_monthly_price: number
    subscription_yearly_price: number
    subscription_monthly_link: string | null
    subscription_yearly_link: string | null
  }) => Promise<void>
}

// Paket tanımları (sabit veri)
const PLAN_DEFINITIONS = {
  starter: {
    id: 'starter' as const,
    name: 'Starter',
    description: 'Küçük işletmeler için ideal başlangıç paketi',
    monthlyPrice: 990,
    yearlyPrice: 11286,
    yearlyMonthlyEquivalent: 940, // Aylık karşılığı
    features: [
      { text: 'Dijital Menü' },
      { text: 'QR Kod yönetimi' },
      { text: 'Sınırsız masa' },
      { text: '1 şube' },
      { text: 'Temel analytics' },
    ],
    ctaText: 'Paketi Seç',
  },
  standart: {
    id: 'standart' as const,
    name: 'Standart',
    description: 'Büyüyen işletmeler için gelişmiş özellikler',
    monthlyPrice: 1490,
    yearlyPrice: 16092,
    yearlyMonthlyEquivalent: 1341, // Aylık karşılığı
    features: [
      { text: 'Dijital Menü' },
      { text: 'QR Kod yönetimi' },
      { text: 'AR Menü desteği' },
      { text: 'Satış artırıcı öneriler' },
      { text: 'Gelişmiş analytics' },
      { text: '3 şube' },
    ],
    ctaText: 'Paketi Seç',
  },
  pro: {
    id: 'pro' as const,
    name: 'Pro',
    description: 'Büyük işletmeler için enterprise çözümler',
    monthlyPrice: 2490,
    yearlyPrice: 26892,
    yearlyMonthlyEquivalent: 2241, // Aylık karşılığı
    features: [
      { text: 'Dijital Menü' },
      { text: 'QR Kod yönetimi' },
      { text: 'AR Menü desteği' },
      { text: 'Satış artırıcı öneriler' },
      { text: 'Gelişmiş analytics' },
      { text: 'Sınırsız şube' },
      { text: 'Özel tasarım desteği' },
      { text: 'Öncelikli destek' },
    ],
    ctaText: 'Paketi Seç',
  },
}

export default function SubscriptionCard({
  period,
  monthlyPrice,
  yearlyPrice,
  monthlyLink,
  yearlyLink,
  onUpdate,
}: SubscriptionCardProps) {
  const router = useRouter()
  const [localPeriod, setLocalPeriod] = useState(period)
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'standart' | 'pro' | null>(null)

  const plans = [
    { ...PLAN_DEFINITIONS.starter, monthlyLink, yearlyLink },
    { ...PLAN_DEFINITIONS.standart, monthlyLink, yearlyLink },
    { ...PLAN_DEFINITIONS.pro, monthlyLink, yearlyLink },
  ]

  const handleSelectPlan = (planId: 'starter' | 'standart' | 'pro') => {
    setSelectedPlan(planId)
    toast.success(`${PLAN_DEFINITIONS[planId].name} paketi seçildi`)
    router.push(`/dashboard/billing/checkout?plan=${planId}&period=${localPeriod}`)
  }

  return (
    <div className="bg-white shadow-sm rounded-xl p-8">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Paket & Ödeme</h2>
        <p className="text-gray-600">
          İhtiyacınıza uygun paketi seçin
        </p>
      </div>

      {/* Period Toggle */}
      <div className="flex items-center justify-center mb-12">
        <div className="inline-flex bg-gray-100 rounded-lg p-1" role="group">
          <button
            type="button"
            onClick={() => setLocalPeriod('monthly')}
            className={`px-6 py-2.5 text-sm font-medium rounded-md transition-all ${
              localPeriod === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Aylık
          </button>
          <button
            type="button"
            onClick={() => setLocalPeriod('yearly')}
            className={`px-6 py-2.5 text-sm font-medium rounded-md transition-all ${
              localPeriod === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yıllık
          </button>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="mb-12">
        <PricingPlans
          period={localPeriod}
          selectedPlan={selectedPlan}
          onSelectPlan={handleSelectPlan}
          plans={plans}
        />
      </div>

      {/* Legal / Info Text */}
      <div className="border-t border-gray-200 pt-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Fiyatlara KDV dahildir.
          </p>
          <p className="text-sm text-gray-500">
            İlk ay ücretsiz, yalnızca kurulum ücreti alınır.
          </p>
        </div>
      </div>
    </div>
  )
}
