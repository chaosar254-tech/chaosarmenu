'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface BillingSettings {
  plan: 'trial' | 'monthly' | 'yearly'
  status: 'active' | 'past_due' | 'canceled' | 'trial'
  trial_end_at: string | null
}

interface SubscriptionData {
  subscription_plan: 'starter' | 'standard' | 'premium' | null
  subscription_status: 'active' | 'past_due' | 'canceled' | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

interface PlanStatusCardProps {
  settings: BillingSettings
  onCancel: () => Promise<void>
}

export default function PlanStatusCard({ settings, onCancel }: PlanStatusCardProps) {
  const router = useRouter()
  const [isCanceling, setIsCanceling] = useState(false)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)

  // Fetch fresh subscription data from restaurants table on mount
  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      setIsLoadingSubscription(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch fresh subscription data from restaurants table
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('subscription_plan, subscription_status, current_period_end, cancel_at_period_end')
        .eq('owner_user_id', user.id)
        .single()

      if (error) {
        console.error('[PlanStatusCard] Error fetching subscription data:', error)
        return
      }

      if (restaurant) {
        setSubscriptionData({
          subscription_plan: restaurant.subscription_plan,
          subscription_status: restaurant.subscription_status,
          current_period_end: restaurant.current_period_end,
          cancel_at_period_end: !!restaurant.cancel_at_period_end,
        })
      }
    } catch (error) {
      console.error('[PlanStatusCard] Error in fetchSubscriptionData:', error)
    } finally {
      setIsLoadingSubscription(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Aboneliği iptal etmek istediğinizden emin misiniz?')) {
      return
    }

    setIsCanceling(true)
    try {
      await onCancel()
    } finally {
      setIsCanceling(false)
    }
  }

  // Use fresh subscription data if available, otherwise fall back to settings
  const currentPlan = subscriptionData?.subscription_plan || null
  const currentStatus = subscriptionData?.subscription_status || settings.status
  const currentPeriodEnd = subscriptionData?.current_period_end || settings.trial_end_at

  // Map subscription_plan from database to UI labels
  const planLabels: Record<string, string> = {
    starter: 'Başlangıç',
    standard: 'Standart',
    premium: 'Premium',
    trial: 'Deneme', // fallback for old billing_settings
    monthly: 'Aylık', // fallback
    yearly: 'Yıllık', // fallback
  }

  // Get display plan: use subscription_plan from restaurants table, fallback to settings.plan
  const displayPlan = currentPlan || settings.plan || 'trial'
  const displayPlanLabel = planLabels[displayPlan] || 'Deneme'

  // Calculate days remaining from current_period_end
  const getDaysRemaining = (): number | null => {
    if (!currentPeriodEnd) return null

    const periodEnd = new Date(currentPeriodEnd)
    const now = new Date()
    const diffTime = periodEnd.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays > 0 ? diffDays : 0
  }

  const daysRemaining = getDaysRemaining()
  const isTrial = !currentPlan || currentPlan === null

  const statusLabels: Record<string, string> = {
    active: 'Aktif',
    past_due: 'Ödeme Bekliyor',
    canceled: 'İptal Edildi',
    trial: 'Deneme',
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    past_due: 'bg-yellow-100 text-yellow-800',
    canceled: 'bg-gray-100 text-gray-800',
    trial: 'bg-blue-100 text-blue-800',
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan & Durum</h2>
      
      {isLoadingSubscription ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Yükleniyor...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="text-lg font-medium text-gray-900">{displayPlanLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Durum</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[currentStatus] || statusColors.active}`}>
                {statusLabels[currentStatus] || currentStatus}
              </span>
            </div>
          </div>

          {(isTrial || daysRemaining !== null) && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                {isTrial ? (
                  <span className="font-semibold">Deneme planı</span>
                ) : subscriptionData?.cancel_at_period_end ? (
                  <>
                    <span className="font-semibold">İptal edilecek.</span> Ödediğiniz dönemin sonuna ({daysRemaining !== null && daysRemaining > 0 ? `${daysRemaining} gün sonra` : 'tarihine'}) kadar paneli kullanmaya devam edebilirsiniz.
                  </>
                ) : daysRemaining !== null ? (
                  <>
                    <span className="font-semibold">Abonelik bitiş tarihi:</span> {daysRemaining > 0 ? `${daysRemaining} gün sonra` : 'Süresi doldu'}
                  </>
                ) : null}
              </p>
            </div>
          )}

        <div className="flex gap-3 pt-2">
          <Link
            href="/dashboard/billing/upgrade"
            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Planı Yükselt
          </Link>
          {currentStatus !== 'canceled' && !subscriptionData?.cancel_at_period_end && (
            <button
              onClick={handleCancel}
              disabled={isCanceling}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCanceling ? 'İptal ediliyor...' : 'İptal Et'}
            </button>
          )}
        </div>
      </div>
      )}
    </div>
  )
}

