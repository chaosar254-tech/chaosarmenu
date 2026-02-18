'use client'

import { Check } from 'lucide-react'

interface PlanFeature {
  text: string
}

interface PricingPlan {
  id: 'starter' | 'standart' | 'pro'
  name: string
  description?: string
  monthlyPrice: number
  yearlyPrice: number
  yearlyMonthlyEquivalent: number // Aylık karşılığı (yıllık için)
  features: PlanFeature[]
  ctaText: string
  monthlyLink?: string | null
  yearlyLink?: string | null
}

interface PricingPlansProps {
  period: 'monthly' | 'yearly'
  selectedPlan: 'starter' | 'standart' | 'pro' | null
  onSelectPlan: (planId: 'starter' | 'standart' | 'pro') => void
  plans: PricingPlan[]
}

function PlanCard({ 
  plan, 
  period, 
  isSelected, 
  onSelect 
}: { 
  plan: PricingPlan
  period: 'monthly' | 'yearly'
  isSelected: boolean
  onSelect: () => void
}) {
  const price = period === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
  const priceDisplay = `${price.toLocaleString('tr-TR')} ₺`

  return (
    <div
      className={`relative bg-white rounded-xl border-2 p-8 transition-all ${
        isSelected
          ? 'border-primary-600 shadow-xl ring-4 ring-primary-100'
          : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
      }`}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        {plan.description && (
          <p className="text-sm text-gray-500 mb-6">{plan.description}</p>
        )}
        
        {/* Price */}
        <div className="mb-2">
          <div className="text-4xl font-bold text-gray-900">{priceDisplay}</div>
          <div className="text-sm text-gray-500 mt-2">
            {period === 'monthly' ? 'Aylık' : 'Yıllık'}
          </div>
        </div>

        {/* Monthly Equivalent (only for yearly) */}
        {period === 'yearly' && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-600">
              Aylık karşılığı: <span className="font-semibold text-gray-900">{plan.yearlyMonthlyEquivalent.toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-4 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
            <span className="text-sm text-gray-700 leading-relaxed">{feature.text}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={onSelect}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
          isSelected
            ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {plan.ctaText}
      </button>
    </div>
  )
}

export default function PricingPlans({ period, selectedPlan, onSelectPlan, plans }: PricingPlansProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          period={period}
          isSelected={selectedPlan === plan.id}
          onSelect={() => onSelectPlan(plan.id)}
        />
      ))}
    </div>
  )
}
