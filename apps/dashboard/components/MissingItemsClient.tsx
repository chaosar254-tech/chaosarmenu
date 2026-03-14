'use client'

import { useState, useMemo, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { buildRecommendedSidesAuto } from '@/lib/recommendationEngine'
import { BUCKET_MENU_IMAGES } from '@/lib/storage-constants'

// Helper to check if URL is a valid image URL (not a placeholder like /images/cola.jpg)
const isValidImageUrl = (url: string | null): boolean => {
  if (!url) return false
  // Skip placeholder URLs that start with /images/ unless they're absolute URLs
  if (url.startsWith('/images/') && !url.startsWith('http')) {
    return false
  }
  return true
}

// Helper to get image source - use image_path if it's a storage path, otherwise use image_url if valid
const getImageSource = (imagePath: string | null, imageUrl: string | null): string | null => {
  // Prefer image_path if it exists (it's a storage path, will be handled by signed URL API)
  if (imagePath) {
    return null // We'll fetch signed URL in useEffect
  }
  // Use image_url only if it's a valid URL (not placeholder)
  if (isValidImageUrl(imageUrl)) {
    return imageUrl
  }
  return null
}

type MissingType = 
  | 'MISSING_IMAGE'
  | 'MISSING_INGREDIENTS'
  | 'MISSING_ALLERGENS'
  | 'MISSING_RECOMMENDATION'
  | 'MISSING_AR_MODEL'
  | 'MISSING_AR_FLAG'

interface MenuItem {
  id: string
  name: string
  image_path: string | null
  image_url: string | null
  ingredients: string[] | null
  allergens: string[] | null
  recommended_item_ids: string[] | null
  has_ar: boolean | null
  model_glb: string | null
  model_usdz: string | null
  category_id: string
  menu_categories: {
    id: string
    name: string
  } | null
}

interface MissingItemsClientProps {
  items: MenuItem[]
  restaurantPlan: 'starter' | 'standard' | 'premium'
}

export default function MissingItemsClient({ items, restaurantPlan }: MissingItemsClientProps) {
  const router = useRouter()
  const [filterType, setFilterType] = useState<MissingType | 'ALL'>('ALL')
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map())

  // Fetch signed URLs for items with image_path using Supabase Storage
  useEffect(() => {
    const fetchImageUrls = async () => {
      const itemsWithImagePath = items.filter(item => item.image_path && !item.image_url)
      if (itemsWithImagePath.length === 0) return

      const urlMap = new Map<string, string>()
      
      await Promise.all(
        itemsWithImagePath.map(async (item) => {
          if (!item.image_path) return
          try {
            // Get signed URL from Supabase Storage
            const { data, error } = await supabase.storage
              .from(BUCKET_MENU_IMAGES)
              .createSignedUrl(item.image_path, 3600) // 1 hour expiry
            
            if (!error && data?.signedUrl) {
              urlMap.set(item.id, data.signedUrl)
            }
          } catch (error) {
            // Silently fail - will show placeholder
            console.debug(`Could not fetch signed URL for item ${item.id}:`, error)
          }
        })
      )

      if (urlMap.size > 0) {
        setImageUrls(urlMap)
      }
    }

    fetchImageUrls()
  }, [items])

  // Calculate missing issues for each item
  const itemsWithIssues = useMemo(() => {
    return items.map((item) => {
      const issues: MissingType[] = []

      // MISSING_IMAGE - Check for valid image (image_path or valid image_url)
      const hasValidImage = item.image_path || isValidImageUrl(item.image_url)
      if (!hasValidImage) {
        issues.push('MISSING_IMAGE')
      }

      // MISSING_INGREDIENTS
      if (!item.ingredients || (Array.isArray(item.ingredients) && item.ingredients.length === 0)) {
        issues.push('MISSING_INGREDIENTS')
      }

      // MISSING_ALLERGENS - Note: allergens is NOT NULL DEFAULT '{}', so check if empty array
      if (!item.allergens || (Array.isArray(item.allergens) && item.allergens.length === 0)) {
        issues.push('MISSING_ALLERGENS')
      }

      // MISSING_RECOMMENDATION - Check recommended_item_ids only
      const hasRecommendedItems = item.recommended_item_ids && Array.isArray(item.recommended_item_ids) && item.recommended_item_ids.length > 0
      if (!hasRecommendedItems) {
        issues.push('MISSING_RECOMMENDATION')
      }

      // AR checks based on plan
      if (restaurantPlan === 'starter') {
        // Starter: AR seçilen ürünlerde model url zorunlu
        if (item.has_ar && !item.model_glb && !item.model_usdz) {
          issues.push('MISSING_AR_MODEL')
        }
      } else if (restaurantPlan === 'standard') {
        // Standard: has_ar=true olan ürünlerde model url zorunlu
        if (item.has_ar && !item.model_glb && !item.model_usdz) {
          issues.push('MISSING_AR_MODEL')
        }
      } else if (restaurantPlan === 'premium') {
        // Premium: Tüm ürünlerde has_ar=true beklenir
        if (!item.has_ar) {
          issues.push('MISSING_AR_FLAG')
        } else if (!item.model_glb && !item.model_usdz) {
          issues.push('MISSING_AR_MODEL')
        }
      }

      return {
        ...item,
        issues,
        issueCount: issues.length,
      }
    })
  }, [items, restaurantPlan])

  // Filter items
  const filteredItems = useMemo(() => {
    if (filterType === 'ALL') {
      return itemsWithIssues.filter(item => item.issues.length > 0)
    }
    return itemsWithIssues.filter(item => item.issues.includes(filterType))
  }, [itemsWithIssues, filterType])

  // Sort by issue count (desc) then by name (deterministic, no locale dependency)
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      if (b.issueCount !== a.issueCount) {
        return b.issueCount - a.issueCount
      }
      // Use simple string comparison instead of localeCompare to avoid hydration mismatches
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0
    })
  }, [filteredItems])

  // Calculate summary stats
  const totalItems = items.length
  const itemsWithMissing = itemsWithIssues.filter(item => item.issues.length > 0).length

  // Count issues by type
  const issueCounts = useMemo(() => {
    const counts: Record<MissingType, number> = {
      MISSING_IMAGE: 0,
      MISSING_INGREDIENTS: 0,
      MISSING_ALLERGENS: 0,
      MISSING_RECOMMENDATION: 0,
      MISSING_AR_MODEL: 0,
      MISSING_AR_FLAG: 0,
    }

    itemsWithIssues.forEach(item => {
      item.issues.forEach(issue => {
        counts[issue]++
      })
    })

    return counts
  }, [itemsWithIssues])

  // Find most common issue
  const mostCommonIssue = useMemo(() => {
    const entries = Object.entries(issueCounts) as [MissingType, number][]
    const maxEntry = entries.reduce((max, [type, count]) => {
      return count > max[1] ? [type, count] : max
    }, entries[0] || ['MISSING_IMAGE', 0])

    const labels: Record<MissingType, string> = {
      MISSING_IMAGE: 'Görsel eksik',
      MISSING_INGREDIENTS: 'İçindekiler eksik',
      MISSING_ALLERGENS: 'Alerjen eksik',
      MISSING_RECOMMENDATION: 'Yanında iyi gider eksik',
      MISSING_AR_MODEL: 'AR model eksik',
      MISSING_AR_FLAG: 'AR bayrağı eksik',
    }

    return {
      type: maxEntry[0],
      label: labels[maxEntry[0]],
      count: maxEntry[1],
    }
  }, [issueCounts])

  const handleEditItem = (itemId: string) => {
    // Navigate to menu page with edit query param
    router.push(`/dashboard/menu?edit=${itemId}`)
  }

  const handleToggleItemSelection = (itemId: string) => {
    const newSet = new Set(selectedItemIds)
    if (newSet.has(itemId)) {
      newSet.delete(itemId)
    } else {
      newSet.add(itemId)
    }
    setSelectedItemIds(newSet)
  }

  const handleSelectAll = () => {
    if (selectedItemIds.size === sortedItems.length) {
      setSelectedItemIds(new Set())
    } else {
      setSelectedItemIds(new Set(sortedItems.map(item => item.id)))
    }
  }

  const handleBulkAutoFill = async () => {
    if (selectedItemIds.size === 0) {
      // If nothing selected, select all filtered items
      const allIds = new Set(sortedItems.map(item => item.id))
      setSelectedItemIds(allIds)
      if (allIds.size === 0) {
        toast.error('Doldurulacak ürün bulunamadı')
        return
      }
    }

    setBulkUpdating(true)
    try {
      const itemsToUpdate = sortedItems.filter(item => selectedItemIds.has(item.id))
      
      // Get categories for items
      const categoryIds = Array.from(new Set(itemsToUpdate.map(item => item.category_id)))
      const { data: categoriesData } = await supabase
        .from('menu_categories')
        .select('id, name')
        .in('id', categoryIds)

      const categoryMap = new Map(categoriesData?.map(c => [c.id, c.name]) || [])

      // Update each item
      const updates = itemsToUpdate.map(async (item) => {
        const categoryName = categoryMap.get(item.category_id) || null
        const autoRecommendation = buildRecommendedSidesAuto({
          name: item.name,
          categoryName,
          ingredients: item.ingredients || null,
        })

        const { error } = await supabase
          .from('menu_items')
          .update({
            recommended_sides_auto: autoRecommendation,
            recommended_sides_source: 'auto',
          })
          .eq('id', item.id)

        if (error) {
          console.error(`Failed to update item ${item.id}:`, error)
          return { success: false, itemId: item.id }
        }
        return { success: true, itemId: item.id }
      })

      const results = await Promise.all(updates)
      const successCount = results.filter(r => r.success).length
      
      if (successCount > 0) {
        toast.success(`${successCount} ürün için otomatik öneri oluşturuldu`)
        // Refresh page to show updated data
        router.refresh()
      } else {
        toast.error('Güncelleme başarısız oldu')
      }
    } catch (error: any) {
      console.error('Bulk update error:', error)
      toast.error('Toplu güncelleme sırasında hata oluştu')
    } finally {
      setBulkUpdating(false)
      setSelectedItemIds(new Set())
    }
  }

  const getIssueBadge = (issue: MissingType) => {
    const badges: Record<MissingType, { label: string; className: string }> = {
      MISSING_IMAGE: { label: 'Görsel', className: 'bg-red-100 text-red-800' },
      MISSING_INGREDIENTS: { label: 'İçindekiler', className: 'bg-yellow-100 text-yellow-800' },
      MISSING_ALLERGENS: { label: 'Alerjen', className: 'bg-orange-100 text-orange-800' },
      MISSING_RECOMMENDATION: { label: 'Yanında iyi gider', className: 'bg-blue-100 text-blue-800' },
      MISSING_AR_MODEL: { label: 'AR model', className: 'bg-purple-100 text-purple-800' },
      MISSING_AR_FLAG: { label: 'AR bayrağı', className: 'bg-indigo-100 text-indigo-800' },
    }
    return badges[issue]
  }

  if (itemsWithMissing === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Harika! Tüm ürünler tamam.
        </h2>
        <p className="text-gray-600 mb-6">
          Menünüzde eksik içerik bulunmuyor.
        </p>
        <Link
          href="/dashboard/menu"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Menüye Git
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📋</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Toplam Ürün
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalItems}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Eksik Ürün
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {itemsWithMissing}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">⚠️</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    En Çok Eksik Türü
                  </dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {mostCommonIssue.count > 0 ? mostCommonIssue.label : '-'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filtre:</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as MissingType | 'ALL')
                setSelectedItemIds(new Set()) // Clear selection on filter change
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">Tüm Eksikler</option>
              <option value="MISSING_IMAGE">Görsel</option>
              <option value="MISSING_INGREDIENTS">İçindekiler</option>
              <option value="MISSING_ALLERGENS">Alerjen</option>
              <option value="MISSING_RECOMMENDATION">Yanında iyi gider</option>
              <option value="MISSING_AR_MODEL">AR Model</option>
              {restaurantPlan === 'premium' && (
                <option value="MISSING_AR_FLAG">AR Bayrağı</option>
              )}
            </select>
            <span className="text-sm text-gray-500">
              {sortedItems.length} ürün bulundu
            </span>
          </div>
          
          {/* Bulk Action: Auto-fill recommended sides */}
          {filterType === 'MISSING_RECOMMENDATION' && sortedItems.length > 0 && (
            <button
              onClick={handleBulkAutoFill}
              disabled={bulkUpdating}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
            >
              {bulkUpdating 
                ? 'İşleniyor...' 
                : selectedItemIds.size > 0
                  ? `Seçili ${selectedItemIds.size} ürün için otomatik doldur`
                  : 'Tüm ürünler için otomatik doldur'
              }
            </button>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {filterType === 'MISSING_RECOMMENDATION' && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItemIds.size === sortedItems.length && sortedItems.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ürün
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Eksikler
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {filterType === 'MISSING_RECOMMENDATION' && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.has(item.id)}
                      onChange={() => handleToggleItemSelection(item.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16 mr-4">
                      {(() => {
                        // Get image source: prefer signed URL from state, then image_url if valid
                        const signedUrl = imageUrls.get(item.id)
                        const imageSource = signedUrl || getImageSource(item.image_path, item.image_url)
                        
                        if (imageSource) {
                          return (
                            <img
                              src={imageSource}
                              alt={item.name}
                              className="h-16 w-16 object-cover rounded-md border border-gray-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect fill="%23f3f4f6" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="10" font-family="system-ui"%3ENo image%3C/text%3E%3C/svg%3E'
                              }}
                            />
                          )
                        }
                        return (
                          <div className="h-16 w-16 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )
                      })()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.menu_categories?.name || '-'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {item.issues.map((issue) => {
                      const badge = getIssueBadge(issue)
                      return (
                        <span
                          key={issue}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      )
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditItem(item.id)}
                    className="text-primary-600 hover:text-primary-900 font-medium"
                  >
                    Düzelt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

