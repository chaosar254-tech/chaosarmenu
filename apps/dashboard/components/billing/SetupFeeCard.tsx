'use client'

import { useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

interface SetupFeeCardProps {
  enabled: boolean
  amount: number
  paymentLink: string | null
  onUpdate: (data: { setup_fee_enabled: boolean; setup_fee_amount: number; setup_fee_payment_link: string | null }) => Promise<void>
}

export default function SetupFeeCard({ enabled, amount, paymentLink, onUpdate }: SetupFeeCardProps) {
  const [localEnabled, setLocalEnabled] = useState(enabled)
  const [localAmount, setLocalAmount] = useState(amount.toString())
  const [localLink, setLocalLink] = useState(paymentLink || '')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleSave = async () => {
    // Validation
    const numAmount = parseFloat(localAmount)
    if (isNaN(numAmount) || numAmount < 0) {
      toast.error('Kurulum ücreti geçerli bir sayı olmalıdır (0 veya daha büyük)')
      return
    }

    if (localEnabled && numAmount > 0 && !localLink.trim()) {
      toast.error('Kurulum ücreti etkinse ve tutar 0\'dan büyükse ödeme linki gereklidir')
      return
    }

    setIsSaving(true)
    try {
      await onUpdate({
        setup_fee_enabled: localEnabled,
        setup_fee_amount: numAmount,
        setup_fee_payment_link: localLink.trim() || null,
      })
      setHasChanges(false)
      toast.success('Kurulum ücreti ayarları kaydedildi')
    } catch (error: any) {
      toast.error(error.message || 'Kaydetme sırasında bir hata oluştu')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyLink = () => {
    if (!localLink.trim()) {
      toast.error('Kopyalanacak link yok')
      return
    }
    navigator.clipboard.writeText(localLink.trim())
    toast.success('Link kopyalandı')
  }

  const handleTestLink = () => {
    if (!localLink.trim()) {
      toast.error('Test edilecek link yok')
      return
    }
    window.open(localLink.trim(), '_blank', 'noopener,noreferrer')
  }

  const handleChange = () => {
    setHasChanges(true)
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Kurulum Ücreti</h2>

      <div className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Kurulum Ücreti Aktif</label>
            <p className="text-xs text-gray-500">Kurulum ücreti tahsilatını etkinleştir</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localEnabled}
              onChange={(e) => {
                setLocalEnabled(e.target.checked)
                handleChange()
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="setup_fee_amount" className="block text-sm font-medium text-gray-700 mb-1">
            Kurulum Ücreti (TRY)
          </label>
          <input
            type="number"
            id="setup_fee_amount"
            min="0"
            step="0.01"
            value={localAmount}
            onChange={(e) => {
              setLocalAmount(e.target.value)
              handleChange()
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="0.00"
          />
        </div>

        {/* Payment Link */}
        <div>
          <label htmlFor="setup_fee_payment_link" className="block text-sm font-medium text-gray-700 mb-1">
            Ödeme Linki (İyzico Link/Pay Link)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              id="setup_fee_payment_link"
              value={localLink}
              onChange={(e) => {
                setLocalLink(e.target.value)
                handleChange()
              }}
              className="flex-1 block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="https://..."
            />
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={!localLink.trim()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Linki kopyala"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleTestLink}
              disabled={!localLink.trim()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Test et"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

