'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'
import MobileDrawer from '@/components/MobileDrawer'
import BranchSwitcher from '@/components/BranchSwitcher'
import SubscriptionBanner from '@/components/SubscriptionBanner'
import { BranchProvider, useActiveBranch } from '@/contexts/BranchContext'
import { SubscriptionProvider, type RestaurantSubscription } from '@/lib/subscription-context'

interface Restaurant {
  id: string
  name: string
  slug: string
}

interface DashboardLayoutClientProps {
  children: React.ReactNode
  restaurant: Restaurant | null
  subscription: RestaurantSubscription | null
}

function DashboardContent({ children, restaurant, subscription }: DashboardLayoutClientProps) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { activeBranchId, branches, isLoading } = useActiveBranch()
  
  // Allow branches page without branch selection
  const isBranchesPage = pathname?.includes('/branches')
  const hasBranches = branches.length > 0
  const showEmptyState = !isBranchesPage && hasBranches && !activeBranchId && !isLoading

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar restaurant={restaurant} />

      {/* Mobile Header (shown only on mobile) */}
      <MobileHeader
        onMenuClick={() => setDrawerOpen(true)}
        restaurantName={restaurant?.name || null}
      />

      {/* Mobile Drawer (shown only on mobile) */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        restaurant={restaurant}
      />

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 min-w-0 flex flex-col lg:pl-64">
        {/* Subscription Banner (shown when subscription is expired/unpaid) */}
        <SubscriptionBanner subscription={subscription} />
        
        {/* Branch Switcher Header */}
        {restaurant && (
          <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
            <BranchSwitcher />
          </div>
        )}

        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {showEmptyState ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800 font-medium mb-2">Şube Seçiniz</p>
                <p className="text-sm text-yellow-700 mb-4">
                  Devam etmek için yukarıdaki dropdown'dan bir şube seçin.
                </p>
                <a
                  href="/dashboard/branches"
                  className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
                >
                  Şube Yönetimi
                </a>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayoutClient({
  children,
  restaurant,
  subscription,
}: DashboardLayoutClientProps) {
  if (!restaurant) {
    return <div className="min-h-[100dvh] flex flex-col bg-gray-50">{children}</div>
  }

  return (
    <SubscriptionProvider subscription={subscription}>
      <BranchProvider restaurantId={restaurant.id}>
        <DashboardContent restaurant={restaurant} subscription={subscription}>
          {children}
        </DashboardContent>
      </BranchProvider>
    </SubscriptionProvider>
  )
}

