'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Branch {
  id: string
  name: string
  slug: string
  address: string | null
  phone: string | null
  is_active: boolean
  created_at: string
}

interface BranchManagementProps {
  restaurantId: string
}

export default function BranchManagement({ restaurantId }: BranchManagementProps) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [canAddBranches, setCanAddBranches] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    address: '',
    phone: '',
    is_active: true,
    copy_menu_from_branch_id: '', // Source branch ID for menu cloning
  })

  useEffect(() => {
    loadBranches()
    loadRestaurantPermission()
  }, [restaurantId])

  const loadRestaurantPermission = async () => {
    try {
      const response = await fetch('/api/restaurants/permission')
      if (response.ok) {
        const data = await response.json()
        setCanAddBranches(data.can_add_branches || false)
      }
    } catch (error) {
      console.error('Error loading permission:', error)
    }
  }

  const loadBranches = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/branches')
      if (!response.ok) throw new Error('Failed to fetch branches')
      const data = await response.json()
      setBranches(data.branches || [])
    } catch (error: any) {
      toast.error('Şubeler yüklenirken hata: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Ad ve slug gereklidir')
      return
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      toast.error('Slug sadece küçük harf, rakam ve tire içerebilir')
      return
    }

    try {
      const url = editingBranch ? `/api/branches/${editingBranch.id}` : '/api/branches'
      const method = editingBranch ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim().toLowerCase(),
          address: formData.address.trim() || null,
          phone: formData.phone.trim() || null,
          is_active: formData.is_active,
          // Only include copy_menu_from_branch_id for new branches (not editing)
          ...(editingBranch ? {} : { copy_menu_from_branch_id: formData.copy_menu_from_branch_id || null }),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'İşlem başarısız')
      }

      toast.success(editingBranch ? 'Şube güncellendi' : 'Şube oluşturuldu' + (formData.copy_menu_from_branch_id ? ' (Menü kopyalandı)' : ''))
      setShowModal(false)
      setEditingBranch(null)
      setFormData({ name: '', slug: '', address: '', phone: '', is_active: true, copy_menu_from_branch_id: '' })
      loadBranches()
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu')
    }
  }

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch)
    setFormData({
      name: branch.name,
      slug: branch.slug,
      address: branch.address || '',
      phone: branch.phone || '',
      is_active: branch.is_active,
      copy_menu_from_branch_id: '', // Not used when editing
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu şubeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return
    }

    try {
      const response = await fetch(`/api/branches/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Silme işlemi başarısız')
      }

      toast.success('Şube silindi')
      loadBranches()
    } catch (error: any) {
      toast.error(error.message || 'Silme hatası')
    }
  }

  const handleToggleActive = async (branch: Branch) => {
    try {
      const response = await fetch(`/api/branches/${branch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !branch.is_active }),
      })

      if (!response.ok) throw new Error('Güncelleme başarısız')

      toast.success(branch.is_active ? 'Şube pasif edildi' : 'Şube aktif edildi')
      loadBranches()
    } catch (error: any) {
      toast.error(error.message || 'Güncelleme hatası')
    }
  }

  if (loading) {
    return <div className="text-center py-12">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Şubeler Listesi</h2>
        {canAddBranches ? (
          <button
            onClick={() => {
              setEditingBranch(null)
              // Default to first branch for menu copying (main branch)
              const defaultSourceBranch = branches.length > 0 ? branches[0].id : ''
              setFormData({ name: '', slug: '', address: '', phone: '', is_active: true, copy_menu_from_branch_id: defaultSourceBranch })
              setShowModal(true)
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            + Şube Ekle
          </button>
        ) : (
          <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md text-sm border border-gray-300">
            Şube ekleme izniniz bulunmuyor
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Adres
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telefon
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {branches.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Henüz şube eklenmedi
                </td>
              </tr>
            ) : (
              branches.map((branch) => (
                <tr key={branch.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {branch.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {branch.slug}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {branch.address || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {branch.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(branch)}
                      className={`px-2 py-1 text-xs rounded-full ${
                        branch.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {branch.is_active ? 'Aktif' : 'Pasif'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(branch)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(branch.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {branches.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 bg-white rounded-lg shadow">
            Henüz şube eklenmedi
          </div>
        ) : (
          branches.map((branch) => (
            <div key={branch.id} className="bg-white shadow rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {branch.name}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">Slug: {branch.slug}</p>
                  {branch.address && (
                    <p className="mt-1 text-xs text-gray-500 truncate">{branch.address}</p>
                  )}
                  {branch.phone && (
                    <p className="mt-1 text-xs text-gray-500">{branch.phone}</p>
                  )}
                </div>
                <button
                  onClick={() => handleToggleActive(branch)}
                  className={`px-2 py-1 text-xs rounded-full shrink-0 ml-2 ${
                    branch.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {branch.is_active ? 'Aktif' : 'Pasif'}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(branch)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-900 border border-primary-600 rounded-md hover:bg-primary-50"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => handleDelete(branch.id)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-900 border border-red-600 rounded-md hover:bg-red-50"
                >
                  Sil
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto z-50 flex items-start justify-center p-4">
          <div className="relative w-full max-w-md mt-4 mb-4 p-4 sm:p-5 border shadow-lg rounded-md bg-white max-h-[calc(100vh-2rem)] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingBranch ? 'Şube Düzenle' : 'Yeni Şube'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şube Adı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Örn: Kadıköy Şubesi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug * (URL uyumlu)
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="kadikoy-subesi"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Sadece küçük harf, rakam ve tire
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="Şube adresi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="+90 555 123 4567"
                />
              </div>
              {!editingBranch && branches.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Menüyü Kopyala (Opsiyonel)
                  </label>
                  <select
                    value={formData.copy_menu_from_branch_id}
                    onChange={(e) => setFormData({ ...formData, copy_menu_from_branch_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Menüyü kopyalama (boş menü ile başla)</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} (Mevcut menüyü kopyala)
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Seçilen şubenin menü kategorileri ve ürünleri yeni şubeye kopyalanacak. Kopyalama sonrası şubeler bağımsızdır.
                  </p>
                </div>
              )}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Aktif
                </label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingBranch(null)
                    setFormData({ name: '', slug: '', address: '', phone: '', is_active: true, copy_menu_from_branch_id: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {editingBranch ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

