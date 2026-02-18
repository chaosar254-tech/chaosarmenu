'use client'

import { useActiveBranch } from '@/contexts/BranchContext'

/**
 * Get base URL for menu app
 * Hardcoded to use the public menu domain
 */
function getBaseUrl(): string {
  return 'https://menu.chaosarmenu.com'
}

/**
 * Build absolute menu URL
 * SINGLE SOURCE OF TRUTH - Use this function everywhere menu URLs are needed
 * Pattern: ${baseUrl}/menu/[restaurantSlug]/[branchSlug]?table=[tableNo]
 */
export function buildMenuUrl(restaurantSlug: string, branchSlug: string, table?: number | string | null): string {
  const baseUrl = getBaseUrl()
  let url = `${baseUrl}/menu/${restaurantSlug}/${branchSlug}`
  if (table) {
    url += `?table=${encodeURIComponent(table)}`
  }
  return url
}

/**
 * Legacy relative URL function (for internal redirects)
 * Use buildMenuUrl() for QR codes and external links
 */
export function getMenuUrl(restaurantSlug: string, branchSlug: string, tableNo?: number | string | null): string {
  let url = `/menu/${restaurantSlug}/${branchSlug}`
  if (tableNo) {
    url += `?table=${encodeURIComponent(tableNo)}`
  }
  return url
}

/**
 * Legacy function for backward compatibility (restaurant-only URL)
 * Redirects will handle conversion to branch-aware URLs
 */
export function getLegacyMenuUrl(restaurantSlug: string, tableNo?: number | string | null): string {
  let url = `/menu/${restaurantSlug}`
  if (tableNo) {
    url += `?table=${encodeURIComponent(tableNo)}`
  }
  return url
}

interface MenuLinkProps {
  restaurant: {
    slug: string
  }
}

export default function MenuLink({ restaurant }: MenuLinkProps) {
  const { activeBranchId, branches } = useActiveBranch()
  
  // Find active branch to get slug
  const activeBranch = branches.find(b => b.id === activeBranchId)
  
  // If no branch selected, show message
  if (!activeBranchId || !activeBranch) {
    return (
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Menü Linki
        </h2>
        <p className="text-sm text-yellow-700">
          Menü linkini görüntülemek için lütfen bir şube seçin.
        </p>
      </div>
    )
  }

  const menuUrl = buildMenuUrl(restaurant.slug, activeBranch.slug)
  
  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl)
    alert('Link kopyalandı!')
  }

  return (
    <div className="mt-8 bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Menü Linki ({activeBranch.name})
      </h2>
      <div className="flex items-center space-x-4">
        <input
          type="text"
          readOnly
          value={menuUrl}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono text-xs"
        />
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Kopyala
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Bu link {activeBranch.name} şubesi için menü linkidir. (Absolute URL)
      </p>
    </div>
  )
}

