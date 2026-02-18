'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MoreVertical, ExternalLink, Instagram, Globe } from 'lucide-react'

interface MenuActionsProps {
  googleReviewUrl: string | null
  instagramUrl: string | null
  tiktokUrl: string | null
  websiteUrl: string | null
  themePrimary: string
  themeBg: string
}

// TikTok icon SVG (lucide-react doesn't have TikTok)
const TikTokIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.321 5.562a5.6 5.6 0 0 1-.443-.258 6.563 6.563 0 0 1-1.202-.966c-.014-1.406.011-2.808.011-4.208h-3.38v13.602c0 .936-.23 1.856-.664 2.682a5.856 5.856 0 0 1-5.246 3.24 5.9 5.9 0 0 1-3.24-.945 5.856 5.856 0 0 1-2.682-4.68 5.856 5.856 0 0 1 5.856-5.856c.09 0 .18.006.27.014v3.362a2.494 2.494 0 0 0-.27-.014 2.5 2.5 0 0 0 0 5c1.38 0 2.5-1.12 2.5-2.5V0h3.389c.014.313.028.625.028.943 0 2.094.78 3.996 2.062 5.441v3.116h3.391v-3.938z" />
  </svg>
)

// Google icon SVG
const GoogleIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)

// Helper to sanitize URLs
const sanitizeUrl = (url: string | null | undefined): string | null => {
  if (!url || url.trim() === '') return null
  
  const trimmed = url.trim()
  
  // If already starts with http:// or https://, return as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  
  // Otherwise, prepend https://
  return `https://${trimmed}`
}

// Helper to handle link clicks with analytics
const handleLinkClick = (type: string, url: string) => {
  console.log(`[MenuActions] click_${type}`, { url })
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default function MenuActions({
  googleReviewUrl,
  instagramUrl,
  tiktokUrl,
  websiteUrl,
  themePrimary,
  themeBg,
}: MenuActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only showing UI after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if any links exist
  const hasAnyLinks =
    sanitizeUrl(googleReviewUrl) ||
    sanitizeUrl(instagramUrl) ||
    sanitizeUrl(tiktokUrl) ||
    sanitizeUrl(websiteUrl)

  // Don't render anything if no links and not mounted (prevents hydration issues)
  if (!mounted || !hasAnyLinks) {
    return null
  }

  const sanitizedGoogleUrl = sanitizeUrl(googleReviewUrl)
  const sanitizedInstagramUrl = sanitizeUrl(instagramUrl)
  const sanitizedTiktokUrl = sanitizeUrl(tiktokUrl)
  const sanitizedWebsiteUrl = sanitizeUrl(websiteUrl)

  // Count social links (excluding Google review)
  const socialLinksCount = [sanitizedInstagramUrl, sanitizedTiktokUrl, sanitizedWebsiteUrl].filter(Boolean).length

  return (
    <>
      {/* Trigger Button - Top Right */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-30 p-2.5 rounded-full backdrop-blur-sm transition-all hover:opacity-90 active:scale-95 shadow-lg"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: themePrimary,
          border: `1px solid ${themePrimary}40`,
        }}
        aria-label="İletişim & Yorum"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {/* Overlay - Bottom Sheet on Mobile, Dialog on Desktop */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Bottom Sheet / Dialog */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-[#1A1A1A] rounded-t-3xl sm:rounded-2xl w-full sm:w-[90%] sm:max-w-md shadow-2xl border-t sm:border border-gray-800"
              style={{ maxHeight: '85vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h2 className="text-xl font-semibold text-white">İletişim & Yorum</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-800 transition-colors"
                  aria-label="Kapat"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
                {/* Google Review Button - Primary CTA */}
                {sanitizedGoogleUrl && (
                  <div>
                    <button
                      onClick={() => handleLinkClick('google_review', sanitizedGoogleUrl)}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-base transition-all active:scale-98 shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${themePrimary}, ${themePrimary}DD)`,
                        color: themeBg,
                      }}
                    >
                      <GoogleIcon className="w-6 h-6" />
                      <span>Google'da Yorum Yap</span>
                      <ExternalLink className="w-4 h-4 opacity-80" />
                    </button>
                  </div>
                )}

                {/* Social Media Links */}
                {socialLinksCount > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">
                      Bizi Takip Et
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {sanitizedInstagramUrl && (
                        <button
                          onClick={() => handleLinkClick('instagram', sanitizedInstagramUrl)}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all active:scale-95 hover:opacity-90"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#E5E5E5',
                          }}
                          aria-label="Instagram"
                        >
                          <Instagram className="w-5 h-5" />
                          <span>Instagram</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </button>
                      )}

                      {sanitizedTiktokUrl && (
                        <button
                          onClick={() => handleLinkClick('tiktok', sanitizedTiktokUrl)}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all active:scale-95 hover:opacity-90"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#E5E5E5',
                          }}
                          aria-label="TikTok"
                        >
                          <TikTokIcon className="w-5 h-5" />
                          <span>TikTok</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </button>
                      )}

                      {sanitizedWebsiteUrl && (
                        <button
                          onClick={() => handleLinkClick('website', sanitizedWebsiteUrl)}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all active:scale-95 hover:opacity-90"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#E5E5E5',
                          }}
                          aria-label="Website"
                        >
                          <Globe className="w-5 h-5" />
                          <span>Website</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

