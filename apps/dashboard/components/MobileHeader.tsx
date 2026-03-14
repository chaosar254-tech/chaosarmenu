'use client'

import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'

interface MobileHeaderProps {
  onMenuClick: () => void
  restaurantName: string | null
}

export default function MobileHeader({ onMenuClick, restaurantName }: MobileHeaderProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900 truncate flex-1 min-w-0 mr-3">
          {restaurantName || 'Restoran Paneli'}
        </h1>
        <button
          onClick={onMenuClick}
          aria-label="Menü"
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 shrink-0"
        >
          {mounted ? <Menu size={24} /> : <span className="inline-block w-6 h-6" aria-hidden />}
        </button>
      </div>
    </header>
  )
}

