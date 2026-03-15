"use client";

import { motion } from "framer-motion";
import { Box, Share2 } from "lucide-react";
import { ProductImage } from "./ProductImage";
import { getAllergensByKeys } from "@/lib/allergens";
import { openARWithBlob } from "@/lib/ar-utils";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  effectivePrice: number;
  description: string | null;
  image_path: string | null;
  image_url: string | null;
  has_ar: boolean;
  model_glb?: string | null;
  model_usdz?: string | null;
  ar_model_glb?: string | null;
  ar_model_usdz?: string | null;
  allergens?: string[] | null;
  is_available?: boolean;
  category_id?: string;
  is_active?: boolean;
  sort_order?: number;
}

interface MenuItemCardProps {
  item: MenuItem;
  onItemClick: (item: MenuItem) => void;
  onARClick: (item: MenuItem) => void;
  locale: 'tr' | 'en' | 'ar';
  primaryColor?: string;
  cardColor?: string;
  textColor?: string;
}

const translations = {
  tr: {
    outOfStock: "Tükendi",
    viewOnTable: "Masanın Üstünde Gör",
  },
  en: {
    outOfStock: "Out of Stock",
    viewOnTable: "View on Table",
  },
  ar: {
    outOfStock: "نفد",
    viewOnTable: "عرض على الطاولة",
  },
};

export function MenuItemCard({ 
  item, 
  onItemClick, 
  onARClick, 
  locale,
  primaryColor = '#c09636',
  cardColor = '#ffffff',
  textColor = '#ffffff',
}: MenuItemCardProps) {
  const t = translations[locale] || translations.tr;
  const textDirection = locale === 'ar' ? 'rtl' : 'ltr';
  const textAlign = locale === 'ar' ? 'text-right' : 'text-left';
  const isAvailable = item.is_available !== false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      className={`group rounded-xl p-3 transition-all duration-300 relative flex flex-row gap-3 backdrop-blur-md border shadow-sm ${
        !isAvailable 
          ? 'opacity-60 grayscale' 
          : 'hover:shadow-lg hover:scale-[1.01] active:scale-[0.97]'
      }`}
      style={{
        backgroundColor: cardColor,
        borderColor: 'rgba(0, 0, 0, 0.1)',
      }}
      dir={textDirection}
      onClick={() => isAvailable && onItemClick(item)}
    >
      {/* Out of Stock Badge */}
      {!isAvailable && (
        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10 font-montserrat">
          {t.outOfStock}
        </div>
      )}

      {/* Left Side: Product Image */}
      <div className="flex-shrink-0 group-hover:brightness-110 transition-all duration-300">
        <ProductImage
          legacyUrl={item.image_url}
          imagePath={item.image_path}
          alt={item.name}
        />
      </div>

      {/* Right Side: Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className={`text-base font-bold mb-1 font-montserrat ${textAlign}`} style={{ color: textColor }}>
            {item.name}
          </h3>
          {item.description && (
            <p className={`text-xs mb-1.5 line-clamp-2 leading-relaxed font-montserrat ${textAlign}`} style={{ color: textColor, opacity: 0.8 }}>
              {item.description}
            </p>
          )}
          
          {/* Allergens */}
          {item.allergens && item.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {getAllergensByKeys(item.allergens.slice(0, 3)).map((allergen) => (
                <span
                  key={allergen.key}
                  className="text-xs px-1.5 py-0.5 rounded-full font-montserrat"
                  style={{ backgroundColor: cardColor, color: textColor }}
                  title={allergen.label}
                >
                  {allergen.icon}
                </span>
              ))}
              {item.allergens.length > 3 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-montserrat" style={{ backgroundColor: textColor, color: primaryColor }}>
                  +{item.allergens.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom: Price, AR Button, and Quantity Controls */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-base font-montserrat font-medium" style={{ color: primaryColor }}>
            {item.effectivePrice.toFixed(2)} ₺
          </span>
          
          <div className="flex items-center gap-2">
            {/* Share Button */}
            {isAvailable && (
              <motion.button
                onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  const shareData = {
                    title: item.name,
                    text: `${item.name} - ${item.description ? `${item.description}` : ''}`,
                    url: typeof window !== 'undefined' ? window.location.href : '',
                  };

                  try {
                    if (navigator.share) {
                      await navigator.share(shareData);
                    } else {
                      const textToCopy = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
                      await navigator.clipboard.writeText(textToCopy);
                      alert(locale === 'tr' ? 'Link panoya kopyalandı!' : 'Link copied to clipboard!');
                    }
                  } catch (error) {
                    console.log('Share cancelled or failed:', error);
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all font-montserrat"
                style={{ backgroundColor: primaryColor, color: cardColor }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={locale === 'tr' ? 'Paylaş' : 'Share'}
              >
                <Share2 className="w-3 h-3" />
              </motion.button>
            )}

            {/* AR Button: iOS+USDZ = blob open (beyaz sayfa yok); diğer = modal */}
            {item.has_ar && (item.model_glb || item.ar_model_glb || item.model_usdz || item.ar_model_usdz) && isAvailable && (() => {
              const getUSDZUrl = (): string | null => {
                const usdzSrc = item.model_usdz || item.ar_model_usdz;
                if (!usdzSrc) return null;
                if (usdzSrc.startsWith('http')) return usdzSrc;
                return typeof window !== 'undefined' ? `${window.location.origin}${usdzSrc.startsWith('/') ? '' : '/'}${usdzSrc}` : null;
              };
              const usdzUrl = getUSDZUrl();
              const isIOSDevice = typeof window !== 'undefined' && (
                /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
              );
              if (isIOSDevice && usdzUrl) {
                return (
                  <motion.button
                    type="button"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      openARWithBlob(usdzUrl, item.image_url || undefined);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all font-montserrat"
                    style={{ backgroundColor: cardColor, color: textColor }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Box className="w-3 h-3" />
                  </motion.button>
                );
              }
              return (
                <motion.button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onARClick(item); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all font-montserrat"
                  style={{ backgroundColor: cardColor, color: textColor }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Box className="w-3 h-3" />
                </motion.button>
              );
            })()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
