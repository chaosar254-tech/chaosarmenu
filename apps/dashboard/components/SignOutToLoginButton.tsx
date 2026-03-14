'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SignOutToLoginButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } finally {
      router.replace('/login')
      router.refresh()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Çıkış yapılıyor…' : 'Farklı Bir Hesapla Giriş Yap'}
    </button>
  )
}

