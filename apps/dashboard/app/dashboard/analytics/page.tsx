'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface WeakItem {
  id: string
  name: string
  issues: string[]
  viewCount: number
}

export default function AnalyticsPage() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'
  const [loading, setLoading] = useState(true)
  const [weakItems, setWeakItems] = useState<WeakItem[]>([])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  useEffect(() => {
    loadRestaurantAndData()
  }, [])

  const loadRestaurantAndData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_user_id', user.id)
        .single()

      if (!restaurant) {
        toast.error('Restoran bulunamadı')
        return
      }

      setRestaurantId(restaurant.id)
      await loadWeakItems(restaurant.id)
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast.error('Veri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const loadWeakItems = async (rid: string) => {
    try {
      // Get all items
      const { data: items } = await supabase
        .from('menu_items')
        .select('id, name, image_path, image_url, allergens, ingredients, recommended_item_ids')
        .eq('restaurant_id', rid)
        .eq('is_active', true)

      if (!items) return

      // Get view counts (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: events } = await supabase
        .from('menu_events')
        .select('item_id')
        .eq('restaurant_id', rid)
        .eq('event_type', 'item_view')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('item_id', 'is', null)

      // Count views per item
      const viewCounts: Record<string, number> = {}
      events?.forEach((event: any) => {
        if (event.item_id) {
          viewCounts[event.item_id] = (viewCounts[event.item_id] || 0) + 1
        }
      })

      // Build weak items list
      const weak: WeakItem[] = []
      items.forEach((item) => {
        const issues: string[] = []
        
        if (!item.image_path && !item.image_url) {
          issues.push('Fotoğraf eksik')
        }
        if (!item.allergens || (Array.isArray(item.allergens) && item.allergens.length === 0)) {
          issues.push('Alerjen bilgisi eksik')
        }
        if (!item.ingredients || (Array.isArray(item.ingredients) && item.ingredients.length === 0)) {
          issues.push('İçindekiler eksik')
        }
        if (!item.recommended_item_ids || (Array.isArray(item.recommended_item_ids) && item.recommended_item_ids.length === 0)) {
          issues.push('Yanında iyi gider önerisi yok')
        }

        if (issues.length > 0) {
          weak.push({
            id: item.id,
            name: item.name,
            issues,
            viewCount: viewCounts[item.id] || 0,
          })
        }
      })

      // Sort by view count (lowest first) then by issue count
      weak.sort((a, b) => {
        if (a.viewCount !== b.viewCount) {
          return a.viewCount - b.viewCount
        }
        return b.issues.length - a.issues.length
      })

      setWeakItems(weak)
    } catch (error: any) {
      console.error('Error loading weak items:', error)
      toast.error('Zayıf ürünler yüklenirken hata oluştu')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-sm text-gray-600">
          Menü performansını ve zayıf noktaları görüntüleyin
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <Link
            href="/dashboard/analytics?tab=overview"
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Genel Bakış
          </Link>
          <Link
            href="/dashboard/analytics?tab=weak-items"
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'weak-items'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Zayıf Ürünler
          </Link>
          <Link
            href="/dashboard/analytics?tab=upsell"
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upsell'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upsell Performansı
          </Link>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Genel Bakış</h2>
          <p className="text-sm text-gray-500">
            Detaylı analitik grafikler yakında eklenecek.
          </p>
        </div>
      )}

      {activeTab === 'weak-items' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Zayıf Ürünler</h2>
            <p className="text-sm text-gray-500 mt-1">
              Eksik bilgileri olan ve düşük görüntülenme sayısına sahip ürünler
            </p>
          </div>
          {weakItems.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-gray-500">Tüm ürünler tamamlanmış görünüyor!</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sorunlar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Görüntülenme (30 gün)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {weakItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {item.issues.map((issue, idx) => (
                          <span
                            key={idx}
                            className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800"
                          >
                            {issue}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.viewCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/menu?edit=${item.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Düzenle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'upsell' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upsell Performansı</h2>
          <p className="text-sm text-gray-500">
            Upsell performans metrikleri yakında eklenecek.
          </p>
        </div>
      )}
    </div>
  )
}

