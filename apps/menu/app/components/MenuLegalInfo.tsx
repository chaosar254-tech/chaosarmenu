"use client";

interface MenuLegalInfoProps {
  includeVAT: boolean;
  hasServiceFee: boolean;
  hasCoverCharge: boolean;
  themePrimary?: string;
  themeText?: string;
}

export function MenuLegalInfo({
  includeVAT,
  hasServiceFee,
  hasCoverCharge,
  themePrimary = '#D4AF37',
  themeText = '#F5F5F5',
}: MenuLegalInfoProps) {
  // Secondary text color (lighter/muted) - use provided themeText
  const secondaryColor = themeText;

  return (
    <footer className="px-4 py-6 mt-8 border-t" style={{ borderColor: `${themePrimary}15` }}>
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Fiyatlandırma */}
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: secondaryColor, opacity: 0.9 }}>
            Fiyatlandırma:
          </p>
          <p className="text-xs leading-relaxed" style={{ color: secondaryColor, opacity: 0.7 }}>
            Tüm fiyatlar Türk Lirası (₺) cinsindendir.
            {includeVAT ? ' Fiyatlara KDV dahildir.' : ' Fiyatlara KDV dahil değildir.'}
          </p>
        </div>

        {/* Servis / Kuver */}
        {(hasServiceFee || hasCoverCharge) && (
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: secondaryColor, opacity: 0.9 }}>
              Servis / Kuver:
            </p>
            <p className="text-xs leading-relaxed" style={{ color: secondaryColor, opacity: 0.7 }}>
              {hasServiceFee && 'Servis ücreti alınmaktadır.'}
              {hasServiceFee && hasCoverCharge && ' '}
              {hasCoverCharge && 'Kuver ücreti bulunmaktadır.'}
            </p>
          </div>
        )}

        {/* Alerjen Uyarısı */}
        <div>
          <p className="text-xs leading-relaxed" style={{ color: secondaryColor, opacity: 0.7 }}>
            Alerjen uyarısı: Ürünlerimiz alerjen içerebilir. Alerjiniz varsa lütfen sipariş öncesinde bildiriniz.
          </p>
        </div>

        {/* ChaosAR Reklam Bölümü - Premium Kombinasyon (1+3+5) */}
        <div className="mt-6 pt-6 border-t" style={{ borderColor: `${themePrimary}15` }}>
          <a
            href="https://cha0sar.com/tr-tr"
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center gap-4 p-5 rounded-xl overflow-hidden group transition-all duration-300 hover:scale-[1.02]"
            style={{
              // Glassmorphism + Gradient Background
              background: `linear-gradient(135deg, ${themePrimary}12 0%, ${themePrimary}05 50%, transparent 100%)`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: `1px solid ${themePrimary}25`,
            }}
          >
            {/* Glow Effect on Hover (1) */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `radial-gradient(circle at center, ${themePrimary}25 0%, ${themePrimary}10 40%, transparent 70%)`,
                filter: 'blur(24px)',
              }}
            />
            
            {/* Outer Glow Ring */}
            <div 
              className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle, ${themePrimary}30 0%, transparent 70%)`,
                filter: 'blur(8px)',
              }}
            />
            
            {/* Logo with Pulse Animation */}
            <div className="relative flex-shrink-0 z-10">
              {/* Logo Glow */}
              <div 
                className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-60 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle, ${themePrimary}40 0%, transparent 70%)`,
                  filter: 'blur(10px)',
                }}
              />
              <img
                src="/images/chaosar-logo.png"
                alt="ChaosAR"
                className="relative h-10 w-auto object-contain opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            
            {/* Text Content with Premium Badge (3) */}
            <div className="flex-1 min-w-0 z-10">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-sm font-bold" style={{ color: themePrimary }}>
                  ChaosAR
                </p>
                {/* Premium Badge (3) */}
                <span 
                  className="text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1"
                  style={{
                    background: `linear-gradient(135deg, ${themePrimary}30 0%, ${themePrimary}20 100%)`,
                    color: themePrimary,
                    border: `1px solid ${themePrimary}50`,
                    boxShadow: `0 2px 8px ${themePrimary}20`,
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none" style={{ color: themePrimary }}>
                    <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" fill="currentColor" opacity="0.8"/>
                  </svg>
                  Powered
                </span>
              </div>
              <p className="text-[11px] leading-tight" style={{ color: secondaryColor, opacity: 0.85 }}>
                Dijital menünüzü oluşturun • AR destekli deneyim
              </p>
            </div>

            {/* Enhanced CTA Arrow with Glow */}
            <div className="flex-shrink-0 z-10">
              <div 
                className="p-2.5 rounded-lg transition-all duration-300 group-hover:scale-110 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${themePrimary}25 0%, ${themePrimary}15 100%)`,
                  border: `1px solid ${themePrimary}40`,
                  boxShadow: `0 2px 8px ${themePrimary}15`,
                }}
              >
                {/* Button Glow */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `radial-gradient(circle, ${themePrimary}40 0%, transparent 70%)`,
                    filter: 'blur(6px)',
                  }}
                />
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="relative opacity-75 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
                  style={{ color: themePrimary }}
                >
                  <path
                    d="M6 12L10 8L6 4"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </a>
        </div>
      </div>
    </footer>
  );
}

