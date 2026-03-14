'use client'

import { createContext, useContext, ReactNode } from 'react'
import { hasActiveSubscription, type RestaurantSubscription } from './subscription-utils'

export type { RestaurantSubscription }

interface SubscriptionContextType {
  subscription: RestaurantSubscription | null
  hasActiveSubscription: boolean
  isSubscriptionExpired: boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({
  children,
  subscription,
}: {
  children: ReactNode
  subscription: RestaurantSubscription | null
}) {
  const isActive = hasActiveSubscription(subscription)
  const isExpired = !isActive

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        hasActiveSubscription: isActive,
        isSubscriptionExpired: isExpired,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
