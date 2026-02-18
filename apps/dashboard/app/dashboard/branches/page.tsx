import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BranchManagement from '@/components/BranchManagement'

export default async function BranchesPage() {
  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_user_id', user.id)
    .single()

  if (!restaurant) {
    redirect('/dashboard')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Şubeler</h1>
        <p className="mt-2 text-sm text-gray-600">
          Restoran şubelerinizi yönetin
        </p>
      </div>
      <BranchManagement restaurantId={restaurant.id} />
    </div>
  )
}

