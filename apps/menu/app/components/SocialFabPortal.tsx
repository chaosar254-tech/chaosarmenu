'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Share2 } from 'lucide-react'

interface SocialFabPortalProps {
  onClick: () => void
}

export default function SocialFabPortal({
  onClick,
}: SocialFabPortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const button = (
    <button
      onClick={onClick}
      type="button"
      data-testid="social-fab"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        right: 'calc(env(safe-area-inset-right, 0px) + 12px)',
        zIndex: 2147483647, // max z-index
        width: '44px',
        height: '44px',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        cursor: 'pointer',
        color: '#ffffff',
        transition: 'background-color 0.2s ease, transform 0.1s ease',
        outline: 'none',
        padding: 0,
        margin: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'
      }}
      onTouchStart={(e) => {
        e.currentTarget.style.transform = 'scale(0.95)'
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
      aria-label="İletişim & Yorum"
      title="İletişim & Yorum"
    >
      <Share2 size={22} strokeWidth={2.5} />
    </button>
  )

  // Only render portal after mount (SSR-safe)
  if (!mounted) {
    return null
  }

  // Render directly into document.body using portal (bypasses all parent CSS contexts)
  return createPortal(button, document.body)
}

