'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useActiveBranch } from '@/contexts/BranchContext'

export default function BranchSwitcher() {
  const { activeBranchId, setActiveBranchId, branches, isLoading } = useActiveBranch()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const selectedBranch = branches.find(b => b.id === activeBranchId)

  if (isLoading) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        Yükleniyor...
      </div>
    )
  }

  if (branches.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-yellow-600 bg-yellow-50 rounded-md border border-yellow-200">
        Henüz aktif şube yok. Lütfen <a href="/dashboard/branches" className="underline font-medium">şube ekleyin</a>.
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <span className="truncate max-w-[200px]">
          {selectedBranch ? `📍 ${selectedBranch.name}` : 'Şube Seçiniz'}
        </span>
        {mounted ? (
          <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        ) : (
          <span className="inline-block w-4 h-4" aria-hidden />
        )}
      </button>

      {dropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-64 overflow-y-auto">
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => {
                  setActiveBranchId(branch.id)
                  setDropdownOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                  branch.id === activeBranchId ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-700'
                }`}
              >
                <span>{branch.name}</span>
                {branch.is_active && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                    Aktif
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

