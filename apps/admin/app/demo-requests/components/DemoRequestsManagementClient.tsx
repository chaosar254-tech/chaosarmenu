'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import toast from 'react-hot-toast'

interface DemoRequest {
  id: string
  business_name: string
  contact_email: string
  contact_phone: string
  full_name: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function DemoRequestsManagementClient() {
  const router = useRouter()
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Approve modal state
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null)
  const [approveSubject, setApproveSubject] = useState<string>('ChaosAR Demo Talebiniz Onaylandı!')
  const [approveMessage, setApproveMessage] = useState<string>('')
  const [sendingEmail, setSendingEmail] = useState(false)

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedRejectRequest, setSelectedRejectRequest] = useState<DemoRequest | null>(null)
  const [rejectSubject, setRejectSubject] = useState<string>('ChaosAR Demo Talebi Hakkında')
  const [rejectMessage, setRejectMessage] = useState<string>('')
  const [sendingRejectEmail, setSendingRejectEmail] = useState(false)

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Load demo requests
  const loadDemoRequests = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/demo-requests?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        if (result.demoRequests !== undefined) {
          setDemoRequests(result.demoRequests || [])
          if (result.warning) {
            console.warn('[Demo Requests] Warning:', result.warning)
            toast.error(result.warning, { duration: 5000 })
          }
          return
        }
        throw new Error(result.error || 'Failed to load demo requests')
      }

      setDemoRequests(result.demoRequests || [])
      
      if (result.warning) {
        console.warn('[Demo Requests] Warning:', result.warning)
        toast.error(result.warning, { duration: 5000 })
      }
    } catch (error: any) {
      console.error('[Demo Requests] Load error:', error)
      setDemoRequests([])
      toast.error('Demo talepleri yüklenirken hata: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDemoRequests()
  }, [statusFilter])

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get status badge
  const getStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    const badges = {
      pending: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }

    const labels = {
      pending: 'Beklemede',
      approved: 'Onaylandı',
      rejected: 'Reddedildi',
    }

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badges[status]}`}>
        {labels[status]}
      </span>
    )
  }

  // Handle approve button click - open modal
  const handleApproveClick = (request: DemoRequest) => {
    const template = `Merhaba ${request.full_name || 'Değerli Müşterimiz'},

Demo talebiniz onaylanmıştır! 🎉

Sizinle en kısa sürede iletişime geçerek demo sürecini başlatacağız. Demo sırasında ChaosAR platformunun tüm özelliklerini keşfetme fırsatı bulacaksınız.

Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.

İyi çalışmalar!

ChaosAR Ekibi`

    setApproveMessage(template)
    setSelectedRequest(request)
    setShowApproveModal(true)
  }

  // Handle approve and send email
  const handleApproveAndSend = async () => {
    if (!selectedRequest || !approveSubject || !approveMessage) {
      toast.error('Lütfen konu ve mesaj alanlarını doldurun')
      return
    }

    setSendingEmail(true)

    try {
      const response = await fetch('/api/demo-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: selectedRequest.id,
          subject: approveSubject,
          message: approveMessage,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve demo request')
      }

      toast.success(result.message || 'Demo talebi onaylandı ve e-posta gönderildi')
      setShowApproveModal(false)
      setSelectedRequest(null)
      setApproveSubject('ChaosAR Demo Talebiniz Onaylandı!')
      setApproveMessage('')
      loadDemoRequests() // Refresh table data
    } catch (error: any) {
      console.error('[Demo Requests] Approve error:', error)
      toast.error('Hata: ' + error.message)
    } finally {
      setSendingEmail(false)
    }
  }

  // Close approve modal
  const handleCloseApproveModal = () => {
    setShowApproveModal(false)
    setSelectedRequest(null)
    setApproveSubject('ChaosAR Demo Talebiniz Onaylandı!')
    setApproveMessage('')
  }

  // Handle reject button click - open modal
  const handleRejectClick = (request: DemoRequest) => {
    const template = `Merhaba ${request.full_name || 'Değerli Müşterimiz'},

Demo talebiniz şu an için uygun bulunmamıştır.

İlginiz için teşekkürler. Gelecekte yeni fırsatlar olursa sizinle iletişime geçmekten mutluluk duyarız.

