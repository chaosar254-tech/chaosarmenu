'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import toast from 'react-hot-toast'

interface Application {
  id: string
  business_name: string
  contact_email: string
  contact_phone: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function ApplicationsManagementClient() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Approve modal state
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [approveSubject, setApproveSubject] = useState<string>('ChaosAR Başvurunuz Onaylandı! 🚀')
  const [approveMessage, setApproveMessage] = useState<string>('')
  const [sendingEmail, setSendingEmail] = useState(false)

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedRejectApplication, setSelectedRejectApplication] = useState<Application | null>(null)
  const [rejectSubject, setRejectSubject] = useState<string>('ChaosAR Başvuru Durumu')
  const [rejectMessage, setRejectMessage] = useState<string>('')
  const [sendingRejectEmail, setSendingRejectEmail] = useState(false)

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Load applications
  const loadApplications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/applications?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load applications')
      }

      setApplications(result.applications || [])
    } catch (error: any) {
      console.error('[Applications] Load error:', error)
      toast.error('Başvurular yüklenirken hata: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
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
  const handleApproveClick = (application: Application) => {
    // Pre-fill message template
    const template = `Merhaba ${application.business_name},

Başvurunuz başarıyla onaylandı! 🎉

Artık ChaosAR platformunu kullanmaya başlayabilirsiniz. Giriş yapmak için aşağıdaki bilgileri kullanabilirsiniz:

Giriş Bilgileriniz:
- E-posta: ${application.contact_email}
- Şifre: (Şifre oluşturma bağlantısı size ayrıca gönderilecektir)

Platforma giriş yaptıktan sonra:
1. İşletme bilgilerinizi tamamlayın
2. Menünüzü oluşturun
3. QR kodlarınızı alın

Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.

İyi çalışmalar!

ChaosAR Ekibi`

    setApproveMessage(template)
    setSelectedApplication(application)
    setShowApproveModal(true)
  }

  // Handle approve and send email
  const handleApproveAndSend = async () => {
    if (!selectedApplication || !approveSubject || !approveMessage) {
      toast.error('Lütfen konu ve mesaj alanlarını doldurun')
      return
    }

    setSendingEmail(true)

    try {
      const response = await fetch('/api/applications/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: selectedApplication.id,
          subject: approveSubject,
          message: approveMessage,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve application')
      }

      toast.success(result.message || 'Başvuru onaylandı ve e-posta gönderildi')
      setShowApproveModal(false)
      setSelectedApplication(null)
      setApproveSubject('ChaosAR Başvurunuz Onaylandı! 🚀')
      setApproveMessage('')
      loadApplications() // Refresh table data
    } catch (error: any) {
      console.error('[Applications] Approve error:', error)
      toast.error('Hata: ' + error.message)
    } finally {
      setSendingEmail(false)
    }
  }

  // Close approve modal
  const handleCloseApproveModal = () => {
    setShowApproveModal(false)
    setSelectedApplication(null)
    setApproveSubject('ChaosAR Başvurunuz Onaylandı! 🚀')
    setApproveMessage('')
  }

  // Handle reject button click - open modal
  const handleRejectClick = (application: Application) => {
    // Pre-fill message template
    const template = `Merhaba ${application.business_name},

Başvurunuzu inceledik ancak şu an için kabul edemiyoruz. İlginiz için teşekkürler.

Gelecekte yeni fırsatlar olursa sizinle iletişime geçmekten mutluluk duyarız.

Saygılarımızla,

ChaosAR Ekibi`

    setRejectMessage(template)
    setSelectedRejectApplication(application)
    setShowRejectModal(true)
  }

  // Handle reject and send email
  const handleRejectAndSend = async () => {
    if (!selectedRejectApplication || !rejectSubject || !rejectMessage) {
      toast.error('Lütfen konu ve mesaj alanlarını doldurun')
      return
    }

    setSendingRejectEmail(true)

    try {
      const response = await fetch('/api/applications/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: selectedRejectApplication.id,
          subject: rejectSubject,
          message: rejectMessage,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject application')
      }

      toast.success(result.message || 'Başvuru reddedildi ve bilgilendirme maili gönderildi')
      setShowRejectModal(false)
      setSelectedRejectApplication(null)
      setRejectSubject('ChaosAR Başvuru Durumu')
      setRejectMessage('')
      loadApplications() // Refresh table data
    } catch (error: any) {
      console.error('[Applications] Reject error:', error)
      toast.error('Hata: ' + error.message)
    } finally {
      setSendingRejectEmail(false)
    }
  }

  // Close reject modal
  const handleCloseRejectModal = () => {
    setShowRejectModal(false)
    setSelectedRejectApplication(null)
    setRejectSubject('ChaosAR Başvuru Durumu')
    setRejectMessage('')
  }

  // Handle delete
  const handleDelete = async (applicationId: string) => {
    if (!confirm('Bu başvuruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return
    }

    try {
      const response = await fetch(`/api/applications?id=${applicationId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete application')
      }

      toast.success('Başvuru silindi')
      loadApplications() // Refresh table data
    } catch (error: any) {
      console.error('[Applications] Delete error:', error)
      toast.error('Hata: ' + error.message)
    }
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
            className="w-full text-left px-4 py-3 rounded-lg transition-colors bg-gray-900 text-white block"
          >
            Başvurular
          </Link>
          <Link
            href="/demo-requests"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
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
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durum Filtresi
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="all">Tümü</option>
                  <option value="pending">Beklemede</option>
                  <option value="approved">Onaylandı</option>
                  <option value="rejected">Reddedildi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Applications Table */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-600">Yükleniyor...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşletme Adı
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        E-posta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telefon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Başvuru Tarihi
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          {statusFilter === 'all' 
                            ? 'Henüz başvuru bulunmuyor.'
                            : `${statusFilter === 'pending' ? 'Beklemede' : statusFilter === 'approved' ? 'Onaylandı' : 'Reddedildi'} durumunda başvuru bulunmuyor.`
                          }
                        </td>
                      </tr>
                    ) : (
                      applications.map((application) => (
                        <tr key={application.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {application.business_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {application.contact_email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {application.contact_phone}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(application.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(application.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              {application.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApproveClick(application)}
                                    className="text-green-600 hover:text-green-900 text-xs"
                                  >
                                    Onayla
                                  </button>
                                  <button
                                    onClick={() => handleRejectClick(application)}
                                    className="text-red-600 hover:text-red-900 text-xs"
                                  >
                                    Reddet
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDelete(application.id)}
                                className="text-gray-600 hover:text-gray-900 text-xs"
                              >
                                Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Başvuruyu Onayla ve Mail Gönder
            </h3>
            
            <div className="space-y-4">
              {/* To (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alıcı
                </label>
                <input
                  type="email"
                  value={selectedApplication.contact_email}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={approveSubject}
                  onChange={(e) => setApproveSubject(e.target.value)}
                  disabled={sendingEmail}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="E-posta konusu"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mesaj <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={approveMessage}
                  onChange={(e) => setApproveMessage(e.target.value)}
                  disabled={sendingEmail}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="E-posta mesajı"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleApproveAndSend}
                disabled={sendingEmail || !approveSubject || !approveMessage}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {sendingEmail ? 'Gönderiliyor...' : 'Onayla ve Gönder'}
              </button>
              <button
                onClick={handleCloseApproveModal}
                disabled={sendingEmail}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 font-medium"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRejectApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Başvuruyu Reddet
            </h3>
            
            <div className="space-y-4">
              {/* To (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alıcı
                </label>
                <input
                  type="email"
                  value={selectedRejectApplication.contact_email}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={rejectSubject}
                  onChange={(e) => setRejectSubject(e.target.value)}
                  disabled={sendingRejectEmail}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="E-posta konusu"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mesaj <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  disabled={sendingRejectEmail}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="E-posta mesajı"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleRejectAndSend}
                disabled={sendingRejectEmail || !rejectSubject || !rejectMessage}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {sendingRejectEmail ? 'Gönderiliyor...' : 'Reddet ve Mail Gönder'}
              </button>
              <button
                onClick={handleCloseRejectModal}
                disabled={sendingRejectEmail}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 font-medium"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
