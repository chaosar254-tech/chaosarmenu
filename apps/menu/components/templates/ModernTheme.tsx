"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Globe, Instagram, Link2, Info, MapPin, Phone, Star, Box, Monitor, Check } from "lucide-react";
import { Sidebar } from "./modern/Sidebar";
import { MenuItemCard, type MenuItem } from "./modern/MenuItemCard";
import { SkeletonCard } from "./modern/SkeletonCard";
import { ARViewer } from "@/app/components/ARViewer";
import { getProductImageUrl, getImageSrc } from "@/lib/image-utils";
import { getAllergensByKeys, getAllergenLabel } from "@/lib/allergens";
import { openARWithBlob } from "@/lib/ar-utils";
import { StickyHierarchicalMenu } from "../StickyHierarchicalMenu";

interface Category {
  id: string;
  name: string;
  name_en?: string | null;
  name_ar?: string | null;
  name_de?: string | null;
  name_fr?: string | null;
  sort_order: number;
  is_active: boolean;
  image_url?: string | null;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
  sort_order: number;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  name_en?: string | null;
  name_ar?: string | null;
  name_de?: string | null;
  name_fr?: string | null;
  price: number;
  effectivePrice: number;
  description: string | null;
  description_en?: string | null;
  description_ar?: string | null;
  description_de?: string | null;
  description_fr?: string | null;
  image_path: string | null;
  image_url: string | null;
  has_ar: boolean;
  category_id: string;
  subcategory_id?: string | null;
  is_active: boolean;
  sort_order: number;
  model_glb?: string | null;
  model_usdz?: string | null;
  ar_model_glb?: string | null;
  ar_model_usdz?: string | null;
  allergens?: string[] | null;
  is_available?: boolean;
  recommended_item_ids?: string[] | null;
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  logo_path: string | null;
  cover_image?: string | null;
  primary_color?: string | null;
  background_color?: string | null;
  card_color?: string | null;
  text_color?: string | null;
  include_vat?: boolean | null;
  has_service_fee?: boolean | null;
  service_fee_amount?: number | null;
  allergen_disclaimer?: string | null;
  google_business_url?: string | null;
  google_review_url?: string | null;
  address?: string | null;
  phone_number?: string | null;
  allergen_info?: string | null;
  instagram_url?: string | null;
  x_url?: string | null;
  twitter_url?: string | null;
  website_url?: string | null;
  tiktok_url?: string | null;
  google_rating?: number | null;
  google_user_ratings_total?: number | null;
}

interface Branch {
  id: string;
  name: string;
  slug: string;
  address?: string | null;
  phone?: string | null;
}

interface BranchSocial {
  instagram_url?: string | null;
  google_review_url?: string | null;
  tiktok_url?: string | null;
  x_url?: string | null;
  twitter_url?: string | null;
  facebook_url?: string | null;
  website_url?: string | null;
}

const LANGUAGE_OPTIONS: { code: 'tr' | 'en' | 'ar' | 'de' | 'fr'; label: string; labelAr?: string }[] = [
  { code: 'tr', label: 'Türkçe', labelAr: 'التركية' },
  { code: 'en', label: 'English', labelAr: 'الإنجليزية' },
  { code: 'ar', label: 'العربية', labelAr: 'العربية' },
  { code: 'de', label: 'Deutsch', labelAr: 'الألمانية' },
  { code: 'fr', label: 'Français', labelAr: 'الفرنسية' },
];

interface ModernThemeProps {
  restaurant: Restaurant;
  branch: Branch;
  branchSocial?: BranchSocial | null;
  categories: Category[];
  products: Product[];
  tableNumber?: string | null;
  loading?: boolean;
  initialLocale?: 'tr' | 'en' | 'ar' | 'de' | 'fr';
  supportedLanguages?: ('tr' | 'en' | 'ar' | 'de' | 'fr')[];
  subcategories?: Subcategory[];
}

