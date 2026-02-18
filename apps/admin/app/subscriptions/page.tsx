import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SubscriptionsManagementClient from './components/SubscriptionsManagementClient'

export default async function SubscriptionsPage() {
  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if user is super admin
  // Geçici olarak admin kontrolünü esnek tutuyoruz (middleware'de de bypass var)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  // Geçici olarak admin kontrolünü bypass ediyoruz (production'da aktif edilecek)
  if (profileError) {
    console.warn('Profile not found for user:', user.id, 'Allowing access temporarily')
  } else if (profile && !profile.is_admin) {
    console.warn('User is not admin:', user.id, 'Allowing access temporarily')
    // Production'da bu satırı aktif edin:
    // redirect('/unauthorized')
  }

  return <SubscriptionsManagementClient />
}
