"use client";

import React from "react";
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
  tr: { outOfStock: "Tükendi", viewOnTable: "Masanın Üstünde Gör" },
  en: { outOfStock: "Out of Stock", viewOnTable: "View on Table" },
  ar: { outOfStock: "نفد", viewOnTable: "عرض على الطاولة" },
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
      whileTap={isAvailable ? { scale: 0.97 } : {}}oup rounded-xl p-3 transition-all duration-300 relative flex flex-row gap-3 backdrop-blur-md border shadow-sm cursor-pointer ${
        !isAvailable ? 'opacity-60 grayscale' : 'hover:shadow-lg hover:scale-[1.01]'
      }`}
      style={{ backgroundColor: cardColor, borderColor: 'rgba(0,0,0,0.1)' }}
      dir={textDirection}
      onClick={() => isAvailable && onItemClick(item)}
    >
      {!isAvailable && (
        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
          {t.outOfStock}
        </div>
      )}

      {isAvailable && (
        <motion.div
          className="absolute bottom-2 right-2 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 2, delay: 0.8, repeat: 2, ease: 'easeInOut' }}
        >
          <motion.div
            className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: primaryColor }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, delay: 0.8, repeat: 2, ease: 'easeInOut' }}
          >
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: primaryColor }}
              animate={{ scale: [1, 0.7, 1] }}
              transition={{ duration: 2, delay: 0.8, repeat: 2, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      )}

      <div className="flex-shrink-0 group-hover:brightness-110 transition-all duration-300">
        <ProductImage legacyUrl={item.image_url} imagePath={item.image_path} alt={item.name} />
      </div>

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
          {item.allergens && item.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {getAllergensByKeys(item.allergens.slice(0, 3)).map((allergen) => (
                <span key={allergen.key} className="text-xs px-1.5 py-0.5 rounded-full font-montserrat"
                  style={{ backgroundColor: cardColor, color: textColor }} title={allergen.label}>
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

        <div className="flex items-center justify-between mt-2">
          <span className="text-base font-montserrat font-medium" style={{ color: primaryColor }}>
            {item.effectivePrice.toFixed(2)} ₺
          </span>
          <div className="flex items-center gap-2">
            {isAvailable && (
              <motion.button
                onClick={async (e) => {
                  e.stopPropagation();
                  const shareData = {
                    title: item.name,
                    text: item.description ? item.description : item.name,
                    url: typeof window !== 'undefined' ? window.location.href : '',
                  };
                  try {
                    if (navigator.share) {
                      await navigator.share(shareData);
                    } else {
                      await navigator.clipboard.writeText(shareData.url);
                      alert(locale === 'tr' ? 'Link panoya kopyalandı!' : 'Link copied!');
                    }
                  } catch {}
                }}
                className="flex items-centgap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all font-montserrat"
                style={{ backgroundColor: primaryColor, color: cardColor }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Share2 className="w-3 h-3" />
              </motion.button>
            )}
            {item.has_ar && !!((item.model_glb || item.ar_model_glb || item.model_usdz || item.ar_model_usdz)?.trim()) && isAvailable && (() => {
              const usdzSrc = item.model_usdz || item.ar_model_usdz;
              const usdzUrl = usdzSrc?.startsWith('http') ? usdzSrc
                : usdzSrc && typeof window !== 'undefined'
                  ? `${window.location.origin}${usdzSrc.startsWith('/') ? '' : '/'}${usdzSrc}`
                  : null;
              const isIOSDevice = typeof window !== 'undefined' && (
                /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
              );
              if (isIOSDevice && usdzUrl) {
                return (
                  <motion.button type="button"
                    onClick={(e) => { e.stopPropagation(); openARWithBlob(usdzUrl, item.image_url || undefined); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all font-montserrat"
                    style={{ backgroundColor: cardColor, color: textColor }}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  >
                    <Box className="w-3 h-3" />
                  </motion.button>
                );
              }
              return (
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onARClick(item); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all font-montserrat"
                  style={{ backgroundColor: cardColor, color: textColor }}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
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
