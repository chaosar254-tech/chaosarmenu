"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Instagram, MapPin, Globe } from "lucide-react";

interface Category {
  id: string;
  name: string;
  name_en?: string | null;
  name_ar?: string | null;
  name_de?: string | null;
  name_fr?: string | null;
  sort_order: number;
}

interface BranchSocial {
  instagram_url?: string | null;
  google_review_url?: string | null;
  tiktok_url?: string | null;
  x_url?: string | null;
  website_url?: string | null;
}

interface SidebarProps {
  categories: Category[];
  activeCategoryId: string | null;
  onCategoryClick: (categoryId: string) => void;
  locale: 'tr' | 'en' | 'ar' | 'de' | 'fr';
  primaryColor?: string;
  cardColor?: string;
  textColor?: string;
  branchSocial?: BranchSocial | null;
}

const translations = {
  tr: { allCategories: "Tüm Kategoriler", contactAndSocial: "İletişim & Sosyal Medya" },
  en: { allCategories: "All Categories", contactAndSocial: "Contact & Social" },
  ar: { allCategories: "جميع الفئات", contactAndSocial: "اتصل ووسائل التواصل" },
  de: { allCategories: "Alle Kategorien", contactAndSocial: "Kontakt & Soziale Medien" },
  fr: { allCategories: "Toutes les catégories", contactAndSocial: "Contact & Réseaux sociaux" },
};

// Helper function to get category name based on locale
const getCategoryName = (category: Category, locale: 'tr' | 'en' | 'ar' | 'de' | 'fr'): string => {
  if (locale === 'en' && category.name_en) return category.name_en;
  if (locale === 'ar' && category.name_ar) return category.name_ar;
  if (locale === 'de' && category.name_de) return category.name_de;
  if (locale === 'fr' && category.name_fr) return category.name_fr;
  return category.name;
};

export function Sidebar({ 
  categories, 
  activeCategoryId, 
  onCategoryClick, 
  locale,
  primaryColor = '#c09636',
  cardColor = '#ffffff',
  textColor = '#ffffff',
  branchSocial,
}: SidebarProps) {
  const t = translations[locale] || translations.tr;
  const textDirection = locale === 'ar' ? 'rtl' : 'ltr';
  const textAlign = locale === 'ar' ? 'text-right' : 'text-left';

  const handleCategoryClick = (categoryId: string) => {
    onCategoryClick(categoryId);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const hasSocialLinks = branchSocial && (
    branchSocial.instagram_url || 
    branchSocial.google_review_url || 
    branchSocial.website_url
  );

  return (
    <aside 
      className={`hidden lg:block fixed ${locale === 'ar' ? 'right-0' : 'left-0'} top-60 h-[calc(100vh-15rem)] w-64 overflow-y-auto z-30 backdrop-blur-md`}
      style={{ backgroundColor: cardColor }}
      dir={textDirection}
    >
      <div className="p-2.5">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => handleCategoryClick('all')}
          className={`w-full ${textAlign} rounded-xl mb-1.5 transition-all font-montserrat px-1 py-1 text-[0.55rem] font-medium`}
          style={{
            backgroundColor: activeCategoryId === null ? primaryColor : cardColor,
            color: textColor,
          }}
        >
          {t.allCategories}
        </motion.button>

        {categories.map((category, index) => (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleCategoryClick(category.id)}
            className={`w-full ${textAlign} rounded-xl mb-1.5 transition-all font-montserrat px-1 py-1 text-[0.55rem] font-medium`}
            style={{
              backgroundColor: activeCategoryId === category.id ? primaryColor : cardColor,
              color: textColor,
            }}
          >
            {getCategoryName(category, locale)}
          </motion.button>
        ))}

        {/* Contact & Social Section */}
        {hasSocialLinks && (
          <div className="mt-6 pt-4 border-t" style={{ borderColor: `${textColor}20` }}>
            <h3 className="text-xs font-semibold mb-3 font-montserrat" style={{ color: textColor, opacity: 0.9 }}>
              {t.contactAndSocial}
            </h3>
            <div className="flex flex-col gap-2">
              {/* Instagram */}
              {branchSocial?.instagram_url && (
                <a
                  href={branchSocial.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ 
                    backgroundColor: `${textColor}10`,
                    color: textColor,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${textColor}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${textColor}10`;
                  }}
                >
                  <Instagram className="w-4 h-4" />
                  <span className="text-[0.6rem] font-montserrat">Instagram</span>
                </a>
              )}

              {/* Google Maps/Reviews */}
              {branchSocial?.google_review_url && (
                <a
                  href={branchSocial.google_review_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ 
                    backgroundColor: `${textColor}10`,
                    color: textColor,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${textColor}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${textColor}10`;
                  }}
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-[0.6rem] font-montserrat">
                    {locale === 'tr' ? 'Google Yorumları' : locale === 'ar' ? 'تقييمات Google' : locale === 'de' ? 'Google-Bewertungen' : locale === 'fr' ? 'Avis Google' : 'Google Reviews'}
                  </span>
                </a>
              )}

              {/* Website */}
              {branchSocial?.website_url && (
                <a
                  href={branchSocial.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ 
                    backgroundColor: `${textColor}10`,
                    color: textColor,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${textColor}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${textColor}10`;
                  }}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-[0.6rem] font-montserrat">
                    {locale === 'tr' ? 'Web Sitesi' : locale === 'ar' ? 'الموقع الإلكتروني' : 'Website'}
                  </span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
