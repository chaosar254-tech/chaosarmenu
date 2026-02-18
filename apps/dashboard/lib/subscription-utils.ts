/**
 * Subscription utility functions for checking subscription status
 * Implements "Soft Lock" mechanism for unpaid/expired subscriptions
 */

export type SubscriptionPlan = 'starter' | 'standard' | 'premium'
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled'

export interface RestaurantSubscription {
  subscription_plan: SubscriptionPlan
  subscription_status: SubscriptionStatus
  current_period_end: string | null
  iyzico_sub_reference: string | null
  /** When false, restaurant is locked (QR + panel) until payment */
  is_active?: boolean
}

/**
 * Check if restaurant has an active, valid subscription
 * A subscription is valid if:
 * 1. is_active !== false (explicitly inactive = no access)
 * 2. subscription_status === 'active'
 * 3. current_period_end > now()
 */
export function hasActiveSubscription(subscription: RestaurantSubscription | null): boolean {
  if (!subscription) {
    return false
  }

  if (subscription.is_active === false) {
    return false
  }

  if (subscription.subscription_status !== 'active') {
    return false
  }

  if (!subscription.current_period_end) {
    return false
  }

  const periodEnd = new Date(subscription.current_period_end)
  const now = new Date()

  return periodEnd > now
}

/**
 * Check if subscription is expired or unpaid
 */
export function isSubscriptionExpired(subscription: RestaurantSubscription | null): boolean {
  return !hasActiveSubscription(subscription)
}

/**
 * Check if subscription is overdue (past_due, canceled, expired, or is_active false)
 * Used for payment lock enforcement - blocks all access except billing page
 */
export function isSubscriptionOverdue(subscription: RestaurantSubscription | null): boolean {
  if (!subscription) {
    return true // No subscription = overdue
  }

  if (subscription.is_active === false) {
    return true
  }

  // Check if status is past_due
  if (subscription.subscription_status === 'past_due') {
    return true
  }

  // Check if status is canceled
  if (subscription.subscription_status === 'canceled') {
    return true
  }

  // Check if active but expired (period_end passed)
  if (subscription.subscription_status === 'active') {
    if (!subscription.current_period_end) {
      return true // No end date = expired
    }
    const periodEnd = new Date(subscription.current_period_end)
    const now = new Date()
    return periodEnd <= now
  }

  return false
}

/**
 * Get subscription status message for UI
 */
export function getSubscriptionStatusMessage(subscription: RestaurantSubscription | null): string {
  if (!subscription) {
    return 'Abonelik bilgisi bulunamadı. Lütfen ödeme yapın.'
  }

  if (subscription.subscription_status === 'canceled') {
    return 'Aboneliğiniz iptal edilmiş. Yeniden aktifleştirmek için ödeme yapın.'
  }

  if (subscription.subscription_status === 'past_due') {
    return 'Ödemeniz gecikti. Aboneliğinizi aktifleştirmek için ödeme yapın.'
  }

  if (subscription.subscription_status === 'active') {
    if (!subscription.current_period_end) {
      return 'Abonelik süresi belirlenmemiş. Lütfen ödeme yapın.'
    }

    const periodEnd = new Date(subscription.current_period_end)
    const now = new Date()

    if (periodEnd <= now) {
      const daysPast = Math.floor((now.getTime() - periodEnd.getTime()) / (1000 * 60 * 60 * 24))
      return `Aboneliğiniz ${daysPast} gün önce sona erdi. Devam etmek için ödeme yapın.`
    }

    // Still active, return days remaining
    const daysRemaining = Math.floor((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return `Aboneliğiniz aktif. ${daysRemaining} gün kaldı.`
  }

  return 'Abonelik durumu belirsiz. Lütfen destek ile iletişime geçin.'
}

/**
 * Calculate next period end date (30 days from now for first month free)
 */
export function calculateNextPeriodEnd(): Date {
  const now = new Date()
  const nextPeriod = new Date(now)
  nextPeriod.setDate(nextPeriod.getDate() + 30) // 30 days = first month free
  return nextPeriod
}
