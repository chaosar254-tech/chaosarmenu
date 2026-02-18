import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

/**
 * "No branch configured" page
 * Shown when restaurant exists but has no active branches
 */
export default async function NoBranchPage({
  params,
}: {
  params: { restaurantSlug: string }
}) {
  const supabase = createServerSupabaseClient()
  const restaurantSlug = params.restaurantSlug

  // Verify restaurant exists
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug')
    .eq('slug', restaurantSlug)
    .single()

  if (!restaurant) {
    notFound()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F] text-white px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">⚠️</h1>
        <h2 className="text-2xl font-semibold mb-4 text-[#D4AF37]">
          Şube Yapılandırılmamış
        </h2>
        <p className="text-gray-400 mb-6">
          <strong>{restaurant.name}</strong> için henüz aktif bir şube yapılandırılmamış.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Menüyü görüntülemek için lütfen yönetim paneline giriş yapıp en az bir şube oluşturun.
        </p>
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 text-left text-sm">
          <p className="text-yellow-200 font-medium mb-2">Yapılması Gerekenler:</p>
          <ol className="list-decimal list-inside space-y-1 text-yellow-100/80">
            <li>Yönetim paneline giriş yapın</li>
            <li>"Şubeler" sayfasına gidin</li>
            <li>Yeni bir şube oluşturun</li>
            <li>Şubeyi aktif yapın</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

