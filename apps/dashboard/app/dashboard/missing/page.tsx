import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import MissingItemsClient from '@/components/MissingItemsClient'

async function MissingItemsContent() {
  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get restaurant with plan
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, plan')
    .eq('owner_user_id', user.id)
    .single()

  if (!restaurant) {
    redirect('/dashboard')
  }

  // Get all menu items with categories
  const { data: items } = await supabase
    .from('menu_items')
    .select(`
      id,
      name,
      image_path,
      image_url,
      ingredients,
      allergens,
      recommended_item_ids,
      has_ar,
      model_glb,
      model_usdz,
      category_id,
      menu_categories (
        id,
        name
      )
    `)
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (!items) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ürün yüklenirken hata oluştu.</p>
      </div>
    )
  }

  return (
    <MissingItemsClient 
      items={items || []} 
      restaurantPlan={restaurant.plan || 'starter'}
    />
  )
}

function MissingItemsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Table Skeleton */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-32" />
        </div>
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function MissingItemsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Eksik Ürünler</h1>
        <p className="mt-2 text-sm text-gray-600">
          Menünüzde eksik içerik olan ürünleri görüntüleyin ve düzeltin
        </p>
      </div>
      <Suspense fallback={<MissingItemsSkeleton />}>
        <MissingItemsContent />
      </Suspense>
    </div>
  )
}

