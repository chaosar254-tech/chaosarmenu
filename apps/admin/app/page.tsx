import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CreateRestaurantModal } from './components/CreateRestaurantModal'

interface Restaurant {
  id: string
  name: string
  slug: string
  owner_user_id: string
  created_at: string
  plan?: string
}

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if user is super admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    // User is not admin, redirect to their appropriate dashboard
    // Check if user owns a restaurant
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_user_id', user.id)
      .maybeSingle()

    if (restaurant) {
      // User is a restaurant owner, redirect to restaurant dashboard
      redirect('https://dashboard.chaosarmenu.com')
    } else {
      // User has no role, redirect to unauthorized page
      redirect('/unauthorized')
    }
  }

  // Get all restaurants with owner email
  const adminClient = createSupabaseAdminClient()
  const { data: restaurants, error } = await adminClient
    .from('restaurants')
    .select('id, name, slug, owner_user_id, created_at, plan')
    .order('created_at', { ascending: false })

  // Get owner emails
  const restaurantsWithEmails: (Restaurant & { owner_email?: string })[] = []
  
  if (restaurants) {
    for (const restaurant of restaurants) {
      const { data: ownerData } = await adminClient.auth.admin.getUserById(
        restaurant.owner_user_id
      )
      restaurantsWithEmails.push({
        ...restaurant,
        owner_email: ownerData?.user?.email || 'N/A',
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Panel</h1>
              <p className="text-sm text-gray-600 mt-1">Restoran Yönetimi</p>
            </div>
            <CreateRestaurantModal />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşletme Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yönetici E-postası
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kayıt Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {restaurantsWithEmails.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Henüz restoran kaydı bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  restaurantsWithEmails.map((restaurant) => (
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
                        <div className="text-sm text-gray-900">
                          {restaurant.owner_email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(restaurant.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {restaurant.plan || 'free'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Aktif
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/restaurant/${restaurant.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Yönet
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
