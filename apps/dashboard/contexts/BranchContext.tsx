'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Branch {
  id: string
  name: string
  slug: string
  is_active: boolean
}

interface BranchContextType {
  activeBranchId: string | null
  setActiveBranchId: (id: string | null) => void
  branches: Branch[]
  isLoading: boolean
  requireBranch: () => string | null
  refreshBranches: () => Promise<void>
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

export function BranchProvider({ children, restaurantId }: { children: React.ReactNode; restaurantId: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Persist to cookie and localStorage
  const setActiveBranchId = useCallback((id: string | null) => {
    setActiveBranchIdState(id)
    
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('activeBranchId', id)
        document.cookie = `activeBranchId=${id}; path=/; max-age=31536000; SameSite=Lax`
      } else {
        localStorage.removeItem('activeBranchId')
        document.cookie = 'activeBranchId=; path=/; max-age=0'
      }
    }
    
    // Trigger router refresh to update server components
    router.refresh()
  }, [router])

  // Load branches
  const refreshBranches = useCallback(async () => {
    try {
      const response = await fetch('/api/branches')
      if (!response.ok) return
      
      const data = await response.json()
      const activeBranches = (data.branches || []).filter((b: Branch) => b.is_active)
      setBranches(activeBranches)
      
      return activeBranches
    } catch (error) {
      console.error('Error loading branches:', error)
      return []
    }
  }, [])

  // Resolve initial activeBranchId
  useEffect(() => {
    const resolveActiveBranch = async () => {
      setIsLoading(true)
      
      // Load branches first
      const loadedBranches = await refreshBranches()
      
      if (!loadedBranches || loadedBranches.length === 0) {
        setActiveBranchIdState(null)
        setIsLoading(false)
        return
      }

      // Priority: URL param > cookie > localStorage > first active branch
      let resolvedId: string | null = null

      // 1. Check URL param
      const urlBranchId = searchParams?.get('branch')
      if (urlBranchId && loadedBranches.find((b: Branch) => b.id === urlBranchId)) {
        resolvedId = urlBranchId
      }

      // 2. Check cookie
      if (!resolvedId && typeof document !== 'undefined') {
        const cookies = document.cookie.split(';')
        const cookieBranch = cookies
          .find(c => c.trim().startsWith('activeBranchId='))
          ?.split('=')[1]
          ?.trim()
        
        if (cookieBranch && loadedBranches.find((b: Branch) => b.id === cookieBranch)) {
          resolvedId = cookieBranch
        }
      }

      // 3. Check localStorage
      if (!resolvedId && typeof window !== 'undefined') {
        const stored = localStorage.getItem('activeBranchId')
        if (stored && loadedBranches.find((b: Branch) => b.id === stored)) {
          resolvedId = stored
        }
      }

      // 4. Default to first active branch
      if (!resolvedId && loadedBranches.length > 0) {
        resolvedId = loadedBranches[0].id
      }

      if (resolvedId) {
        setActiveBranchIdState(resolvedId)
        // Persist the resolved ID
        if (typeof window !== 'undefined') {
          localStorage.setItem('activeBranchId', resolvedId)
          document.cookie = `activeBranchId=${resolvedId}; path=/; max-age=31536000; SameSite=Lax`
        }
      }
      
      setIsLoading(false)
    }

    resolveActiveBranch()
  }, [searchParams, refreshBranches])

  // requireBranch helper
  const requireBranch = useCallback((): string | null => {
    if (!activeBranchId) {
      toast.error('Lütfen önce bir şube seçin')
      return null
    }
    return activeBranchId
  }, [activeBranchId])

  return (
    <BranchContext.Provider
      value={{
        activeBranchId,
        setActiveBranchId,
        branches,
        isLoading,
        requireBranch,
        refreshBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  )
}

export function useActiveBranch() {
  const context = useContext(BranchContext)
  if (context === undefined) {
    throw new Error('useActiveBranch must be used within BranchProvider')
  }
  return context
}

