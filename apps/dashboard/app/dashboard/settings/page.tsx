import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RestaurantSettings from '@/components/RestaurantSettings'
import { getActiveBranchId, validateBranchAccess } from '@/lib/branch-utils'

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch restaurant data (without cover_image for backward compatibility until migration is run)
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, logo_path, template_id, theme_primary, theme_bg, theme_card, theme_text, theme_mode, include_vat, has_service_fee, service_fee_amount, has_cover_charge, allergen_disclaimer, google_place_id, google_review_url, instagram_url, tiktok_url, x_url, twitter_url, google_rating, google_review_count, google_rating_updated_at, supported_languages')
    .eq('owner_user_id', user.id)
    .single()

  // Show empty state instead of redirecting
  if (!restaurant) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Restoran Ayarları</h1>
          <p className="mt-2 text-sm text-gray-600">
            Restoran bilgilerinizi düzenleyin
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Restoran Bulunamadı
            </h2>
            <p className="text-gray-600 mb-6">
              Henüz bir restoran kaydınız bulunmuyor. Başlamak için bir restoran oluşturun.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Dashboard'a Dön
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Get active branch ID from cookie (server-side)
  const activeBranchId = await getActiveBranchId()

  // Validate branch access if branchId is provided
  let validBranchId: string | null = null
  if (activeBranchId) {
    const validation = await validateBranchAccess(supabase, activeBranchId)
    if (validation.valid && validation.restaurantId === restaurant.id) {
      validBranchId = activeBranchId
    }
  }

  // Check if there are any branches for this restaurant
  const { data: branches } = await supabase
    .from('branches')
    .select('id')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)
    .limit(1)

  const hasBranches = branches && branches.length > 0

  // Show empty state if no branch selected but branches exist
  if (hasBranches && !validBranchId) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Restoran Ayarları</h1>
          <p className="mt-2 text-sm text-gray-600">
            Restoran bilgilerinizi düzenleyin
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium mb-2">Şube Seçiniz</p>
          <p className="text-sm text-yellow-700 mb-4">
            Ayarları görüntülemek için yukarıdaki dropdown'dan bir şube seçin.
          </p>
          <Link
            href="/dashboard/branches"
            className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
          >
            Şube Yönetimi
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Restoran Ayarları</h1>
        <p className="mt-2 text-sm text-gray-600">
          Restoran bilgilerinizi düzenleyin
        </p>
      </div>
      <RestaurantSettings restaurant={restaurant} initialBranchId={validBranchId} />
    </div>
  )
}

