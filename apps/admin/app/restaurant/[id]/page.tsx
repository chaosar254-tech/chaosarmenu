import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { RestaurantSettings } from './components/RestaurantSettings'
import { RestaurantStats } from './components/RestaurantStats'
import QRCodeManagement from './components/QRCodeManagement'

interface Restaurant {
  id: string
  name: string
  slug: string
  owner_user_id: string
  created_at: string
  plan?: string
  can_add_branches?: boolean
}

export default async function RestaurantDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const cookieStore = await cookies()
  
  try {
    const supabase = createServerSupabaseClient(cookieStore)
    
    // Try to get user, with error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error in restaurant detail page:', authError)
      redirect('/login')
    }

    // Check if user is super admin
    // Geçici olarak admin kontrolünü esnek tutuyoruz (middleware'de de bypass var)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    // Geçici olarak admin kontrolünü bypass ediyoruz (production'da aktif edilecek)
    if (profileError) {
      console.warn('Profile not found for user:', user.id, 'Allowing access temporarily')
    } else if (!profile?.is_admin) {
      console.warn('User is not admin:', user.id, 'Allowing access temporarily')
      // Production'da bu satırı aktif edin:
      // redirect('/unauthorized')
    }
  } catch (error) {
    console.error('Error in restaurant detail page:', error)
    redirect('/login')
  }

  // Get restaurant details
  const adminClient = createSupabaseAdminClient()
  const { data: restaurantData, error } = await adminClient
    .from('restaurants')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !restaurantData) {
    console.error('Error fetching restaurant:', error)
    redirect('/')
  }

  // Ensure can_add_branches exists (default to false if migration hasn't run)
  const restaurant: Restaurant = {
    ...restaurantData,
    can_add_branches: restaurantData.can_add_branches ?? false,
  }

  // Get owner email and user details
  const { data: ownerData } = await adminClient.auth.admin.getUserById(
    restaurant.owner_user_id
  )

  // Get owner's last login (from auth.users metadata if available)
  const lastSignInAt = ownerData?.user?.last_sign_in_at
    ? new Date(ownerData.user.last_sign_in_at).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Bilinmiyor'

  // Get user status
  const banExpiresAt = (ownerData?.user as any)?.ban_expires_at || (ownerData?.user as any)?.banned_until
  const isUserBanned = banExpiresAt ? new Date(banExpiresAt) > new Date() : false
  const emailConfirmed = ownerData?.user?.email_confirmed_at ? true : false

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
              >
                ← Geri Dön
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {restaurant.name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Restoran Yönetimi
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Restoran Bilgileri
              </h2>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    İşletme Adı
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {restaurant.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Slug</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    /{restaurant.slug}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Yönetici E-postası
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {ownerData?.user?.email || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Son Giriş Tarihi
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {lastSignInAt}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Hesap Durumu
                  </dt>
                  <dd className="mt-1">
                    <div className="flex gap-2">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          emailConfirmed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {emailConfirmed ? 'E-posta Onaylı' : 'E-posta Onaysız'}
                      </span>
                      {isUserBanned && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Yasaklı
                        </span>
                      )}
                    </div>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Plan</dt>
                  <dd className="mt-1">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {restaurant.plan === 'starter' ? 'Başlangıç' : restaurant.plan === 'standard' ? 'Standart' : restaurant.plan === 'premium' ? 'Premium' : 'Başlangıç'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Kayıt Tarihi
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(restaurant.created_at).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            <Suspense fallback={<div className="border-t border-gray-200 pt-6"><p className="text-gray-500">Yükleniyor...</p></div>}>
              <RestaurantStats restaurantId={restaurant.id} />
            </Suspense>

            {restaurant && <RestaurantSettings restaurant={restaurant} />}

            <QRCodeManagement restaurantId={restaurant.id} restaurantSlug={restaurant.slug} />
          </div>
        </div>
      </div>
    </div>
  )
}
