'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useSubscription } from '@/lib/subscription-context'

interface Restaurant {
  id: string
  name: string
  slug: string
}

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
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

export default function MobileDrawer({ isOpen, onClose, restaurant }: MobileDrawerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isSubscriptionExpired } = useSubscription()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Çıkış yapıldı')
    router.push('/login')
    router.refresh()
    onClose()
  }

  const navItems = isSubscriptionExpired
    ? ALL_NAV_ITEMS.filter((item) => item.href === '/dashboard/billing')
    : ALL_NAV_ITEMS

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 overflow-y-auto lg:hidden shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 shrink-0">
            <h1 className="text-lg font-bold text-gray-900">Menü</h1>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Kapat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700">
                {restaurant?.name || 'Restoran'}
              </p>
              <p className="text-xs text-gray-500">@{restaurant?.slug || 'slug'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left text-sm text-gray-600 hover:text-gray-900 py-2"
            >
              Çıkış yap
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

