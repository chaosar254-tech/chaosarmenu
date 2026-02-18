'use client'

import { Share2 } from 'lucide-react'

interface MenuHeaderProps {
  onSocialIconClick: () => void
  themePrimary: string
}

export default function MenuHeader({
  onSocialIconClick,
  themePrimary,
}: MenuHeaderProps) {
  return (
    <div 
      className="fixed"
      style={{ 
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        right: 'calc(env(safe-area-inset-right, 0px) + 12px)',
        zIndex: 60,
        opacity: 1,
        visibility: 'visible',
        pointerEvents: 'auto',
      }}
    >
      {/* Social/Links Icon Button */}
      <button
        onClick={onSocialIconClick}
        type="button"
        className="flex items-center justify-center transition-all active:scale-95"
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          cursor: 'pointer',
          color: '#ffffff',
          transition: 'background-color 0.2s ease, transform 0.1s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.75)'
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
    </div>
  )
}

