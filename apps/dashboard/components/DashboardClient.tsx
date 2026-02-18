'use client'

import { useActiveBranch } from '@/contexts/BranchContext'
import MenuLink from '@/components/MenuLink'
import KpiCard from '@/components/KpiCard'
import DashboardHealthIssues from '@/components/DashboardHealthIssues'
import Link from 'next/link'

import { HealthIssue } from './HealthIssueList'

interface DashboardClientProps {
  todayViews: number
  todayAROpens: number
  topViewedItem: { name: string; count: number } | null
  bestUpsellItem: { name: string; count: number } | null
  restaurant: { id: string; name: string; slug: string }
  healthIssues: HealthIssue[]
  hasMenuItems: boolean
}

export default function DashboardClient({
  todayViews,
  todayAROpens,
  topViewedItem,
  bestUpsellItem,
  restaurant,
  healthIssues,
  hasMenuItems,
}: DashboardClientProps) {
  const { activeBranchId, branches, isLoading } = useActiveBranch()

  // Show empty state if no branches
  if (!isLoading && branches.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Henüz Şube Eklenmedi
          </h2>
          <p className="text-gray-600 mb-6">
            Dashboard'u kullanmak için önce bir şube oluşturmanız gerekiyor.
          </p>
          <Link
            href="/dashboard/branches"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Şube Ekle
          </Link>
        </div>
      </div>
    )
  }

  // Show branch selection prompt if no branch selected
  if (!isLoading && branches.length > 0 && !activeBranchId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800 font-medium mb-2">Şube Seçiniz</p>
        <p className="text-sm text-yellow-700 mb-4">
          Dashboard metriklerini görmek için yukarıdaki dropdown'dan bir şube seçin.
        </p>
        <Link
          href="/dashboard/branches"
          className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
        >
          Şube Yönetimi
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Bugünkü Görüntülenme"
          value={todayViews?.toString() || '0'}
          icon="👁️"
        />
        <KpiCard
          title="AR Açılışları"
          value={todayAROpens?.toString() || '0'}
          icon="📱"
        />
        <KpiCard
          title="En Çok Görüntülenen"
          value={topViewedItem?.name || '—'}
          subtitle={topViewedItem ? `${topViewedItem.count} görüntülenme` : ''}
          icon="🔥"
        />
        <KpiCard
          title="En İyi Upsell"
          value={bestUpsellItem?.name || '—'}
          subtitle={bestUpsellItem ? `${bestUpsellItem.count} eşleşme` : ''}
          icon="💡"
        />
      </div>

      {/* Menu Health Issues */}
      <DashboardHealthIssues issues={healthIssues} hasItems={hasMenuItems} />

      {/* Menu Link */}
      <MenuLink restaurant={restaurant} />
    </div>
  )
}