Saygılarımızla,

ChaosAR Ekibi`

    setRejectMessage(template)
    setSelectedRejectRequest(request)
    setShowRejectModal(true)
  }

  // Handle reject and send email
  const handleRejectAndSend = async () => {
    if (!selectedRejectRequest || !rejectSubject || !rejectMessage) {
      toast.error('Lütfen konu ve mesaj alanlarını doldurun')
      return
    }

    setSendingRejectEmail(true)

    try {
      const response = await fetch('/api/demo-requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: selectedRejectRequest.id,
          subject: rejectSubject,
          message: rejectMessage,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject demo request')
      }

      toast.success(result.message || 'Demo talebi reddedildi ve bilgilendirme maili gönderildi')
      setShowRejectModal(false)
      setSelectedRejectRequest(null)
      setRejectSubject('ChaosAR Demo Talebi Hakkında')
      setRejectMessage('')
      loadDemoRequests() // Refresh table data
    } catch (error: any) {
      console.error('[Demo Requests] Reject error:', error)
      toast.error('Hata: ' + error.message)
    } finally {
      setSendingRejectEmail(false)
    }
  }

  // Close reject modal
  const handleCloseRejectModal = () => {
    setShowRejectModal(false)
    setSelectedRejectRequest(null)
    setRejectSubject('ChaosAR Demo Talebi Hakkında')
    setRejectMessage('')
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">ChaosAR</h1>
          <p className="text-sm text-gray-600 mt-1">Super Admin</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
          >
            Restoranlar
          </Link>
          <Link
            href="/users"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
          >
            Kullanıcılar
          </Link>
          <Link
            href="/activity-logs"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
          >
            Aktivite Logları
          </Link>
          <Link
            href="/subscriptions"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
          >
            Abonelikler
          </Link>
          <Link
            href="/applications"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
          >
            Başvurular
          </Link>
          <Link
            href="/demo-requests"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors bg-gray-900 text-white block"
          >
            👁️ Demo Talepleri
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Demo Talepleri</h1>
              <p className="text-gray-600 mt-1">
                Demo menü süresi dolan kullanıcıların başvuruları
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Durum:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="all">Tümü</option>
                <option value="pending">Beklemede</option>
                <option value="approved">Onaylandı</option>
                <option value="rejected">Reddedildi</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
            ) : demoRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Demo talebi bulunamadı.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ad Soyad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        E-posta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telefon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Restoran Adı
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {demoRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.full_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <a
                            href={`mailto:${request.contact_email}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {request.contact_email}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <a
                            href={`tel:${request.contact_phone}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {request.contact_phone}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.business_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApproveClick(request)}
                              disabled={request.status === 'approved' || request.status === 'rejected'}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                request.status === 'approved' || request.status === 'rejected'
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              ✅ Onayla
                            </button>
                            <button
                              onClick={() => handleRejectClick(request)}
                              disabled={request.status === 'approved' || request.status === 'rejected'}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                request.status === 'approved' || request.status === 'rejected'
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-red-600 text-white hover:bg-red-700'
                              }`}
                            >
                              ❌ Reddet
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Toplam</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {demoRequests.length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Beklemede</div>
              <div className="text-2xl font-bold text-orange-600 mt-1">
                {demoRequests.filter((r) => r.status === 'pending').length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Onaylandı</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {demoRequests.filter((r) => r.status === 'approved').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Demo Talebini Onayla</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Konu
                </label>
                <input
                  type="text"
                  value={approveSubject}
                  onChange={(e) => setApproveSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mesaj
                </label>
                <textarea
                  value={approveMessage}
                  onChange={(e) => setApproveMessage(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseApproveModal}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleApproveAndSend}
                disabled={sendingEmail}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {sendingEmail ? 'Gönderiliyor...' : 'Onayla ve Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRejectRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Demo Talebini Reddet</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Konu
                </label>
                <input
                  type="text"
                  value={rejectSubject}
                  onChange={(e) => setRejectSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mesaj
                </label>
                <textarea
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseRejectModal}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleRejectAndSend}
                disabled={sendingRejectEmail}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {sendingRejectEmail ? 'Gönderiliyor...' : 'Reddet ve Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
