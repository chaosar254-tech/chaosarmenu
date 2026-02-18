'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useSubscription } from '@/lib/subscription-context'

interface Restaurant {
  id: string
  name: string
  slug: string
}

interface SidebarProps {
  restaurant: Restaurant | null
}

const ALL_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/branches', label: 'Şubeler', icon: '🏢' },
  { href: '/dashboard/menu', label: 'Menü', icon: '📋' },
  { href: '/dashboard/missing', label: 'Eksik Ürünler', icon: '⚠️' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
  { href: '/dashboard/qr-codes', label: 'QR Kodlar', icon: '📱' },
  { href: '/dashboard/billing', label: 'Ödeme Yöntemleri', icon: '💳' },
  { href: '/dashboard/settings', label: 'Restoran Ayarları', icon: '⚙️' },
]

export default function Sidebar({ restaurant }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isSubscriptionExpired } = useSubscription()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Çıkış yapıldı')
    router.push('/login')
    router.refresh()
  }

  // When subscription is overdue, only "Ödeme Yöntemleri" is accessible
  const navItems = isSubscriptionExpired
    ? ALL_NAV_ITEMS.filter((item) => item.href === '/dashboard/billing')
    : ALL_NAV_ITEMS

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-bold text-gray-900">Restoran Paneli</h1>
        </div>
        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {restaurant?.name || 'Restoran'}
                </p>
                <p className="text-xs text-gray-500">@{restaurant?.slug || 'slug'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full text-left text-sm text-gray-600 hover:text-gray-900"
            >
              Çıkış yap
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

