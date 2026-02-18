'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import toast from 'react-hot-toast'

interface RestaurantSubscription {
  id: string
  name: string
  slug: string
  owner_user_id: string
  owner_email: string
  owner_phone: string | null
  created_at: string
  subscription_plan: 'starter' | 'standard' | 'premium' | null
  subscription_status: 'active' | 'past_due' | 'canceled' | null
  current_period_end: string | null
  iyzico_sub_reference: string | null
}

export default function SubscriptionsManagementClient() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<RestaurantSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('current_period_end')

  // Action modals state
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantSubscription | null>(null)
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [showChangePlanModal, setShowChangePlanModal] = useState(false)
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false)

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Load restaurants
  const loadRestaurants = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      params.append('sort', sortBy)

      const response = await fetch(`/api/subscriptions?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load subscriptions')
      }

      setRestaurants(result.restaurants || [])
    } catch (error: any) {
      console.error('[Subscriptions] Load error:', error)
      toast.error('Abonelikler yüklenirken hata: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRestaurants()
  }, [statusFilter, sortBy])

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Belirtilmemiş'
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Format date for expiry (days remaining)
  const formatExpiryInfo = (dateString: string | null) => {
    if (!dateString) return { text: 'Belirtilmemiş', color: 'gray' }
    
    const expiry = new Date(dateString)
    const now = new Date()
    const diffMs = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} gün önce sona erdi`, color: 'red' }
    } else if (diffDays <= 7) {
      return { text: `${diffDays} gün sonra sona eriyor`, color: 'orange' }
    } else {
      return { text: `${diffDays} gün sonra sona eriyor`, color: 'green' }
    }
  }

  // Status badge color
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'past_due':
        return 'bg-red-100 text-red-800'
      case 'canceled':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Status text
  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'Aktif'
      case 'past_due':
        return 'Ödeme Gecikti'
      case 'canceled':
        return 'İptal Edildi'
      default:
        return 'Belirsiz'
    }
  }

  // Plan badge color
  const getPlanBadge = (plan: string | null) => {
    switch (plan) {
      case 'starter':
        return 'bg-blue-100 text-blue-800'
      case 'standard':
        return 'bg-purple-100 text-purple-800'
      case 'premium':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Handle extend subscription with custom date or days
  const handleExtendSubscription = async (restaurantId: string, targetDate: string | null, days: number | null) => {
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          action: 'extend_subscription',
          value: days, // Days to add (for presets)
          target_date: targetDate, // Target date (for custom date picker)
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to extend subscription')
      }

      const daysText = days ? `${days} gün` : targetDate ? 'belirtilen tarihe kadar' : '30 gün'
      toast.success(`Süre ${daysText} uzatıldı.`)
      setShowExtendModal(false)
      setSelectedRestaurant(null)
      loadRestaurants() // Refresh table data
    } catch (error: any) {
      console.error('[Subscriptions] Extend error:', error)
      toast.error('Hata: ' + error.message)
    }
  }

  // Handle change plan
  const handleChangePlan = async (plan: 'starter' | 'standard' | 'premium') => {
    if (!selectedRestaurant) return

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: selectedRestaurant.id,
          action: 'change_plan',
          value: plan,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change plan')
      }

      toast.success(`Plan ${plan} olarak değiştirildi`)
      setShowChangePlanModal(false)
      setSelectedRestaurant(null)
      loadRestaurants()
    } catch (error: any) {
      console.error('[Subscriptions] Change plan error:', error)
      toast.error('Hata: ' + error.message)
    }
  }

  // Handle change status
  const handleChangeStatus = async (status: 'active' | 'past_due' | 'canceled') => {
    if (!selectedRestaurant) return

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: selectedRestaurant.id,
          action: 'change_status',
          value: status,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change status')
      }

      toast.success(`Durum ${getStatusText(status)} olarak değiştirildi`)
      setShowChangeStatusModal(false)
      setSelectedRestaurant(null)
      loadRestaurants()
    } catch (error: any) {
      console.error('[Subscriptions] Change status error:', error)
      toast.error('Hata: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex">
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">ChaosAR</h1>
            <p className="text-sm text-gray-600 mt-1">Super Admin</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <Link
              href="/"
              className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
            >
              Restoranlar
            </Link>
            <Link
              href="/users"
              className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
            >
              Kullanıcılar
            </Link>
            <Link
              href="/activity-logs"
              className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
            >
              Aktivite Logları
            </Link>
            <Link
              href="/subscriptions"
              className="w-full text-left px-4 py-3 rounded-lg transition-colors bg-gray-900 text-white block"
            >
              Abonelikler
            </Link>
          </nav>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">ChaosAR</h1>
          <p className="text-sm text-gray-600 mt-1">Super Admin</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
          >
            Restoranlar
          </Link>
          <Link
            href="/users"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
          >
            Kullanıcılar
          </Link>
          <Link
            href="/activity-logs"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
          >
            Aktivite Logları
          </Link>
          <Link
            href="/subscriptions"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors bg-gray-900 text-white block"
          >
            Abonelikler
          </Link>
          <Link
            href="/applications"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
          >
            Başvurular
          </Link>
          <Link
            href="/demo-requests"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
          >
            👁️ Demo Talepleri
          </Link>
          <button
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
          >
            Ayarlar
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-6 p-6">
      {/* Filters and Sorting */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durum Filtresi
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">Tümü</option>
              <option value="active">Aktif</option>
              <option value="past_due">Ödeme Gecikti</option>
              <option value="canceled">İptal Edildi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sıralama
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="current_period_end">Sona Erme Tarihi (Yakın)</option>
              <option value="name">İsim</option>
              <option value="created_at">Kayıt Tarihi</option>
            </select>
          </div>

          <div className="flex-1" />
          <div className="text-sm text-gray-600 mt-6">
            Toplam: {restaurants.length} restoran
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşletme Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sona Erme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İletişim
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {restaurants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {statusFilter === 'all' 
                      ? 'Henüz restoran kaydı bulunmuyor.'
                      : `${getStatusText(statusFilter as any)} durumunda restoran bulunmuyor.`
                    }
                  </td>
                </tr>
              ) : (
                restaurants.map((restaurant) => {
                  const expiryInfo = formatExpiryInfo(restaurant.current_period_end)
                  
                  return (
                    <tr key={restaurant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {restaurant.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          /{restaurant.slug}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanBadge(restaurant.subscription_plan)}`}>
                          {restaurant.subscription_plan || 'starter'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(restaurant.subscription_status)}`}>
                          {getStatusText(restaurant.subscription_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${expiryInfo.color === 'red' ? 'text-red-600' : expiryInfo.color === 'orange' ? 'text-orange-600' : 'text-gray-900'}`}>
                          {expiryInfo.text}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(restaurant.current_period_end)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {restaurant.owner_email}
                        </div>
                        {restaurant.owner_phone && (
                          <div className="text-sm text-gray-500">
                            {restaurant.owner_phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedRestaurant(restaurant)
                              setShowExtendModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            Uzat
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRestaurant(restaurant)
                              setShowChangePlanModal(true)
                            }}
                            className="text-purple-600 hover:text-purple-900 text-xs"
                          >
                            Plan
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRestaurant(restaurant)
                              setShowChangeStatusModal(true)
                            }}
                            className="text-red-600 hover:text-red-900 text-xs"
                          >
                            Durum
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extend Subscription Modal */}
      {showExtendModal && selectedRestaurant && (
        <ExtendSubscriptionModal
          restaurant={selectedRestaurant}
          onClose={() => {
            setShowExtendModal(false)
            setSelectedRestaurant(null)
          }}
          onConfirm={handleExtendSubscription}
        />
      )}

      {/* Change Plan Modal */}
      {showChangePlanModal && selectedRestaurant && (
        <ChangePlanModal
          restaurant={selectedRestaurant}
          onClose={() => {
            setShowChangePlanModal(false)
            setSelectedRestaurant(null)
          }}
          onConfirm={handleChangePlan}
        />
      )}

      {/* Change Status Modal */}
      {showChangeStatusModal && selectedRestaurant && (
        <ChangeStatusModal
          restaurant={selectedRestaurant}
          onClose={() => {
            setShowChangeStatusModal(false)
            setSelectedRestaurant(null)
          }}
          onConfirm={handleChangeStatus}
        />
      )}
        </div>
      </div>
    </div>
  )
}

// Extend Subscription Modal Component
function ExtendModal({
  restaurant,
  onClose,
  onConfirm,
}: {
  restaurant: RestaurantSubscription
  onClose: () => void
  onConfirm: (days: number) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async (days: number) => {
    setLoading(true)
    try {
      await onConfirm(days)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Aboneliği Uzat
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          <strong>{restaurant.name}</strong> için abonelik süresini uzatın.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => handleConfirm(30)}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'İşleniyor...' : '30 Gün Ekle'}
          </button>
          <button
            onClick={() => handleConfirm(365)}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'İşleniyor...' : '1 Yıl Ekle (365 Gün)'}
          </button>
        </div>
        <button
          onClick={onClose}
          disabled={loading}
          className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
        >
          İptal
        </button>
      </div>
    </div>
  )
}

// Extend Subscription Modal Component
function ExtendSubscriptionModal({
  restaurant,
  onClose,
  onConfirm,
}: {
  restaurant: RestaurantSubscription
  onClose: () => void
  onConfirm: (restaurantId: string, targetDate: string | null, days: number | null) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const [customDate, setCustomDate] = useState<string>('')
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)

  // Calculate current expiration date for reference
  const now = new Date()
  const currentEnd = restaurant.current_period_end 
    ? new Date(restaurant.current_period_end) 
    : null

  const baseDate = (!currentEnd || currentEnd <= now) ? now : currentEnd

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Calculate preset date
  const calculatePresetDate = (days: number): Date => {
    const newDate = new Date(baseDate)
    newDate.setDate(newDate.getDate() + days)
    return newDate
  }

  const handlePresetClick = (days: number) => {
    setSelectedPreset(days)
    setCustomDate('') // Clear custom date when preset is selected
  }

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDate(e.target.value)
    setSelectedPreset(null) // Clear preset when custom date is selected
  }

  const handleSave = async () => {
    if (selectedPreset) {
      // Use preset (days)
      setLoading(true)
      try {
        await onConfirm(restaurant.id, null, selectedPreset)
      } finally {
        setLoading(false)
      }
    } else if (customDate) {
      // Use custom date
      setLoading(true)
      try {
        // Convert date string to ISO string (with time set to end of day)
        const date = new Date(customDate)
        date.setHours(23, 59, 59, 999) // End of day
        await onConfirm(restaurant.id, date.toISOString(), null)
      } finally {
        setLoading(false)
      }
    } else {
      toast.error('Lütfen bir preset seçin veya özel tarih girin')
    }
  }

  // Calculate the final date that will be set (for preview)
  const getCalculatedDate = (): Date | null => {
    if (selectedPreset) {
      return calculatePresetDate(selectedPreset)
    } else if (customDate) {
      const date = new Date(customDate)
      date.setHours(23, 59, 59, 999)
      return date
    }
    return null
  }

  const calculatedDate = getCalculatedDate()

  // Format date for display (Turkish locale)
  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Abonelik Süresini Düzenle
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          <strong>{restaurant.name}</strong> için abonelik süresini uzatın veya kısaltın.
        </p>

        {/* Quick Presets - Increase */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Süre Ekle (Hızlı Presetler)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handlePresetClick(30)}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPreset === 30
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              +1 Ay (30 gün)
            </button>
            <button
              onClick={() => handlePresetClick(90)}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPreset === 90
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              +3 Ay (90 gün)
            </button>
            <button
              onClick={() => handlePresetClick(180)}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPreset === 180
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              +6 Ay (180 gün)
            </button>
            <button
              onClick={() => handlePresetClick(365)}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPreset === 365
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              +1 Yıl (365 gün)
            </button>
          </div>
        </div>

        {/* Quick Presets - Decrease */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Süreyi Kısalt
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handlePresetClick(-7)}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPreset === -7
                  ? 'bg-red-600 text-white'
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              -1 Hafta
            </button>
            <button
              onClick={() => handlePresetClick(-30)}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPreset === -30
                  ? 'bg-red-600 text-white'
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              -1 Ay
            </button>
            <button
              onClick={() => handlePresetClick(-90)}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPreset === -90
                  ? 'bg-red-600 text-white'
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              -3 Ay
            </button>
          </div>
        </div>

        {/* Custom Date Picker */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Özel Tarih
          </label>
          <input
            type="date"
            value={customDate}
            onChange={handleCustomDateChange}
            min={formatDateForInput(new Date())} // Cannot select past dates
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Preview Calculated Date */}
        {calculatedDate && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Yeni Bitiş Tarihi:</span> {formatDateForDisplay(calculatedDate)}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading || (!selectedPreset && !customDate)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'İşleniyor...' : 'Kaydet'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 font-medium"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  )
}

// Change Plan Modal Component
function ChangePlanModal({
  restaurant,
  onClose,
  onConfirm,
}: {
  restaurant: RestaurantSubscription
  onClose: () => void
  onConfirm: (plan: 'starter' | 'standard' | 'premium') => Promise<void>
}) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async (plan: 'starter' | 'standard' | 'premium') => {
    setLoading(true)
    try {
      await onConfirm(plan)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Plan Değiştir
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          <strong>{restaurant.name}</strong> için plan değiştirin.
        </p>
        <div className="space-y-2">
          <button
            onClick={() => handleConfirm('starter')}
            disabled={loading || restaurant.subscription_plan === 'starter'}
            className="w-full px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Starter {restaurant.subscription_plan === 'starter' && '(Mevcut)'}
          </button>
          <button
            onClick={() => handleConfirm('standard')}
            disabled={loading || restaurant.subscription_plan === 'standard'}
            className="w-full px-4 py-2 bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Standard {restaurant.subscription_plan === 'standard' && '(Mevcut)'}
          </button>
          <button
            onClick={() => handleConfirm('premium')}
            disabled={loading || restaurant.subscription_plan === 'premium'}
            className="w-full px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Premium {restaurant.subscription_plan === 'premium' && '(Mevcut)'}
          </button>
        </div>
        <button
          onClick={onClose}
          disabled={loading}
          className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
        >
          İptal
        </button>
      </div>
    </div>
  )
}

// Change Status Modal Component
function ChangeStatusModal({
  restaurant,
  onClose,
  onConfirm,
}: {
  restaurant: RestaurantSubscription
  onClose: () => void
  onConfirm: (status: 'active' | 'past_due' | 'canceled') => Promise<void>
}) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async (status: 'active' | 'past_due' | 'canceled') => {
    setLoading(true)
    try {
      await onConfirm(status)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Durum Değiştir
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          <strong>{restaurant.name}</strong> için durum değiştirin.
          <br />
          <span className="text-red-600 font-semibold">
            Dikkat: Bu işlem kullanıcının erişimini etkiler!
          </span>
        </p>
        <div className="space-y-2">
          <button
            onClick={() => handleConfirm('active')}
            disabled={loading || restaurant.subscription_status === 'active'}
            className="w-full px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Aktif {restaurant.subscription_status === 'active' && '(Mevcut)'}
          </button>
          <button
            onClick={() => handleConfirm('past_due')}
            disabled={loading || restaurant.subscription_status === 'past_due'}
            className="w-full px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ödeme Gecikti {restaurant.subscription_status === 'past_due' && '(Mevcut)'}
          </button>
          <button
            onClick={() => handleConfirm('canceled')}
            disabled={loading || restaurant.subscription_status === 'canceled'}
            className="w-full px-4 py-2 bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            İptal Edildi {restaurant.subscription_status === 'canceled' && '(Mevcut)'}
          </button>
        </div>
        <button
          onClick={onClose}
          disabled={loading}
          className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
        >
          İptal
        </button>
      </div>
    </div>
  )
}
