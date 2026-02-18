'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Instagram, Music, Twitter } from 'lucide-react'

interface ReviewAndSocialSheetProps {
  isOpen: boolean
  onClose: () => void
  restaurantName: string
  googleReviewUrl: string | null
  googleRating: number | null
  googleReviewCount: number | null
  instagramUrl: string | null
  tiktokUrl: string | null
  twitterUrl: string | null
  themePrimary: string
  themeBg: string
}

// Helper to sanitize URLs
const sanitizeUrl = (url: string | null | undefined): string | null => {
  if (!url || url.trim() === '') return null
  
  const trimmed = url.trim()
  
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  
  return `https://${trimmed}`
}

export default function ReviewAndSocialSheet({
  isOpen,
  onClose,
  restaurantName,
  googleReviewUrl,
  googleRating,
  googleReviewCount,
  instagramUrl,
  tiktokUrl,
  twitterUrl,
  themePrimary,
  themeBg,
}: ReviewAndSocialSheetProps) {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle swipe down to close - simplified version
  // Using framer-motion's drag feature would be better, but keeping it simple for now

  const sanitizedGoogleUrl = sanitizeUrl(googleReviewUrl)
  const sanitizedInstagramUrl = sanitizeUrl(instagramUrl)
  const sanitizedTiktokUrl = sanitizeUrl(tiktokUrl)
  const sanitizedTwitterUrl = sanitizeUrl(twitterUrl)

  // Use real data from database (fetched from Google Places API)
  // If not available or invalid (0 or negative), don't show rating/review section
  const displayRating = googleRating !== null && googleRating !== undefined && Number(googleRating) > 0 
    ? Number(googleRating) 
    : null
  const displayReviewCount = googleReviewCount !== null && googleReviewCount !== undefined && Number(googleReviewCount) > 0
    ? Number(googleReviewCount)
    : null
  
  // Only show rating section if we have valid data (> 0)
  const hasRatingData = displayRating !== null && displayReviewCount !== null && displayRating > 0 && displayReviewCount > 0

  const handleLinkClick = (url: string | null, type: string) => {
    if (!url) return
    
    console.log(`[ReviewAndSocialSheet] click_${type}`, { url })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            style={{
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Bottom Sheet */}
          <motion.div
            id="review-social-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              // Close if dragged down more than 100px
              if (info.offset.y > 100) {
                onClose()
              }
            }}
            className="fixed bottom-0 left-0 right-0 z-[71] bg-[#0F0F0F] rounded-t-3xl shadow-2xl"
            style={{
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              maxHeight: '85vh',
              overflow: 'hidden',
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div
                className="w-12 h-1 rounded-full"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
              />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-white" />
            </button>

            {/* Content */}
            <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
              {/* Restaurant Name */}
              <h2 className="text-2xl font-bold mb-4 pr-10" style={{ color: themePrimary }}>
                {restaurantName}
              </h2>

              {/* Google Rating & Review Count - Only show if we have valid data */}
              {hasRatingData && displayRating !== null && displayReviewCount !== null ? (
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => {
                      const starValue = i + 1
                      const isFilled = starValue <= Math.floor(displayRating)
                      const isHalf = starValue === Math.ceil(displayRating) && displayRating % 1 >= 0.5
                      
                      return (
                        <Star
                          key={i}
                          size={20}
                          fill={isFilled || isHalf ? '#FFC107' : 'transparent'}
                          stroke={isFilled || isHalf ? '#FFC107' : '#666'}
                          className="transition-colors"
                        />
                      )
                    })}
                  </div>
                  <div>
                    <span className="text-white font-semibold">{displayRating.toFixed(1)}</span>
                    <span className="text-gray-400 text-sm ml-2">
                      {displayReviewCount.toLocaleString()} Google Yorumları
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-gray-400 text-sm">
                    Google puanı eklenmemiş. Restoran sahibi Google Place ID ekleyerek puanı güncelleyebilir.
                  </p>
                </div>
              )}

              {/* Google Review CTA Button */}
              {sanitizedGoogleUrl && (
                <button
                  onClick={() => handleLinkClick(sanitizedGoogleUrl, 'google_review')}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-base mb-6 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: '#4285F4',
                    color: '#FFFFFF',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google'da Yorum Yap
                </button>
              )}

              {/* Social Media Section */}
              <div className="pt-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <p className="text-gray-400 text-sm mb-4">Bizi Takip Edin</p>
                <div className="flex items-center gap-4">
                  {/* Instagram */}
                  {sanitizedInstagramUrl && (
                    <button
                      onClick={() => handleLinkClick(sanitizedInstagramUrl, 'instagram')}
                      className="flex items-center justify-center w-14 h-14 rounded-xl transition-all active:scale-95"
                      style={{
                        backgroundColor: 'rgba(228, 64, 95, 0.2)',
                        border: '1px solid rgba(228, 64, 95, 0.3)',
                      }}
                      aria-label="Instagram"
                    >
                      <Instagram size={24} style={{ color: '#E4405F' }} />
                    </button>
                  )}

                  {/* TikTok */}
                  {sanitizedTiktokUrl && (
                    <button
                      onClick={() => handleLinkClick(sanitizedTiktokUrl, 'tiktok')}
                      className="flex items-center justify-center w-14 h-14 rounded-xl transition-all active:scale-95"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                      aria-label="TikTok"
                    >
                      <Music size={24} style={{ color: '#FFFFFF' }} />
                    </button>
                  )}

                  {/* X (Twitter) */}
                  {sanitizedTwitterUrl && (
                    <button
                      onClick={() => handleLinkClick(sanitizedTwitterUrl, 'twitter')}
                      className="flex items-center justify-center w-14 h-14 rounded-xl transition-all active:scale-95"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                      aria-label="X (Twitter)"
                    >
                      <Twitter size={24} style={{ color: '#FFFFFF' }} />
                    </button>
                  )}

                  {/* Empty state if no social links */}
                  {!sanitizedInstagramUrl && !sanitizedTiktokUrl && !sanitizedTwitterUrl && (
                    <p className="text-gray-500 text-sm">Sosyal medya bağlantıları henüz eklenmemiş.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

