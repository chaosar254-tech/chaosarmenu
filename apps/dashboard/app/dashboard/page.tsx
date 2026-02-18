import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardClient from '@/components/DashboardClient'
import { getActiveBranchId } from '@/lib/branch-utils'
import { HealthIssue } from '@/components/HealthIssueList'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Debug: Log user info
  console.log('[Dashboard] User ID:', user.id)
  console.log('[Dashboard] User Email:', user.email)

  // Try to fetch restaurant - use maybeSingle to avoid errors when no restaurant exists
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('id, name, slug, owner_user_id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  // Debug: Log restaurant query result
  console.log('[Dashboard] Restaurant query result:', { 
    restaurant: restaurant ? { id: restaurant.id, name: restaurant.name } : null,
    error: restaurantError,
    user_id: user.id
  })

  if (restaurantError) {
    console.error('[Dashboard] Restaurant query error:', restaurantError)
    return (
      <div className="text-center py-12 px-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Bir hata oluştu
        </h1>
        <p className="text-gray-600 mb-4">
          Restoran bilgileriniz alınırken bir sorun oluştu.
        </p>
        <div className="mt-6 p-4 bg-gray-100 rounded-md text-left text-sm text-gray-700">
          <p className="font-semibold mb-2">Teknik Detaylar:</p>
          <p>Hata: {restaurantError.message || 'Bilinmeyen hata'}</p>
          <p className="mt-2">Kullanıcı ID: {user.id}</p>
          <p className="mt-2 text-xs text-gray-500">Lütfen bu bilgileri destek ekibiyle paylaşın.</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    // Try alternative query to see if there are any restaurants at all for this user
    const { data: allRestaurants, error: checkError } = await supabase
      .from('restaurants')
      .select('id, name, slug, owner_user_id')
      .eq('owner_user_id', user.id)

    console.log('[Dashboard] Alternative query result:', { 
      count: allRestaurants?.length || 0,
      restaurants: allRestaurants,
      error: checkError
    })

    return (
      <div className="text-center py-12 px-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Restoran bulunamadı
        </h1>
        <p className="text-gray-600 mb-6">
          Hesabınıza bağlı bir restoran bulunmuyor.
        </p>
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-left">
          <p className="font-semibold text-yellow-900 mb-2">Çözüm:</p>
          <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
            <li>Admin panelinden hesabınıza bir restoran atanması gerekiyor.</li>
            <li>Veya yeni bir restoran hesabı oluşturmanız gerekiyor.</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded-md text-left text-sm text-gray-700">
          <p className="font-semibold mb-2">Debug Bilgisi:</p>
          <p>Kullanıcı ID: {user.id}</p>
          <p className="mt-1">E-posta: {user.email}</p>
          <p className="mt-1">Alternatif sorgu sonucu: {allRestaurants?.length || 0} restoran bulundu</p>
          {checkError && <p className="mt-1 text-red-600">Alternatif sorgu hatası: {checkError.message}</p>}
        </div>
      </div>
    )
  }

  // Get active branch ID from cookie
  const activeBranchId = await getActiveBranchId()

  // Get today's date range
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Note: menu_events doesn't have branch_id yet, so we filter by restaurant_id
  // For proper branch-scoped analytics, we'd need to add branch_id to menu_events table
  // For now, we show restaurant-level metrics (all branches combined)
  
  // KPI: Today views
  const { count: todayViews } = await supabase
    .from('menu_events')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurant.id)
    .eq('event_type', 'page_view')
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())

  // KPI: AR opens (today) - Simplified: count AR items viewed today
  // Note: For accurate AR opens, we'd need a specific 'ar_open' event type
  const { data: arItems } = await supabase
    .from('menu_items')
    .select('id')
    .eq('restaurant_id', restaurant.id)
    .eq('has_ar', true)
    .not('model_glb', 'is', null)
    .limit(100)

  let todayAROpens = 0
  if (arItems && arItems.length > 0) {
    const arItemIds = arItems.map(i => i.id)
    const { count } = await supabase
      .from('menu_events')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('event_type', 'item_view')
      .in('item_id', arItemIds)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
    todayAROpens = count || 0
  }

  // KPI: Top viewed item (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data: topViewedItemData } = await supabase
    .from('menu_events')
    .select('item_id, menu_items(name)')
    .eq('restaurant_id', restaurant.id)
    .eq('event_type', 'item_view')
    .gte('created_at', sevenDaysAgo.toISOString())
    .not('item_id', 'is', null)
    .limit(100)

  // Count item views and find top
  const itemViewCounts: Record<string, { count: number; name: string }> = {}
  topViewedItemData?.forEach((event: any) => {
    if (event.item_id) {
      if (!itemViewCounts[event.item_id]) {
        itemViewCounts[event.item_id] = { count: 0, name: event.menu_items?.name || 'Bilinmeyen' }
      }
      itemViewCounts[event.item_id].count++
    }
  })
  const topViewedItem = Object.entries(itemViewCounts)
    .sort(([, a], [, b]) => b.count - a.count)[0]

  // KPI: Best upsell (items with recommended_item_ids)
  const { data: itemsWithUpsell } = await supabase
    .from('menu_items')
    .select('id, name, recommended_item_ids')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)
    .not('recommended_item_ids', 'is', null)
    .limit(10)

  const topUpsellItem = itemsWithUpsell?.[0]

  // Get basic counts
  const { count: categoriesCount } = await supabase
    .from('menu_categories')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurant.id)

  const { count: itemsCount } = await supabase
    .from('menu_items')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurant.id)

  // Fetch health issues data (moved from DashboardHealthIssues component)
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('id, name, image_path, image_url, allergens, ingredients, recommended_item_ids, has_ar, model_glb, model_usdz')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)

  const healthIssues: HealthIssue[] = []
  const hasMenuItems = menuItems && menuItems.length > 0

  if (menuItems && menuItems.length > 0) {
    menuItems.forEach((item) => {
      // Missing photo
      if (!item.image_path && !item.image_url) {
        healthIssues.push({
          id: `${item.id}-photo`,
          type: 'missing_photo',
          message: 'Fotoğraf eksik',
          itemId: item.id,
          itemName: item.name,
          severity: 'warning',
        })
      }

      // Missing allergens - Note: Empty array is valid, so check for null/undefined
      if (item.allergens === null || item.allergens === undefined) {
        healthIssues.push({
          id: `${item.id}-allergens`,
          type: 'missing_allergens',
          message: 'Alerjen bilgisi eksik',
          itemId: item.id,
          itemName: item.name,
          severity: 'warning',
        })
      }

      // Missing ingredients
      if (!item.ingredients || (Array.isArray(item.ingredients) && item.ingredients.length === 0)) {
        healthIssues.push({
          id: `${item.id}-ingredients`,
          type: 'missing_ingredients',
          message: 'İçindekiler eksik',
          itemId: item.id,
          itemName: item.name,
          severity: 'warning',
        })
      }

      // Missing upsell
      if (!item.recommended_item_ids || (Array.isArray(item.recommended_item_ids) && item.recommended_item_ids.length === 0)) {
        healthIssues.push({
          id: `${item.id}-upsell`,
          type: 'missing_upsell',
          message: 'Yanında iyi gider önerisi yok',
          itemId: item.id,
          itemName: item.name,
          severity: 'warning',
        })
      }

      // Missing AR (only if has_ar is true but no models)
      if (item.has_ar && !item.model_glb && !item.model_usdz) {
        healthIssues.push({
          id: `${item.id}-ar`,
          type: 'missing_ar',
          message: 'AR modeli eksik',
          itemId: item.id,
          itemName: item.name,
          severity: 'warning',
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/dashboard/menu"
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          Menüyü Düzenle
        </Link>
      </div>

      <DashboardClient
        todayViews={todayViews || 0}
        todayAROpens={todayAROpens || 0}
        topViewedItem={topViewedItem ? { name: topViewedItem[1].name, count: topViewedItem[1].count } : null}
        bestUpsellItem={topUpsellItem ? { name: topUpsellItem.name, count: topUpsellItem.recommended_item_ids?.length || 0 } : null}
        restaurant={restaurant}
        healthIssues={healthIssues}
        hasMenuItems={hasMenuItems || false}
      />
    </div>
  )
}

