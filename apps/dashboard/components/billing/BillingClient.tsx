'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import PlanStatusCard from './PlanStatusCard'
import SubscriptionCard from './SubscriptionCard'
import PaymentsList from './PaymentsList'

interface BillingSettings {
  id: string
  restaurant_id: string
  setup_fee_enabled: boolean
  setup_fee_amount: number
  setup_fee_payment_link: string | null
  subscription_period: 'monthly' | 'yearly'
  subscription_monthly_price: number
  subscription_yearly_price: number
  subscription_monthly_link: string | null
  subscription_yearly_link: string | null
  plan: 'trial' | 'monthly' | 'yearly'
  status: 'active' | 'past_due' | 'canceled' | 'trial'
  trial_end_at: string | null
  created_at: string
  updated_at: string
}

interface BillingClientProps {
  initialSettings: BillingSettings | null
  restaurantId: string
}

export default function BillingClient({ initialSettings, restaurantId }: BillingClientProps) {
  const router = useRouter()
  const [settings, setSettings] = useState<BillingSettings | null>(initialSettings)
  const [isLoading, setIsLoading] = useState(false)

  // Load settings on mount if not provided
  useEffect(() => {
    if (!settings) {
      loadSettings()
    }
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/billing')
      if (!response.ok) {
        throw new Error('Ayarlar yüklenemedi')
      }
      const { data } = await response.json()
      setSettings(data)
    } catch (error: any) {
      toast.error(error.message || 'Ayarlar yüklenirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const updateSettings = async (updateData: Partial<BillingSettings>) => {
    try {
      const response = await fetch('/api/billing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || 'Güncelleme başarısız')
      }

      const { data } = await response.json()
      setSettings(data)
      return data
    } catch (error: any) {
      throw error
    }
  }

  const handleCancel = async () => {
    try {
      const res = await fetch('/api/payment/cancel-subscription', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'İptal işlemi başarısız')
      }
      toast.success(data?.message || 'Abonelik iptal edildi. Ödediğiniz dönemin sonuna kadar paneli kullanmaya devam edebilirsiniz.')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'İptal işlemi başarısız')
      throw error
    }
  }

  const handleSubscriptionUpdate = async (data: {
    subscription_period: 'monthly' | 'yearly'
    subscription_monthly_price: number
    subscription_yearly_price: number
    subscription_monthly_link: string | null
    subscription_yearly_link: string | null
  }) => {
    await updateSettings(data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">💳</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ödeme Ayarları Yüklenemedi
        </h2>
        <p className="text-gray-600 mb-6">
          Ödeme ayarları yüklenirken bir hata oluştu.
        </p>
        <button
          onClick={loadSettings}
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Plan & Status Card */}
      <PlanStatusCard settings={settings} onCancel={handleCancel} />

      {/* Subscription Card */}
      <SubscriptionCard
        period={settings.subscription_period}
        monthlyPrice={settings.subscription_monthly_price}
        yearlyPrice={settings.subscription_yearly_price}
        monthlyLink={settings.subscription_monthly_link}
        yearlyLink={settings.subscription_yearly_link}
        onUpdate={handleSubscriptionUpdate}
      />

      {/* Payments List */}
      <PaymentsList />
    </div>
  )
}

