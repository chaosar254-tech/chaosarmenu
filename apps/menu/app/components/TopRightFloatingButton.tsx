'use client'

import { Share2 } from 'lucide-react'

interface TopRightFloatingButtonProps {
  onClick: () => void
}

export default function TopRightFloatingButton({
  onClick,
}: TopRightFloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="fixed z-[9999] top-[calc(env(safe-area-inset-top,0px)+12px)] right-[calc(env(safe-area-inset-right,0px)+12px)] flex items-center justify-center transition-all active:scale-95 rounded-full backdrop-blur bg-black/40 border border-white/10 shadow-lg"
      style={{
        width: '44px',
        height: '44px',
        cursor: 'pointer',
        color: '#ffffff',
        transition: 'background-color 0.2s ease, transform 0.1s ease',
        outline: '2px solid red', // DEBUG: Remove this after verifying fixed positioning
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
}

