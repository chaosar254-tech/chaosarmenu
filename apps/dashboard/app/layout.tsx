import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Restoran Paneli',
  description: 'Restoran yönetim paneli',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}

