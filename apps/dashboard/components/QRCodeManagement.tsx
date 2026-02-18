'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { buildMenuUrl } from './MenuLink'
import { useActiveBranch } from '@/contexts/BranchContext'

interface Table {
  id: string
  branch_id: string
  table_no: string
  qr_slug: string
  is_active: boolean
  created_at: string
}

interface QRCodeManagementProps {
  restaurant: {
    id: string
    slug: string
  }
}

interface BranchInfo {
  id: string
  slug: string
  restaurant_slug: string
}

export default function QRCodeManagement({ restaurant }: QRCodeManagementProps) {
  const { activeBranchId, requireBranch, branches } = useActiveBranch()
  const [tables, setTables] = useState<Table[]>([])
  const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (activeBranchId) {
      loadBranchInfo()
      loadTables()
    } else {
      setTables([])
      setBranchInfo(null)
      setLoading(false)
    }
  }, [activeBranchId])

  const loadBranchInfo = async () => {
    if (!activeBranchId) return
    
    try {
      const response = await fetch(`/api/branches/${activeBranchId}`)
      if (!response.ok) throw new Error('Failed to fetch branch info')
      const data = await response.json()
      if (data.branch) {
        setBranchInfo({
          id: data.branch.id,
          slug: data.branch.slug,
          restaurant_slug: data.branch.restaurant_slug || restaurant.slug,
        })
      }
    } catch (error: any) {
      console.error('Error loading branch info:', error)
      // Fallback to context branch if API fails
      const contextBranch = branches.find(b => b.id === activeBranchId)
      if (contextBranch) {
        setBranchInfo({
          id: contextBranch.id,
          slug: contextBranch.slug,
          restaurant_slug: restaurant.slug,
        })
      }
    }
  }

  const loadTables = async () => {
    if (!activeBranchId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/branches/${activeBranchId}/tables`)
      if (!response.ok) throw new Error('Failed to fetch tables')
      const data = await response.json()
      setTables(data.tables || [])
    } catch (error: any) {
      toast.error('Masa/QR kodlar yüklenirken hata: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!activeBranchId) {
      toast.error('Lütfen önce bir şube seçin')
      return
    }

    const formData = new FormData(e.currentTarget)
    const tableNo = formData.get('table_no') as string
    const qrSlug = formData.get('qr_slug') as string

    if (!tableNo || !tableNo.trim()) {
      toast.error('Masa numarası gereklidir')
      return
    }

    try {
      const response = await fetch(`/api/branches/${activeBranchId}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_no: tableNo.trim(),
          qr_slug: qrSlug?.trim() || undefined,
          is_active: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Oluşturma başarısız')
      }

      toast.success('Masa/QR kod oluşturuldu')
      setShowModal(false)
      loadTables()
    } catch (error: any) {
      toast.error(error.message || 'Hata oluştu')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu masayı/QR kodunu silmek istediğinize emin misiniz?')) return

    if (!activeBranchId) {
      toast.error('Lütfen önce bir şube seçin')
      return
    }

    try {
      const response = await fetch(`/api/branches/${activeBranchId}/tables/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Silme başarısız')
      }

      toast.success('Masa/QR kod silindi')
      loadTables()
    } catch (error: any) {
      toast.error(error.message || 'Hata oluştu')
    }
  }

  // Generate absolute menu URL for table (using restaurantSlug + branchSlug + table_no)
  const getTableMenuUrl = (table: Table): string => {
    if (!branchInfo) return ''
    
    // URL pattern: ${baseUrl}/menu/[restaurantSlug]/[branchSlug]?table=[table_no]
    return buildMenuUrl(branchInfo.restaurant_slug, branchInfo.slug, table.table_no)
  }

  const handleCopyLink = (table: Table) => {
    const url = getTableMenuUrl(table)
    navigator.clipboard.writeText(url)
    toast.success('Link kopyalandı!')
  }

  const handleDownloadSVG = (table: Table) => {
    const svg = document.getElementById(`qr-svg-${table.id}`)
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `masa-${table.table_no}.svg`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('SVG indirildi')
  }

  const handleDownloadPNG = (table: Table) => {
    const svg = document.getElementById(`qr-svg-${table.id}`)
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `masa-${table.table_no}.png`
        link.click()
        URL.revokeObjectURL(url)
        toast.success('PNG indirildi')
      })
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  // Show empty state if no branch selected
  if (!activeBranchId && branches.length > 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800 font-medium mb-2">Şube Seçiniz</p>
        <p className="text-sm text-yellow-700 mb-4">
          Masa/QR kod yönetimi için yukarıdaki dropdown'dan bir şube seçin.
        </p>
        <a
          href="/dashboard/branches"
          className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
        >
          Şube Yönetimi
        </a>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12">Yükleniyor...</div>
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            if (!activeBranchId) {
              toast.error('Lütfen önce bir şube seçin')
              return
            }
            setShowModal(true)
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          + Yeni Masa/QR Oluştur
        </button>
      </div>

      {tables.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">Henüz masa/QR kod oluşturulmamış</p>
          <button
            onClick={() => {
              if (!activeBranchId) {
                toast.error('Lütfen önce bir şube seçin')
                return
              }
              setShowModal(true)
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            İlk Masanızı Oluşturun
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => {
            const menuUrl = getTableMenuUrl(table)
            return (
              <div key={table.id} className="bg-white shadow rounded-lg p-6">
                <div className="text-center mb-4">
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                    <QRCodeSVG
                      id={`qr-svg-${table.id}`}
                      value={menuUrl}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Masa {table.table_no}
                  </h3>
                  <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">QR URL (Debug):</p>
                    <p className="text-xs text-gray-700 font-mono break-all">
                      {menuUrl || 'URL yükleniyor...'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    QR Slug: {table.qr_slug}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => handleCopyLink(table)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Link Kopyala
                  </button>
                  <button
                    onClick={() => handleDownloadSVG(table)}
                    className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                  >
                    SVG İndir
                  </button>
                  <button
                    onClick={() => handleDownloadPNG(table)}
                    className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                  >
                    PNG İndir
                  </button>
                  <button
                    onClick={() => handleDelete(table.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Sil
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Table/QR Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto z-50 flex items-start justify-center p-4">
          <div className="relative w-full max-w-md mt-4 mb-4 p-4 sm:p-5 border shadow-lg rounded-md bg-white max-h-[calc(100vh-2rem)] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Yeni Masa/QR Oluştur</h3>
            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Masa Numarası *
                </label>
                <input
                  type="text"
                  name="table_no"
                  required
                  placeholder="Örn: 5, 12, A1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Masa numarası veya masa kodu (örn: "5", "A1", "VIP-1")
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  QR Slug (Opsiyonel)
                </label>
                <input
                  type="text"
                  name="qr_slug"
                  placeholder="Otomatik oluşturulur"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Boş bırakılırsa otomatik oluşturulur. URL-friendly slug (örn: "masa-5")
                </p>
              </div>
              {activeBranchId && branchInfo && (
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1 font-medium">Hedef URL Formatı:</p>
                  <p className="text-xs font-mono text-gray-800 break-all">
                    {buildMenuUrl(branchInfo.restaurant_slug, branchInfo.slug, 'XX')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    (XX yerine masa numarası gelecek - Absolute URL)
                  </p>
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