// ✅ model-viewer hatalarını yakalar, sayfayı çökertmez
class ModelViewerErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e: any) { console.warn('[ModelViewer] caught error:', e); }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export function ModernTheme({
  restaurant,
  branch,
  branchSocial,
  categories,
  products,
  tableNumber = null,
  loading = false,
  initialLocale = 'tr' as 'tr' | 'en' | 'ar' | 'de' | 'fr',
  supportedLanguages = ['tr', 'en', 'ar'] as ('tr' | 'en' | 'ar' | 'de' | 'fr')[],
  subcategories = [],
}: ModernThemeProps) {
  const [locale, setLocale] = useState<'tr' | 'en' | 'ar' | 'de' | 'fr'>(initialLocale);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [langBtnPos, setLangBtnPos] = useState<{ top: number; right: number } | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [arOpen, setArOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [subFilters, setSubFilters] = useState<Record<string, 'all' | string>>({});
  // ✅ model-viewer script yüklendi mi?
  const [modelViewerReady, setModelViewerReady] = useState(false);

  const categoryRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const subSectionRefs = useRef<{ [catId: string]: { [subId: string]: HTMLElement | null } }>({});
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const isManualScrolling = useRef(false);

  const supportedList = LANGUAGE_OPTIONS.filter((o) => supportedLanguages.includes(o.code));
  const supportedListKey = supportedLanguages.join(',');

  // ✅ model-viewer CDN script loader
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (customElements.get('model-viewer')) { setModelViewerReady(true); return; }
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
    script.onload = () => setModelViewerReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const list = LANGUAGE_OPTIONS.filter((o) => supportedLanguages.includes(o.code));
    if (list.length === 0) return;
    setLocale((prev) => (list.some((o) => o.code === prev) ? prev : list[0].code));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportedListKey]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setLocale(initialLocale); }, [initialLocale]);

  const getCategoryName = (category: Category): string => {
    if (locale === 'en' && category.name_en) return category.name_en;
    if (locale === 'ar' && category.name_ar) return category.name_ar;
    if (locale === 'de' && category.name_de) return category.name_de;
    if (locale === 'fr' && category.name_fr) return category.name_fr;
    return category.name;
  };

  const getProductName = (product: Product): string => {
    if (locale === 'en' && product.name_en) return product.name_en;
    if (locale === 'ar' && product.name_ar) return product.name_ar;
    if (locale === 'de' && product.name_de) return product.name_de;
    if (locale === 'fr' && product.name_fr) return product.name_fr;
    return product.name;
  };

  const getProductDescription = (product: Product): string | null => {
    if (locale === 'en' && product.description_en) return product.description_en;
    if (locale === 'ar' && product.description_ar) return product.description_ar;
    if (locale === 'de' && product.description_de) return product.description_de;
    if (locale === 'fr' && product.description_fr) return product.description_fr;
    return product.description;
  };

  const getAllergenWarning = (): string => {
    const allergenText = restaurant?.allergen_info || restaurant?.allergen_disclaimer;
    if (allergenText && allergenText.trim() !== '') return allergenText;
    if (locale === 'tr') return 'Alerjen uyarısı: Ürünlerimiz alerjen içerebilir. Alerjiniz varsa lütfen sipariş öncesinde bildiriniz.';
    if (locale === 'ar') return 'تحذير الحساسية: قد تحتوي منتجاتنا على مسببات الحساسية. إذا كان لديك حساسية، يرجى إبلاغنا قبل الطلب.';
    return 'Allergen warning: Our products may contain allergens. If you have allergies, please inform us before ordering.';
  };

  const textDirection = locale === 'ar' ? 'rtl' : 'ltr';
  const textAlign = locale === 'ar' ? 'text-right' : 'text-left';

  // Scroll Spy
  useEffect(() => {
    if (categories.length === 0) return;
    const stickyBarHeight = 56;
    const triggerOffset = stickyBarHeight + 24;
    let rafId: number | null = null;

    const updateActiveFromScroll = () => {
      if (isManualScrolling.current) return;
      if (window.scrollY < 80) { setActiveCategoryId(null); return; }
      const orderedIds = [...categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((c) => c.id);
      let activeId: string | null = null;
      for (const id of orderedIds) {
        const el = categoryRefs.current[id];
        if (!el) continue;
        if (el.getBoundingClientRect().top <= triggerOffset) activeId = id;
      }
      if (activeId != null) setActiveCategoryId(activeId);
    };

    const onScroll = () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateActiveFromScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateActiveFromScroll();
    return () => { window.removeEventListener("scroll", onScroll); if (rafId != null) cancelAnimationFrame(rafId); };
  }, [categories]);

  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = locale === 'en' ? (p.name_en || p.name) : locale === 'ar' ? (p.name_ar || p.name) : locale === 'de' ? (p.name_de || p.name) : locale === 'fr' ? (p.name_fr || p.name) : p.name;
    const desc = locale === 'en' ? (p.description_en || p.description) : locale === 'ar' ? (p.description_ar || p.description) : locale === 'de' ? (p.description_de || p.description) : locale === 'fr' ? (p.description_fr || p.description) : p.description;
    return name.toLowerCase().includes(query) || (desc?.toLowerCase().includes(query) ?? false);
  });

  const productsByCategory = useMemo(() => categories.reduce((acc: Record<string, Product[]>, cat) => {
    acc[cat.id] = filteredProducts.filter((p) => p.category_id === cat.id);
    return acc;
  }, {}), [categories, filteredProducts]);

  const hierarchicalCategories = useMemo(() => categories.map((cat) => ({
    id: cat.id,
    name: getCategoryName(cat),
    subCategories: subcategories
      .filter((sub) => sub.category_id === cat.id && sub.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((sub) => ({ id: sub.id, name: sub.name })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [categories, subcategories, locale]);

  const getUSDZUrl = (item: Product): string | null => {
    const src = item.model_usdz || item.ar_model_usdz;
    if (!src) return null;
    if (src.startsWith('http')) return src;
    return `${window.location.origin}${src.startsWith('/') ? '' : '/'}${src}`;
  };

  const [arLoading, setArLoading] = useState(false);

  const handleARClick = (item: Product) => {
    try {
      const glb = (item.model_glb || item.ar_model_glb)?.trim();
      const usdz = (item.model_usdz || item.ar_model_usdz)?.trim();
      if (!item.has_ar || (!glb && !usdz)) return;
      setArLoading(true);
      setSelectedProduct(item);
      setArOpen(true);
      // AR açılınca loading'i kapat
      setTimeout(() => setArLoading(false), 3000);
    } catch (e) {
      console.error('[AR] handleARClick error:', e);
      setArLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    const el = categoryRefs.current[categoryId];
    if (el) {
      isManualScrolling.current = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => { isManualScrolling.current = false; }, 1000);
    }
  };

  const handleSubChange = (categoryId: string, subId: 'all' | string) => {
    setSubFilters((prev) => ({ ...prev, [categoryId]: subId }));
    setTimeout(() => {
      if (subId === 'all') {
        const el = categoryRefs.current[categoryId];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const el = subSectionRefs.current[categoryId]?.[subId];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const primaryColor = restaurant?.primary_color || '#c09636';
  const bgColor = restaurant?.background_color || '#2d304c';
  const cardColor = restaurant?.card_color || '#ffffff';
  const textColor = restaurant?.text_color || '#ffffff';

  const getStorageUrl = (path: string | null, bucket: string) => {
    if (!path) return null;
    let cleanPath = path.trim().replace(/['"]/g, '').replace(/^\/+/, '');
    if (cleanPath.startsWith('http')) {
      if (cleanPath.includes('cdn.chaosarmenu.com')) return cleanPath.replace('https://cdn.chaosarmenu.com', process.env.NEXT_PUBLIC_SUPABASE_URL || '');
      return cleanPath;
    }
    if (cleanPath.startsWith(bucket + '/')) cleanPath = cleanPath.replace(bucket + '/', '');
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
    if (!baseUrl) return null;
    return `${baseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: restaurant?.background_color || '#2d304c' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: bgColor, color: textColor }} dir={textDirection}>
      {/* Hero */}
      <div className="relative w-full h-48 overflow-hidden">
        <img
          src={getImageSrc(restaurant.cover_image ?? null, 'menu_logos') || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
          onError={(e) => { const t = e.target as HTMLImageElement; if (!t.src.includes('unsplash.com')) t.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80'; }}
        />
        <div className={`absolute top-4 ${locale === 'ar' ? 'left-4' : 'right-10'} z-20 flex items-center gap-2`}>
          {[
            { icon: <Info className="w-5 h-5" />, onClick: () => setIsInfoPanelOpen(true), label: 'Info' },
            { icon: <Search className="w-5 h-5" />, onClick: () => setIsSearchOpen(true), label: 'Search' },
          ].map((btn, i) => (
            <button key={i} onClick={btn.onClick} className="p-3 backdrop-blur-sm rounded-full shadow-md transition-colors" style={{ backgroundColor: `${cardColor}E6`, color: textColor }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = cardColor; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${cardColor}E6`; }}
            >
              {btn.icon}
            </button>
          ))}
          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setLangDropdownOpen((o) => !o)}
              className="p-3 backdrop-blur-sm rounded-full shadow-md transition-colors flex items-center justify-center"
              style={{ backgroundColor: `${cardColor}E6`, color: textColor }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = cardColor; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${cardColor}E6`; }}
            >
              <span className="text-base leading-none">
                {locale === 'tr' ? '🇹🇷' : locale === 'en' ? '🇬🇧' : locale === 'ar' ? '🇸🇦' : locale === 'de' ? '🇩🇪' : '🇫🇷'}
              </span>
            </button>
          </div>
        </div>
        {(() => {
          const logoUrl = getStorageUrl(restaurant?.logo_path || restaurant?.logo_url, 'menu_logos');
          return logoUrl ? (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 translate-y-1/2">
              <div className="w-24 h-24 rounded-full border-4 shadow-lg overflow-hidden" style={{ backgroundColor: cardColor, borderColor: cardColor }}>
                <img src={logoUrl} alt={restaurant.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            </div>
          ) : null;
        })()}
      </div>

      {/* Dil dropdown — hero dışında, overflow:hidden yok */}
      <div className={`absolute top-16 ${locale === 'ar' ? 'left-4' : 'right-10'} z-50`}>
        <AnimatePresence>
          {langDropdownOpen && supportedList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="w-44 py-1.5 rounded-2xl shadow-xl overflow-hidden"
              style={{
                backgroundColor: 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              {supportedList.map((opt) => {
                const flag = opt.code === 'tr' ? '🇹🇷' : opt.code === 'en' ? '🇬🇧' : opt.code === 'ar' ? '🇸🇦' : opt.code === 'de' ? '🇩🇪' : '🇫🇷';
                const isActive = locale === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => { setLocale(opt.code); setLangDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{
                      direction: opt.code === 'ar' ? 'rtl' : 'ltr',
                      backgroundColor: isActive ? `${primaryColor}15` : 'transparent',
                      color: isActive ? primaryColor : '#1f2937',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    <span className="text-lg leading-none">{flag}</span>
                    <span className="text-sm">{locale === 'ar' && opt.labelAr ? opt.labelAr : opt.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 ml-auto shrink-0" strokeWidth={2.5} />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <StickyHierarchicalMenu
        categories={hierarchicalCategories}
        activeCategoryId={activeCategoryId}
        onCategoryClick={handleCategoryClick}
        onSubChange={handleSubChange}
        primaryColor={primaryColor}
        bgColor={bgColor}
      />

      <div className="flex flex-col lg:flex-row">
        <Sidebar
          categories={categories}
          activeCategoryId={activeCategoryId}
          onCategoryClick={handleCategoryClick}
          locale={locale}
          primaryColor={primaryColor}
          cardColor={cardColor}
          textColor={textColor}
          branchSocial={branchSocial}
        />

        <main className={`flex-1 relative z-10 ${locale === 'ar' ? 'lg:mr-64' : 'lg:ml-64'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 lg:pt-16">

            {!searchQuery && (
              <div className={`mb-8 ${textAlign === 'text-right' ? 'text-right' : 'text-center'}`}>
                <h1 className="text-4xl font-bold mb-2" style={{ color: textColor }}>{restaurant.name}</h1>
                {branch && <p className="text-lg" style={{ color: textColor, opacity: 0.7 }}>{branch.name}</p>}
              </div>
            )}

            {searchQuery && (
              <div className="mb-6">
                <h2 className={`text-2xl font-bold mb-2 ${textAlign}`} style={{ color: textColor }}>
                  {locale === 'tr' ? 'Arama Sonuçları' : locale === 'ar' ? 'نتائج البحث' : 'Search Results'}
                </h2>
                <p className={textAlign} style={{ color: textColor, opacity: 0.7 }}>
                  {filteredProducts.length} {locale === 'tr' ? 'sonuç bulundu' : locale === 'ar' ? 'نتيجة' : 'results found'}
                </p>
              </div>
            )}

            {!searchQuery && categories.map((category) => {
              const categoryProducts = productsByCategory[category.id] || [];
              const activeSub = subFilters[category.id] || 'all';
              const catSubs = subcategories.filter(s => s.category_id === category.id && s.is_active)
                .sort((a, b) => a.sort_order - b.sort_order);

              if (categoryProducts.length === 0) return null;

              if (!subSectionRefs.current[category.id]) {
                subSectionRefs.current[category.id] = {};
              }

              return (
                <motion.section
                  key={category.id}
                  id={`category-${category.id}`}
                  ref={(el: HTMLElement | null) => { categoryRefs.current[category.id] = el; }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-14"
                  style={{ scrollMarginTop: "6rem" }}
                >
                  <div className={`py-4 mb-6 ${textAlign}`} style={{
                    borderLeft: locale === "ar" ? "none" : `4px solid ${primaryColor}`,
                    borderRight: locale === "ar" ? `4px solid ${primaryColor}` : "none",
                    paddingLeft: locale === "ar" ? "0" : "1rem",
                    paddingRight: locale === "ar" ? "1rem" : "0",
                  }}>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: textColor }}>
                      {getCategoryName(category)}
                    </h2>
                  </div>

                  {catSubs.length > 0 ? (
                    catSubs.map((sub) => {
                      const subProducts = categoryProducts.filter(p => p.subcategory_id === sub.id);
                      if (activeSub !== 'all' && activeSub !== sub.id) return null;
                      if (subProducts.length === 0) return null;
                      return (
                        <div
                          key={sub.id}
                          ref={(el: HTMLDivElement | null) => { subSectionRefs.current[category.id][sub.id] = el; }}
                          className="mb-8"
                          style={{ scrollMarginTop: "7rem" }}
                        >
                          <h3 className={`text-lg font-semibold mb-4 ${textAlign}`} style={{ color: primaryColor, opacity: 0.85 }}>
                            {sub.name}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {subProducts.map((product) => {
                              const menuItem: MenuItem = {
                                id: product.id, name: getProductName(product), price: product.price,
                                effectivePrice: product.effectivePrice, description: getProductDescription(product),
                                image_path: product.image_path, image_url: product.image_url, has_ar: product.has_ar,
                                model_glb: product.model_glb, model_usdz: product.model_usdz,
                                ar_model_glb: product.ar_model_glb, ar_model_usdz: product.ar_model_usdz,
                                allergens: product.allergens, is_available: product.is_available,
                                category_id: product.category_id, is_active: product.is_active, sort_order: product.sort_order,
                              };
                              return (
                                <MenuItemCard key={product.id} item={menuItem}
                                  onItemClick={(item) => { const full = products.find(p => p.id === item.id); if (full) setSelectedProductForModal(full); }}
                                  onARClick={() => { handleARClick(product); }}
                                  locale={locale} primaryColor={primaryColor} cardColor={cardColor} textColor={textColor}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryProducts.map((product) => {
                        const menuItem: MenuItem = {
                          id: product.id, name: getProductName(product), price: product.price,
                          effectivePrice: product.effectivePrice, description: getProductDescription(product),
                          image_path: product.image_path, image_url: product.image_url, has_ar: product.has_ar,
                          model_glb: product.model_glb, model_usdz: product.model_usdz,
                          ar_model_glb: product.ar_model_glb, ar_model_usdz: product.ar_model_usdz,
                          allergens: product.allergens, is_available: product.is_available,
                          category_id: product.category_id, is_active: product.is_active, sort_order: product.sort_order,
                        };
                        return (
                          <MenuItemCard key={product.id} item={menuItem}
                            onItemClick={(item) => { const full = products.find(p => p.id === item.id); if (full) setSelectedProductForModal(full); }}
                            onARClick={() => { handleARClick(product); }}
                            locale={locale} primaryColor={primaryColor} cardColor={cardColor} textColor={textColor}
                          />
                        );
                      })}
                    </div>
                  )}
                </motion.section>
              );
            })}

            {searchQuery && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const menuItem: MenuItem = {
                    id: product.id, name: getProductName(product), price: product.price,
                    effectivePrice: product.effectivePrice, description: getProductDescription(product),
                    image_path: product.image_path, image_url: product.image_url, has_ar: product.has_ar,
                    model_glb: product.model_glb, model_usdz: product.model_usdz,
                    ar_model_glb: product.ar_model_glb, ar_model_usdz: product.ar_model_usdz,
                    allergens: product.allergens, is_available: product.is_available,
                    category_id: product.category_id, is_active: product.is_active, sort_order: product.sort_order,
                  };
                  return (
                    <MenuItemCard key={product.id} item={menuItem}
                      onItemClick={(item) => { const full = products.find(p => p.id === item.id); if (full) setSelectedProductForModal(full); }}
                      onARClick={() => { handleARClick(product); }}
                      locale={locale} primaryColor={primaryColor} cardColor={cardColor} textColor={textColor}
                    />
                  );
                })}
              </div>
            )}

            {searchQuery && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg" style={{ color: textColor, opacity: 0.7 }}>
                  {locale === 'tr' ? 'Sonuç bulunamadı' : locale === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found'}
                </p>
              </div>
            )}

            <div className="mt-16 pt-8 pb-12 space-y-4">
              {restaurant?.include_vat && <p className="text-sm" style={{ color: textColor, opacity: 0.8 }}>{locale === 'tr' ? 'Tüm fiyatlarımıza KDV dahildir.' : locale === 'ar' ? 'جميع الأسعار تشمل ضريبة القيمة المضافة.' : 'All prices include VAT.'}</p>}
              {restaurant?.has_service_fee && restaurant?.service_fee_amount && (
                <p className="text-sm" style={{ color: textColor, opacity: 0.8 }}>{locale === 'tr' ? `Servis Ücreti: %${Number(restaurant.service_fee_amount).toFixed(0)}` : locale === 'ar' ? `رسوم الخدمة: %${Number(restaurant.service_fee_amount).toFixed(0)}` : `Service Charge: %${Number(restaurant.service_fee_amount).toFixed(0)}`}</p>
              )}
              <div className="mt-6 p-4 rounded-lg border" style={{ backgroundColor: `${cardColor}E6`, borderColor: `${primaryColor}30` }}>
                <p className="text-xs leading-relaxed" style={{ color: textColor, opacity: 0.85, textAlign: textAlign === 'text-right' ? 'right' : 'left' }} dir={textDirection}>{getAllergenWarning()}</p>
              </div>
              <div className="mt-10 w-full p-6 rounded-lg shadow-sm flex items-center justify-center gap-3" style={{ backgroundColor: '#eae3d4' }}>
                <Monitor className="w-5 h-5 shrink-0" style={{ color: primaryColor }} />
                <p className="text-center text-xs md:text-sm flex items-center gap-1.5 flex-wrap justify-center" style={{ color: textColor }}>
                  <span style={{ opacity: 0.75 }}>{locale === 'tr' ? 'Digital Menu System by ' : locale === 'ar' ? 'نظام القائمة الرقمية بواسطة ' : 'Digital Menu System by '}</span>
                  <a href="https://chaosarmenu.com" target="_blank" rel="noopener noreferrer" className="font-semibold" style={{ color: primaryColor }} onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }} onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}>ChaosAR</a>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSearchOpen(false)} className="fixed inset-0 bg-black/50 z-40" />
            <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="fixed top-0 left-0 right-0 z-50 p-4 shadow-lg" style={{ backgroundColor: cardColor }}>
              <div className="max-w-2xl mx-auto flex items-center gap-3">
                <Search className="w-5 h-5" style={{ color: textColor, opacity: 0.5 }} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'tr' ? 'Ürün ara...' : locale === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...'}
                  dir={textDirection} className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none ${textAlign}`} autoFocus
                  style={{ borderColor: `${textColor}33`, backgroundColor: bgColor, color: textColor }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${primaryColor}`; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                  onKeyDown={(e) => { if (e.key === 'Escape') setIsSearchOpen(false); }}
                />
                <button onClick={() => setIsSearchOpen(false)} className="p-2 rounded-lg" style={{ color: textColor }}><X className="w-5 h-5" /></button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AR Viewer */}
      {selectedProduct && (
        <ARViewer
          open={arOpen}
          onClose={() => { setArOpen(false); setSelectedProduct(null); }}
          glbSrc={(selectedProduct.model_glb || selectedProduct.ar_model_glb)?.trim() || undefined}
          usdzSrc={(selectedProduct.model_usdz || selectedProduct.ar_model_usdz)?.trim() || undefined}
          posterSrc={getProductImageUrl(selectedProduct.image_url, selectedProduct.image_path) || undefined}
        />
      )}

      {/* Info Panel */}
      <AnimatePresence>
        {isInfoPanelOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsInfoPanelOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
            <motion.div
              initial={{ x: locale === 'ar' ? '-100%' : '100%' }} animate={{ x: 0 }} exit={{ x: locale === 'ar' ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed inset-y-0 ${locale === 'ar' ? 'left-0' : 'right-0'} w-full max-w-md bg-white shadow-2xl z-50 overflow-hidden flex flex-col`}
              dir={textDirection}
            >
              <div className="p-6 border-b border-gray-200 flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1" style={{ color: primaryColor }}>{restaurant.name}</h2>
                  {branch && <p className="text-sm text-gray-600">{branch.name}</p>}
                </div>
                <button onClick={() => setIsInfoPanelOpen(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-600" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {(restaurant?.google_business_url || restaurant?.google_review_url || branchSocial?.google_review_url) && (
                  <div>
                    <a href={restaurant?.google_business_url || restaurant?.google_review_url || branchSocial?.google_review_url || '#'} target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold text-white transition-all hover:scale-105 shadow-lg" style={{ backgroundColor: primaryColor }}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      <span>{locale === 'tr' ? 'Google\'da Yorum Yap' : locale === 'ar' ? 'قيمنا على Google' : 'Rate us on Google'}</span>
                    </a>
                    {restaurant?.google_rating && restaurant.google_rating > 0 && (
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <div className="flex">{[1,2,3,4,5].map((s) => <Star key={s} className={`w-4 h-4 ${s <= Math.round(restaurant.google_rating||0) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 text-gray-300'}`} />)}</div>
                        <span className="text-sm font-semibold text-gray-700">{restaurant.google_rating.toFixed(1)}</span>
                        {restaurant?.google_user_ratings_total && restaurant.google_user_ratings_total > 0 && <span className="text-xs text-gray-500">({restaurant.google_user_ratings_total} {locale === 'tr' ? 'Yorum' : 'Reviews'})</span>}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-center gap-4">
                  {(restaurant?.instagram_url || branchSocial?.instagram_url) && (
                    <a href={restaurant?.instagram_url || branchSocial?.instagram_url || '#'} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full hover:scale-110 transition-all" style={{ backgroundColor: '#E4405F', color: '#fff' }}><Instagram className="w-5 h-5" /></a>
                  )}
                  {(restaurant?.tiktok_url || branchSocial?.tiktok_url) && (
                    <a href={restaurant?.tiktok_url || branchSocial?.tiktok_url || '#'} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full hover:scale-110 transition-all" style={{ backgroundColor: '#000', color: '#fff' }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                    </a>
                  )}
                  {(restaurant?.x_url || restaurant?.twitter_url || branchSocial?.x_url) && (
                    <a href={restaurant?.x_url || restaurant?.twitter_url || branchSocial?.x_url || '#'} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full hover:scale-110 transition-all" style={{ backgroundColor: '#000', color: '#fff' }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                  )}
                  {(restaurant?.website_url || branchSocial?.website_url) && (
                    <a href={restaurant?.website_url || branchSocial?.website_url || '#'} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full hover:scale-110 transition-all" style={{ backgroundColor: primaryColor, color: '#fff' }}><Link2 className="w-5 h-5" /></a>
                  )}
                </div>
                {(restaurant?.address || restaurant?.phone_number || branch?.address || branch?.phone) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: primaryColor }}><MapPin className="w-5 h-5" />{locale === 'tr' ? 'İletişim Bilgileri' : locale === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}</h3>
                    <div className="space-y-3">
                      {(restaurant?.address || branch?.address) && <div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" /><p className="text-sm text-gray-700">{restaurant?.address || branch?.address}</p></div>}
                      {(restaurant?.phone_number || branch?.phone) && <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-gray-400 shrink-0" /><a href={`tel:${restaurant?.phone_number || branch?.phone}`} className="text-sm text-gray-700 hover:underline">{restaurant?.phone_number || branch?.phone}</a></div>}
                    </div>
                  </div>
                )}
                <div className="pt-6 border-t border-gray-200 space-y-3">
                  {restaurant?.include_vat && <p className="text-sm text-gray-600">{locale === 'tr' ? 'Fiyatlara KDV Dahildir' : 'Prices include VAT'}</p>}
                  {restaurant?.has_service_fee && restaurant?.service_fee_amount && <p className="text-sm text-gray-600">{locale === 'tr' ? `Servis Ücreti: %${Number(restaurant.service_fee_amount).toFixed(0)}` : `Service Charge: %${Number(restaurant.service_fee_amount).toFixed(0)}`}</p>}
                  {(restaurant?.allergen_info || restaurant?.allergen_disclaimer) && <div className="mt-4 p-4 rounded-lg bg-gray-50"><p className="text-xs leading-relaxed text-gray-600">{restaurant?.allergen_info || restaurant?.allergen_disclaimer}</p></div>}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ✅ Product Modal — GLB varsa inline 3D viewer */}
      <AnimatePresence>
        {selectedProductForModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProductForModal(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4"
          >
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()}
              className="w-[92%] max-w-[400px] max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col" style={{ backgroundColor: cardColor }} dir={textDirection}
            >
              <button onClick={() => setSelectedProductForModal(null)} className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-black/10" style={{ color: textColor }}><X className="w-6 h-6" /></button>

              <div className="flex-1 overflow-y-auto">
                {/* ── Üst alan: GLB varsa 3D viewer, yoksa image ── */}
                {(() => {
                  const glbPath = (selectedProductForModal.model_glb || selectedProductForModal.ar_model_glb)?.trim() || null;
                  const usdzPath = (selectedProductForModal.model_usdz || selectedProductForModal.ar_model_usdz)?.trim() || null;
                  const glbUrl = glbPath ? getStorageUrl(glbPath, 'model') : null;
                  const usdzUrl = usdzPath ? getStorageUrl(usdzPath, 'model') : null;
                  const posterUrl = getProductImageUrl(selectedProductForModal.image_url, selectedProductForModal.image_path) || undefined;

                  if (glbUrl && modelViewerReady) {
                    const fallbackImg = (
                      <div className="relative w-full h-72 bg-gray-100">
                        {posterUrl ? <img src={posterUrl} alt={getProductName(selectedProductForModal)} className="w-full h-full object-cover rounded-t-2xl" /> : <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: bgColor }}><Box className="w-16 h-16" style={{ color: textColor, opacity: 0.3 }} /></div>}
                      </div>
                    );
                    return (
                      <ModelViewerErrorBoundary fallback={fallbackImg}>
                        <div className="relative w-full h-72">
                          <model-viewer
                            src={glbUrl}
                            ios-src={usdzUrl || undefined}
                            poster={posterUrl}
                            alt={getProductName(selectedProductForModal)}
                            camera-controls
                            auto-rotate
                            shadow-intensity="1"
                            ar
                            ar-modes="webxr scene-viewer quick-look"
                            loading="lazy"
                            style={{ width: '100%', height: '100%', borderRadius: '1rem 1rem 0 0', backgroundColor: `${bgColor}33` }}
                          />
                          <div className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                            style={{ backgroundColor: primaryColor, color: '#fff' }}>
                            <Box className="w-3 h-3" /> 3D
                          </div>
                        </div>
                      </ModelViewerErrorBoundary>
                    );
                  }

                  return (
                    <div className="relative w-full h-56 bg-gray-100">
                      {posterUrl ? (
                        <img src={posterUrl} alt={getProductName(selectedProductForModal)} className="w-full h-full object-cover rounded-t-2xl" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: bgColor }}>
                          <Box className="w-16 h-16" style={{ color: textColor, opacity: 0.3 }} />
                        </div>
                      )}
                      <div className="absolute inset-0 pointer-events-none" style={{ border: `3px solid ${primaryColor}`, borderRadius: '1rem' }} />
                    </div>
                  );
                })()}

                <div className="p-6 space-y-4">
                  {/* Masada Gör hint — sadece gerçek model dosyası olan ürünlerde */}
                  {selectedProductForModal.has_ar && !!((selectedProductForModal.model_glb || selectedProductForModal.ar_model_glb || selectedProductForModal.model_usdz || selectedProductForModal.ar_model_usdz)?.trim()) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                      className="flex flex-col items-center gap-0.5 pb-1"
                    >
                      <span className="text-xs font-medium tracking-widest uppercase" style={{ color: primaryColor, opacity: 0.65 }}>
                        {locale === 'tr' ? 'Masada Gör' : locale === 'ar' ? 'عرض على الطاولة' : locale === 'de' ? 'Am Tisch ansehen' : locale === 'fr' ? 'Voir sur la table' : 'View on Table'}
                      </span>
                      <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}>
                        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                          <path d="M2 2L8 8L14 2" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.65"/>
                        </svg>
                      </motion.div>
                    </motion.div>
                  )}
                  <h2 className="text-3xl font-serif font-bold" style={{ color: primaryColor }}>{getProductName(selectedProductForModal)}</h2>
                  <span className="text-2xl font-bold" style={{ color: textColor }}>{selectedProductForModal.effectivePrice.toFixed(2)} ₺</span>
                  {getProductDescription(selectedProductForModal) && <p className="text-base leading-relaxed" style={{ color: textColor, opacity: 0.8 }}>{getProductDescription(selectedProductForModal)}</p>}

                  <div className="pt-4 border-t" style={{ borderColor: `${textColor}20` }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: primaryColor }}>{locale === 'tr' ? 'Alerjenler' : locale === 'ar' ? 'مسببات الحساسية' : locale === 'de' ? 'Allergene' : locale === 'fr' ? 'Allergènes' : 'Allergens'}</h3>
                    {selectedProductForModal.allergens && selectedProductForModal.allergens.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {getAllergensByKeys(selectedProductForModal.allergens).map((a) => (
                          <div key={a.key} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15`, border: `1px solid ${primaryColor}30` }}>
                            <span className="text-xl">{a.icon}</span>
                            <span className="text-sm font-medium" style={{ color: textColor }}>{getAllergenLabel(a.key, locale)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic" style={{ color: textColor, opacity: 0.6 }}>{locale === 'tr' ? 'Bu üründe alerjen bilgisi girilmemiştir.' : locale === 'ar' ? 'لا توجد معلومات عن مسببات الحساسية.' : locale === 'de' ? 'Keine Allergeninformationen eingegeben.' : locale === 'fr' ? 'Aucune information sur les allergènes.' : 'No allergen information entered.'}</p>
                    )}
                  </div>

                  {selectedProductForModal.recommended_item_ids && selectedProductForModal.recommended_item_ids.length > 0 && (() => {
                    const recs = selectedProductForModal.recommended_item_ids!.slice(0, 3).map(id => products.find(p => p.id === id)).filter((p): p is Product => !!p);
                    if (!recs.length) return null;
                    return (
                      <div className="pt-4 border-t" style={{ borderColor: `${textColor}20` }}>
                        <h3 className="text-lg font-semibold mb-3" style={{ color: primaryColor }}>{locale === 'tr' ? 'Yanına Ne İyi Gider?' : locale === 'ar' ? 'ماذا يناسبه؟' : locale === 'de' ? 'Was passt dazu?' : locale === 'fr' ? 'Qu\'est-ce qui va bien avec ?' : 'What Goes Well With It?'}</h3>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                          {recs.map((rp) => (
                            <div key={rp.id} onClick={() => setSelectedProductForModal(rp)} className="flex-shrink-0 w-32 cursor-pointer group">
                              {rp.image_url || rp.image_path
                                ? <img src={getProductImageUrl(rp.image_url, rp.image_path) || ''} alt={getProductName(rp)} className="w-full h-24 object-cover rounded-lg mb-2 group-hover:opacity-80 transition-opacity" />
                                : <div className="w-full h-24 rounded-lg mb-2 flex items-center justify-center" style={{ backgroundColor: bgColor }}><Box className="w-8 h-8" style={{ color: textColor, opacity: 0.3 }} /></div>}
                              <p className="text-sm font-medium truncate" style={{ color: textColor }}>{getProductName(rp)}</p>
                              <p className="text-xs" style={{ color: textColor, opacity: 0.7 }}>{rp.effectivePrice.toFixed(2)} ₺</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {selectedProductForModal.has_ar && !!((selectedProductForModal.model_glb || selectedProductForModal.ar_model_glb || selectedProductForModal.model_usdz || selectedProductForModal.ar_model_usdz)?.trim()) && (() => {
                    const usdzUrl = getUSDZUrl(selectedProductForModal);
                    const isIOS = typeof window !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
                    const btnStyle = { background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}DD 100%)` };
                    const btnClass = "w-full mt-6 py-4 px-6 rounded-xl font-semibold text-white transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-70";
                    const label = locale === 'tr' ? 'Masada Gör' : locale === 'ar' ? 'عرض على الطاولة' : locale === 'de' ? 'Am Tisch ansehen' : locale === 'fr' ? 'Voir sur la table' : 'View on Table';
                    const loadingLabel = locale === 'tr' ? 'Yükleniyor...' : locale === 'ar' ? 'جارٍ التحميل...' : locale === 'de' ? 'Wird geladen...' : locale === 'fr' ? 'Chargement...' : 'Loading...';
                    if (isIOS && usdzUrl) {
                      const poster = getProductImageUrl(selectedProductForModal.image_url, selectedProductForModal.image_path);
                      return (
                        <div>
                          <button type="button" disabled={arLoading}
                            onClick={() => { setArLoading(true); setSelectedProductForModal(null); setTimeout(() => setArLoading(false), 3000); openARWithBlob(usdzUrl, poster || undefined); }}
                            className={btnClass} style={btnStyle}>
                            {arLoading
                              ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>{loadingLabel}</span></>
                              : <><Box className="w-5 h-5" /><span>{label}</span></>
                            }
                          </button>
                          <p className="mt-2 text-center text-xs" style={{ color: textColor, opacity: 0.45 }}>
                            {locale === 'tr' ? '📱 Butona tıklayın, kameranızı masaya yöneltin' : locale === 'ar' ? '📱 اضغط الزر ووجّه كاميرتك نحو الطاولة' : locale === 'de' ? '📱 Tippen Sie den Button und richten Sie Ihre Kamera auf den Tisch' : locale === 'fr' ? '📱 Appuyez sur le bouton et pointez votre caméra vers la table' : '📱 Tap the button and point your camera at the table'}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div>
                        <button disabled={arLoading}
                          onClick={() => { handleARClick(selectedProductForModal); setSelectedProductForModal(null); }}
                          className={btnClass} style={btnStyle}>
                          {arLoading
                            ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>{loadingLabel}</span></>
                            : <><Box className="w-5 h-5" /><span>{label}</span></>
                          }
                        </button>
                        <p className="mt-2 text-center text-xs" style={{ color: textColor, opacity: 0.45 }}>
                          {locale === 'tr' ? '📱 Butona tıklayın, kameranızı masaya yöneltin' : locale === 'ar' ? '📱 اضغط الزر ووجّه كاميرتك نحو الطاولة' : locale === 'de' ? '📱 Tippen Sie den Button und richten Sie Ihre Kamera auf den Tisch' : locale === 'fr' ? '📱 Appuyez sur le bouton et pointez votre caméra vers la table' : '📱 Tap the button and point your camera at the table'}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}