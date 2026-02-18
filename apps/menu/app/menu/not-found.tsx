export default function MenuNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F] text-white">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2 text-[#D4AF37]">Menü Bulunamadı</h2>
        <p className="text-gray-400 mb-6">
          Aradığınız restoran veya şube menüsü bulunamadı.
        </p>
        <p className="text-sm text-gray-500">
          Lütfen URL'yi kontrol edip tekrar deneyin.
        </p>
      </div>
    </div>
  )
}

