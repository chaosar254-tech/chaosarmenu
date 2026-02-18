'use client'

import Link from 'next/link'
import { hasActiveSubscription, getSubscriptionStatusMessage, type RestaurantSubscription } from '@/lib/subscription-utils'

interface SubscriptionBannerProps {
  subscription: RestaurantSubscription | null
}

export default function SubscriptionBanner({ subscription }: SubscriptionBannerProps) {
  const isActive = hasActiveSubscription(subscription)

  // Don't show banner if subscription is active
  if (isActive) {
    return null
  }

  const statusMessage = getSubscriptionStatusMessage(subscription)

  return (
    <div className="bg-red-50 border-b border-red-200 px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg
            className="h-5 w-5 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm font-medium text-red-800">
            {statusMessage}
          </p>
        </div>
        <Link
          href="/dashboard/billing"
          className="ml-4 flex-shrink-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          Ödeme Yap
        </Link>
      </div>
    </div>
  )
}
