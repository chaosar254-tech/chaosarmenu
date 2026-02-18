'use client'

import { useState, useEffect } from 'react'

export interface PaymentRow {
  id: string
  amount: number | null
  currency: string
  plan: string
  period: string | null
  status: string
  paid_at: string
  invoice_url: string | null
  created_at: string
}

const PLAN_NAMES: Record<string, string> = {
  starter: 'Starter',
  standard: 'Standart',
  premium: 'Pro',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatAmount(amount: number | null, currency: string): string {
  if (amount == null) return '—'
  return `${Number(amount).toLocaleString('tr-TR')} ${currency}`
}

export default function PaymentsList() {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/billing/payments')
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j?.error || 'Ödemeler yüklenemedi')
        }
        const { data } = await res.json()
        if (!cancelled) setPayments(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Bir hata oluştu')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ödeme Geçmişi</h2>
        <div className="flex items-center justify-center py-12 text-gray-500">
          Yükleniyor…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ödeme Geçmişi</h2>
        <div className="text-center py-8 text-red-600 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Ödeme Geçmişi</h2>
        <p className="text-sm text-gray-500 mt-0.5">Abonelik ödemelerinizin listesi</p>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12 px-6">
          <div className="text-4xl mb-4">📄</div>
          <p className="text-gray-500 text-sm">Ödeme kaydı bulunmuyor</p>
          <p className="text-gray-400 text-xs mt-1">Yaptığınız ödemeler burada listelenecek</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ödeme Tarihi
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paket
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutar
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fatura
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(row.paid_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {PLAN_NAMES[row.plan] ?? row.plan}
                    {row.period === 'yearly' ? ' (Yıllık)' : row.period === 'monthly' ? ' (Aylık)' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatAmount(row.amount, row.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={
                        row.status === 'success'
                          ? 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800'
                          : 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800'
                      }
                    >
                      {row.status === 'success' ? 'Başarılı' : 'Başarısız'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {row.invoice_url ? (
                      <a
                        href={row.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Fatura
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
