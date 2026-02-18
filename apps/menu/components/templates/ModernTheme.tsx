"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Globe, Instagram, Twitter, Link2, Info, MapPin, Phone, Star, Box, QrCode, Monitor, Check } from "lucide-react";
import { Sidebar } from "./modern/Sidebar";
import { MenuItemCard, type MenuItem } from "./modern/MenuItemCard";
import { SkeletonCard } from "./modern/SkeletonCard";
import { ARViewer } from "@/app/components/ARViewer";
import { getProductImageUrl, getImageSrc } from "@/lib/image-utils";
import { getAllergensByKeys } from "@/lib/allergens";
import { openARWithBlob } from "@/lib/ar-utils";

interface Category {
  id: string;
  name: string;
  name_en?: string | null;
  name_ar?: string | null;
  sort_order: number;
  is_active: boolean;
  image_url?: string | null;
}

interface Product {
  id: string;
  name: string;
  name_en?: string | null;
  name_ar?: string | null;
  price: number;
  effectivePrice: number;
  description: string | null;
  description_en?: string | null;
  description_ar?: string | null;
  image_path: string | null;
  image_url: string | null;
  has_ar: boolean;
  category_id: string;
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

const LANGUAGE_OPTIONS: { code: 'tr' | 'en' | 'ar'; label: string; labelAr?: string }[] = [
  { code: 'tr', label: 'Türkçe', labelAr: 'التركية' },
  { code: 'en', label: 'English', labelAr: 'الإنجليزية' },
  { code: 'ar', label: 'العربية', labelAr: 'العربية' },
];

interface ModernThemeProps {
  restaurant: Restaurant;
  branch: Branch;
  branchSocial?: BranchSocial | null;
  categories: Category[];
  products: Product[];
  tableNumber?: string | null;
  loading?: boolean;
  initialLocale?: 'tr' | 'en' | 'ar';
  /** Restoran panelinden aktif bırakılan diller; sadece bunlar dropdown'da listelenir. */
  supportedLanguages?: ('tr' | 'en' | 'ar')[];
}

export function ModernTheme({
  restaurant,
  branch,
  branchSocial,
  categories,
  products,
  tableNumber = null,
  loading = false,
  initialLocale = 'tr',
  supportedLanguages = ['tr', 'en', 'ar'],
}: ModernThemeProps) {
  const [locale, setLocale] = useState<'tr' | 'en' | 'ar'>(initialLocale);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  // Single-page scroll: activeCategoryId = which category is in view (scroll-spy) and which tab looks active
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [arOpen, setArOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  const categoryRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const isScrollingFromClick = useRef(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Supported list: only codes that are in supportedLanguages
  const supportedList = LANGUAGE_OPTIONS.filter((o) => supportedLanguages.includes(o.code));

  // Sync locale when supported list changes (e.g. first load with restaurant supported_languages)
  const supportedListKey = supportedLanguages.join(',');
  useEffect(() => {
    const list = LANGUAGE_OPTIONS.filter((o) => supportedLanguages.includes(o.code));
    if (list.length === 0) return;
    setLocale((prev) => (list.some((o) => o.code === prev) ? prev : list[0].code));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportedListKey]);

  // Close language dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync locale when initialLocale prop changes
  useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);

  // Translation helper functions
  const getCategoryName = (category: Category): string => {
    if (locale === 'en' && category.name_en) return category.name_en;
    if (locale === 'ar' && category.name_ar) return category.name_ar;
    return category.name;
  };

  const getProductName = (product: Product): string => {
    if (locale === 'en' && product.name_en) return product.name_en;
    if (locale === 'ar' && product.name_ar) return product.name_ar;
    return product.name;
  };

  const getProductDescription = (product: Product): string | null => {
    if (locale === 'en' && product.description_en) return product.description_en;
    if (locale === 'ar' && product.description_ar) return product.description_ar;
    return product.description;
  };

  // Get allergen warning text (with default fallback)
  const getAllergenWarning = (): string => {
    const allergenText = restaurant?.allergen_info || restaurant?.allergen_disclaimer;
    if (allergenText && allergenText.trim() !== '') {
      return allergenText;
    }
    // Default allergen warning
    if (locale === 'tr') {
      return 'Alerjen uyarısı: Ürünlerimiz alerjen içerebilir. Alerjiniz varsa lütfen sipariş öncesinde bildiriniz.';
    } else if (locale === 'ar') {
      return 'تحذير الحساسية: قد تحتوي منتجاتنا على مسببات الحساسية. إذا كان لديك حساسية، يرجى إبلاغنا قبل الطلب.';
    } else {
      return 'Allergen warning: Our products may contain allergens. If you have allergies, please inform us before ordering.';
    }
  };

  // Determine text direction based on locale
  const textDirection = locale === 'ar' ? 'rtl' : 'ltr';
  const textAlign = locale === 'ar' ? 'text-right' : 'text-left';

  // Scroll Spy: which category section is in view → update sticky tab bar active state (scroll listener)
  useEffect(() => {
    if (categories.length === 0) return;

    const stickyBarHeight = 56; // approx. height of sticky category bar (px)
    const triggerOffset = stickyBarHeight + 24; // section "active" when its top is at or above this line (just below bar)
    let rafId: number | null = null;

    const updateActiveFromScroll = () => {
      if (window.scrollY < 80) {
        setActiveCategoryId(null);
        return;
      }

      const orderedIds = [...categories]
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((c) => c.id);

      let activeId: string | null = null;
      for (const id of orderedIds) {
        const el = categoryRefs.current[id];
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= triggerOffset) activeId = id;
      }
      if (activeId != null) setActiveCategoryId(activeId);
    };

    const onScroll = () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateActiveFromScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateActiveFromScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [categories]);

  // Filter products: single-page scroll — only search filter; never filter by category
  const filteredProducts = products.filter((p) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchName = locale === 'en' ? (p.name_en || p.name) : 
                        locale === 'ar' ? (p.name_ar || p.name) : 
                        p.name;
      const searchDescription = locale === 'en' ? (p.description_en || p.description) :
                               locale === 'ar' ? (p.description_ar || p.description) :
                               p.description;
      
      const matchesName = searchName.toLowerCase().includes(query);
      const matchesDescription = searchDescription?.toLowerCase().includes(query) || false;
      if (!matchesName && !matchesDescription) return false;
    }
    return true; // Always show all products (single-page scroll)
  });

  // Group products by category
  const productsByCategory = categories.reduce((acc: Record<string, Product[]>, category: Category) => {
    acc[category.id] = filteredProducts.filter((p: Product) => p.category_id === category.id);
    return acc;
  }, {} as Record<string, Product[]>);


  // Handle AR click
  // Helper function to get USDZ URL
  const getUSDZUrl = (item: Product): string | null => {
    const usdzSrc = item.model_usdz || item.ar_model_usdz;
    if (!usdzSrc) return null;
    
    if (usdzSrc.startsWith('http')) {
      return usdzSrc;
    }
    
    return `${window.location.origin}${usdzSrc.startsWith('/') ? '' : '/'}${usdzSrc}`;
  };

  const handleARClick = (item: Product) => {
    if (!item.has_ar || !(item.model_glb || item.ar_model_glb || item.model_usdz || item.ar_model_usdz)) {
      return;
    }
    // Always open AR viewer modal first ("3D Modeli AR'da Açmak İster misiniz?")
    setSelectedProduct(item);
    setArOpen(true);
  };

  // Handle category click: smooth scroll to section (no filtering, single-page scroll)
  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'all') {
      setActiveCategoryId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setActiveCategoryId(categoryId);
    const element = categoryRefs.current[categoryId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Get theme colors with fallbacks (for loading state)
  const primaryColorLoading = restaurant?.primary_color || '#c09636';
  const backgroundColorLoading = restaurant?.background_color || '#2d304c';
  const cardColorLoading = restaurant?.card_color || '#ffffff';
  const textColorLoading = restaurant?.text_color || '#ffffff';

  if (loading) {
    return (
      <div 
        className="min-h-screen"
        style={{ backgroundColor: backgroundColorLoading, color: textColorLoading }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Get theme colors with fallbacks
  const primaryColor = restaurant?.primary_color || '#c09636'; // Default Gold
  const bgColor = restaurant?.background_color || '#2d304c';   // Default Navy
  const cardColor = restaurant?.card_color || '#ffffff';       // Default White
  const textColor = restaurant?.text_color || '#ffffff';       // Default White Text

  // Storage URL helper - handles legacy CDN and redundant prefixes
  const getStorageUrl = (path: string | null, bucket: string) => {
    if (!path) return null;
    
    // 1. Clean the path aggressively
    // Remove quotes, whitespace, and leading slashes
    let cleanPath = path.trim().replace(/['"]/g, '').replace(/^\/+/, '');

    // 2. Handle Absolute URLs (Legacy or External)
    if (cleanPath.startsWith('http')) {
      if (cleanPath.includes('cdn.chaosarmenu.com')) {
         return cleanPath.replace('https://cdn.chaosarmenu.com', process.env.NEXT_PUBLIC_SUPABASE_URL || '');
      }
      return cleanPath;
    }

    // 3. Remove Bucket Name if it exists at the start (avoid duplication)
    // e.g., "menu_logos/abc.jpg" -> "abc.jpg"
    if (cleanPath.startsWith(bucket + '/')) {
        cleanPath = cleanPath.replace(bucket + '/', '');
    }

    // 4. Construct URL (Ensure no double slashes)
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, ''); // Strip trailing slash from base
    if (!baseUrl) {
      console.warn('NEXT_PUBLIC_SUPABASE_URL is not set');
      return null;
    }
    return `${baseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
  };

  return (
    <div 
      className="min-h-screen" 
      style={{ backgroundColor: bgColor, color: textColor }}
      dir={textDirection}
    >
      {/* Hero Section with Cover Image */}
      <div className="relative w-full h-48 overflow-hidden">
        {restaurant?.cover_image ? (
          <img
            src={getImageSrc(restaurant.cover_image, 'menu_logos') || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80'}
            alt={`${restaurant.name} kapak fotoğrafı`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to default image if cover_image fails to load
              const target = e.target as HTMLImageElement
              if (!target.src.includes('unsplash.com')) {
                target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80'
              }
            }}
          />
        ) : (
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80"
            alt="Restaurant cover"
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Header Action Buttons: Info, Search, and Language */}
        <div className={`absolute top-4 ${locale === 'ar' ? 'left-4' : 'right-4'} z-20 flex items-center gap-2`}>
          {/* Info Button */}
          <button
            onClick={() => setIsInfoPanelOpen(true)}
            className="p-3 backdrop-blur-sm rounded-full shadow-md transition-colors"
            style={{ backgroundColor: `${cardColor}E6` }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = cardColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${cardColor}E6`;
            }}
            aria-label={locale === 'tr' ? 'Bilgi' : locale === 'ar' ? 'معلومات' : 'Info'}
          >
            <Info className="w-5 h-5" style={{ color: textColor }} />
          </button>

          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-3 backdrop-blur-sm rounded-full shadow-md transition-colors"
            style={{ backgroundColor: `${cardColor}E6` }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = cardColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${cardColor}E6`;
            }}
            aria-label={locale === 'tr' ? 'Ara' : locale === 'ar' ? 'بحث' : 'Search'}
          >
            <Search className="w-5 h-5" style={{ color: textColor }} />
          </button>

          {/* Language Dropdown */}
          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setLangDropdownOpen((o) => !o)}
              className="p-3 backdrop-blur-sm rounded-full shadow-md transition-colors"
              style={{ backgroundColor: `${cardColor}E6` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = cardColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${cardColor}E6`;
              }}
              aria-label="Dil seç"
              aria-expanded={langDropdownOpen}
              aria-haspopup="true"
            >
              <Globe className="w-5 h-5" style={{ color: textColor }} />
            </button>
            <AnimatePresence>
              {langDropdownOpen && supportedList.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute top-full mt-2 min-w-[140px] py-1 rounded-xl shadow-lg border border-white/20 z-50 ${locale === 'ar' ? 'right-0' : 'left-0'}`}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(12px)',
                    color: '#1f2937',
                  }}
                >
                  {supportedList.map((opt) => {
                    const isSelected = locale === opt.code;
                    const label = locale === 'ar' && opt.labelAr ? opt.labelAr : opt.label;
                    return (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => {
                          setLocale(opt.code);
                          setLangDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-sm hover:bg-black/5 transition-colors"
                        style={{ direction: opt.code === 'ar' ? 'rtl' : 'ltr' }}
                      >
                        <span>{label}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 shrink-0" style={{ color: primaryColor }} strokeWidth={2.5} />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Logo overlapping the bottom */}
        {(() => {
          // Prefer logo_path, fallback to logo_url
          const logoPath = restaurant?.logo_path || restaurant?.logo_url;
          const logoUrl = getStorageUrl(logoPath, 'menu_logos');
          return logoUrl ? (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 translate-y-1/2">
              <div className="w-24 h-24 rounded-full border-4 shadow-lg overflow-hidden" style={{ backgroundColor: cardColor, borderColor: cardColor }}>
                <img
                  src={logoUrl}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          ) : null;
        })()}
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Mobile category bar: STICKY — stays at top when scrolling; solid bg so content doesn't show through */}
        <div 
          className="lg:hidden sticky top-0 z-50 border-b overflow-x-auto scrollbar-hide shadow-lg"
          style={{ 
            backgroundColor: bgColor,
            borderColor: 'rgba(255, 255, 255, 0.12)',
          }}
        >
          <div className={`flex px-4 py-3 gap-2 min-w-max ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => handleCategoryClick('all')}
              className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeCategoryId === null ? primaryColor : `${textColor}1A`,
                color: activeCategoryId === null ? '#FFFFFF' : textColor,
                fontWeight: activeCategoryId === null ? '600' : '500',
              }}
              onMouseEnter={(e) => {
                if (activeCategoryId !== null) {
                  e.currentTarget.style.backgroundColor = `${textColor}33`;
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategoryId !== null) {
                  e.currentTarget.style.backgroundColor = `${textColor}1A`;
                }
              }}
            >
              {locale === 'tr' ? 'Tümü' : locale === 'ar' ? 'الكل' : 'All'}
            </button>
            {categories.map((category: Category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
                style={{
                  backgroundColor: activeCategoryId === category.id ? primaryColor : `${textColor}1A`,
                  color: activeCategoryId === category.id ? '#FFFFFF' : textColor,
                  fontWeight: activeCategoryId === category.id ? '600' : '500',
                }}
                onMouseEnter={(e) => {
                  if (activeCategoryId !== category.id) {
                    e.currentTarget.style.backgroundColor = `${textColor}33`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeCategoryId !== category.id) {
                    e.currentTarget.style.backgroundColor = `${textColor}1A`;
                  }
                }}
              >
                {getCategoryName(category)}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar - Desktop only */}
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

        {/* Main Content */}
        <main className={`flex-1 relative z-10 ${locale === 'ar' ? 'lg:mr-64' : 'lg:ml-64'}`}>
          {/* Top padding for content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 lg:pt-16">
            {/* Restaurant Name Header */}
            {!searchQuery && (
              <div className={`mb-8 ${textAlign === 'text-right' ? 'text-right' : 'text-center'}`}>
                <h1 className="text-4xl font-bold mb-2" style={{ color: textColor }}>
                  {restaurant.name}
                </h1>
                {branch && (
                  <p className="text-lg" style={{ color: textColor, opacity: 0.7 }}>
                    {branch.name}
                  </p>
                )}
              </div>
            )}

            {/* Search Results */}
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

            {/* Categories — single long list with prominent section headers (Scroll Spy targets) */}
            {!searchQuery && categories.map((category: Category) => {
              const categoryProducts = productsByCategory[category.id] || [];
              if (categoryProducts.length === 0) return null;

              return (
                <motion.section
                  key={category.id}
                  id={`category-${category.id}`}
                  ref={(el: HTMLElement | null) => {
                    categoryRefs.current[category.id] = el;
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-14"
                  style={{ scrollMarginTop: "6rem" }}
                >
                  {/* Prominent category header — large, clear, like "Sıcak İçecekler" */}
                  <div
                    className={`py-4 mb-6 ${textAlign}`}
                    style={{
                      borderLeft: locale === "ar" ? "none" : `4px solid ${primaryColor}`,
                      borderRight: locale === "ar" ? `4px solid ${primaryColor}` : "none",
                      paddingLeft: locale === "ar" ? "0" : "1rem",
                      paddingRight: locale === "ar" ? "1rem" : "0",
                    }}
                  >
                    <h2
                      className="text-3xl sm:text-4xl font-bold tracking-tight"
                      style={{ color: textColor }}
                    >
                      {getCategoryName(category)}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryProducts.map((product: Product) => {
                      const menuItem: MenuItem = {
                        id: product.id,
                        name: getProductName(product),
                        price: product.price,
                        effectivePrice: product.effectivePrice,
                        description: getProductDescription(product),
                        image_path: product.image_path,
                        image_url: product.image_url,
                        has_ar: product.has_ar,
                        model_glb: product.model_glb,
                        model_usdz: product.model_usdz,
                        ar_model_glb: product.ar_model_glb,
                        ar_model_usdz: product.ar_model_usdz,
                        allergens: product.allergens,
                        is_available: product.is_available,
                        category_id: product.category_id,
                        is_active: product.is_active,
                        sort_order: product.sort_order,
                      };
                      return (
                        <MenuItemCard
                          key={product.id}
                          item={menuItem}
                          onItemClick={(item: MenuItem) => {
                            // Find the full product object
                            const fullProduct = products.find(p => p.id === item.id);
                            if (fullProduct) {
                              setSelectedProductForModal(fullProduct);
                            }
                          }}
                          onARClick={(item: MenuItem) => {
                            const productForAR: Product = {
                              id: item.id,
                              name: item.name,
                              price: item.price,
                              effectivePrice: item.effectivePrice,
                              description: item.description,
                              image_path: item.image_path,
                              image_url: item.image_url,
                              has_ar: item.has_ar,
                              category_id: item.category_id || '',
                              is_active: item.is_active ?? true,
                              sort_order: item.sort_order ?? 0,
                              model_glb: item.model_glb,
                              model_usdz: item.model_usdz,
                              ar_model_glb: item.ar_model_glb,
                              ar_model_usdz: item.ar_model_usdz,
                              allergens: item.allergens,
                              is_available: item.is_available,
                            };
                            handleARClick(productForAR);
                          }}
                          locale={locale}
                          primaryColor={primaryColor}
                          cardColor={cardColor}
                          textColor={textColor}
                        />
                      );
                    })}
                  </div>
                </motion.section>
              );
            })}

            {/* Search Results Grid */}
            {searchQuery && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product: Product) => {
                  const menuItem: MenuItem = {
                    id: product.id,
                    name: getProductName(product),
                    price: product.price,
                    effectivePrice: product.effectivePrice,
                    description: getProductDescription(product),
                    image_path: product.image_path,
                    image_url: product.image_url,
                    has_ar: product.has_ar,
                    model_glb: product.model_glb,
                    model_usdz: product.model_usdz,
                    ar_model_glb: product.ar_model_glb,
                    ar_model_usdz: product.ar_model_usdz,
                    allergens: product.allergens,
                    is_available: product.is_available,
                    category_id: product.category_id,
                    is_active: product.is_active,
                    sort_order: product.sort_order,
                  };
                  return (
                    <MenuItemCard
                      key={product.id}
                      item={menuItem}
                      onItemClick={(item: MenuItem) => {
                        // Find the full product object
                        const fullProduct = products.find(p => p.id === item.id);
                        if (fullProduct) {
                          setSelectedProductForModal(fullProduct);
                        }
                      }}
                      onARClick={(item: MenuItem) => {
                        const productForAR: Product = {
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          effectivePrice: item.effectivePrice,
                          description: item.description,
                          image_path: item.image_path,
                          image_url: item.image_url,
                          has_ar: item.has_ar,
                          category_id: item.category_id || '',
                          is_active: item.is_active ?? true,
                          sort_order: item.sort_order ?? 0,
                          model_glb: item.model_glb,
                          model_usdz: item.model_usdz,
                          ar_model_glb: item.ar_model_glb,
                          ar_model_usdz: item.ar_model_usdz,
                          allergens: item.allergens,
                          is_available: item.is_available,
                        };
                        handleARClick(productForAR);
                      }}
                      locale={locale}
                      primaryColor={primaryColor}
                      cardColor={cardColor}
                      textColor={textColor}
                    />
                  );
                })}
              </div>
            )}

            {/* No Results */}
            {searchQuery && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg" style={{ color: textColor, opacity: 0.7 }}>
                  {locale === 'tr' ? 'Sonuç bulunamadı' : locale === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found'}
                </p>
              </div>
            )}

            {/* Legal Footer - Menu End Section */}
            <div className="mt-16 pt-8 pb-12">
              <div className="space-y-4">
                {/* VAT & Service Charge Info */}
                <div className="space-y-2">
                  {/* VAT Info */}
                  {restaurant?.include_vat && (
                    <p className="text-sm" style={{ color: textColor, opacity: 0.8 }}>
                      {locale === 'tr' 
                        ? 'Tüm fiyatlarımıza KDV dahildir.' 
                        : locale === 'ar'
                        ? 'جميع الأسعار تشمل ضريبة القيمة المضافة.'
                        : 'All prices include VAT.'}
                    </p>
                  )}

                  {/* Service Fee */}
                  {restaurant?.has_service_fee && restaurant?.service_fee_amount && (
                    <p className="text-sm" style={{ color: textColor, opacity: 0.8 }}>
                      {locale === 'tr' 
                        ? `Servis Ücreti: %${Number(restaurant.service_fee_amount).toFixed(0)}` 
                        : locale === 'ar'
                        ? `رسوم الخدمة: %${Number(restaurant.service_fee_amount).toFixed(0)}`
                        : `Service Charge: %${Number(restaurant.service_fee_amount).toFixed(0)}`}
                    </p>
                  )}
                </div>

                {/* Allergen Warning Box (Always shown with fallback) */}
                <div 
                  className="mt-6 p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: `${cardColor}E6`,
                    borderColor: `${primaryColor}30`,
                  }}
                >
                  <p 
                    className="text-xs leading-relaxed"
                    style={{ 
                      color: textColor, 
                      opacity: 0.85,
                      textAlign: textAlign === 'text-right' ? 'right' : 'left'
                    }}
                    dir={textDirection}
                  >
                    {getAllergenWarning()}
                  </p>
                </div>

                {/* Powered By - Advanced Brand Card */}
                <div 
                  className="mt-10 w-full p-6 rounded-lg shadow-sm flex items-center justify-center gap-3"
                  style={{ 
                    backgroundColor: '#eae3d4',
                  }}
                >
                  {/* Icon */}
                  <Monitor 
                    className="w-5 h-5 md:w-6 md:h-6 shrink-0" 
                    style={{ color: primaryColor }}
                  />
                  
                  {/* Text Content */}
                  <p className="text-center text-xs md:text-sm flex items-center gap-1.5 flex-wrap justify-center" style={{ color: textColor }}>
                    <span style={{ opacity: 0.75 }}>
                      {locale === 'tr' 
                        ? 'Digital Menu System by ' 
                        : locale === 'ar'
                        ? 'نظام القائمة الرقمية بواسطة '
                        : 'Digital Menu System by '}
                    </span>
                    <a
                      href="https://chaosarmenu.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:underline transition-all"
                      style={{ 
                        color: primaryColor,
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      ChaosAR
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-0 left-0 right-0 z-50 p-4 shadow-lg"
              style={{ backgroundColor: cardColor }}
            >
              <div className="max-w-2xl mx-auto flex items-center gap-3">
                <Search className="w-5 h-5" style={{ color: textColor, opacity: 0.5 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'tr' ? 'Ürün ara...' : locale === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...'}
                  dir={textDirection}
                  className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${textAlign}`}
                  autoFocus
                  style={{
                    borderColor: `${textColor}33`,
                    backgroundColor: bgColor,
                    color: textColor,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${primaryColor}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Escape') {
                      setIsSearchOpen(false);
                    }
                  }}
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: textColor }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${textColor}1A`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AR Viewer */}
      {selectedProduct && (
        <ARViewer
          open={arOpen}
          onClose={() => {
            setArOpen(false);
            setSelectedProduct(null);
          }}
          glbSrc={selectedProduct.model_glb || selectedProduct.ar_model_glb || undefined}
          usdzSrc={selectedProduct.model_usdz || selectedProduct.ar_model_usdz || undefined}
          posterSrc={getProductImageUrl(selectedProduct.image_url, selectedProduct.image_path) || undefined}
        />
      )}

      {/* Info Panel Drawer */}
      <AnimatePresence>
        {isInfoPanelOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInfoPanelOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: locale === 'ar' ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: locale === 'ar' ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed inset-y-0 ${locale === 'ar' ? 'left-0' : 'right-0'} w-full max-w-md bg-white shadow-2xl z-50 overflow-hidden flex flex-col`}
              dir={textDirection}
            >
              {/* Panel Header */}
              <div className="p-6 border-b border-gray-200 flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1" style={{ color: primaryColor }}>
                    {restaurant.name}
                  </h2>
                  {branch && (
                    <p className="text-sm text-gray-600">{branch.name}</p>
                  )}
                </div>
                <button
                  onClick={() => setIsInfoPanelOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Google Review Button (Prominent) */}
                  {(restaurant?.google_business_url || restaurant?.google_review_url || branchSocial?.google_review_url) && (
                    <div>
                      <a
                        href={restaurant?.google_business_url || restaurant?.google_review_url || branchSocial?.google_review_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold text-white transition-all hover:scale-105 shadow-lg"
                        style={{ backgroundColor: primaryColor }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>{locale === 'tr' ? 'Google\'da Yorum Yap' : locale === 'ar' ? 'قيمنا على Google' : 'Rate us on Google'}</span>
                      </a>
                      {/* Star Rating Display */}
                      {restaurant?.google_rating && restaurant.google_rating > 0 && (
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= Math.round(restaurant.google_rating || 0)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-gray-300 text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            {restaurant.google_rating.toFixed(1)}
                          </span>
                          {restaurant?.google_user_ratings_total && restaurant.google_user_ratings_total > 0 && (
                            <span className="text-xs text-gray-500">
                              ({restaurant.google_user_ratings_total} {locale === 'tr' ? 'Yorum' : locale === 'ar' ? 'تقييم' : 'Reviews'})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Social Media Row (Centered) */}
                  {(restaurant?.instagram_url || restaurant?.tiktok_url || restaurant?.x_url || restaurant?.twitter_url || restaurant?.website_url || branchSocial?.instagram_url || branchSocial?.tiktok_url || branchSocial?.x_url || (branchSocial as any)?.twitter_url || branchSocial?.website_url) && (
                    <div className="flex items-center justify-center gap-4">
                      {(restaurant?.instagram_url || branchSocial?.instagram_url) && (
                        <a
                          href={restaurant?.instagram_url || branchSocial?.instagram_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-full transition-all hover:scale-110"
                          style={{ 
                            backgroundColor: '#E4405F',
                            color: '#FFFFFF',
                          }}
                          aria-label="Instagram"
                        >
                          <Instagram className="w-5 h-5" />
                        </a>
                      )}

                      {(restaurant?.tiktok_url || branchSocial?.tiktok_url) && (
                        <a
                          href={restaurant?.tiktok_url || branchSocial?.tiktok_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-full transition-all hover:scale-110"
                          style={{ 
                            backgroundColor: '#000000',
                            color: '#FFFFFF',
                          }}
                          aria-label="TikTok"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                          </svg>
                        </a>
                      )}

{(restaurant?.x_url || restaurant?.twitter_url || branchSocial?.x_url || (branchSocial as any)?.twitter_url) && (
  <a
    href={restaurant?.x_url || restaurant?.twitter_url || branchSocial?.x_url || (branchSocial as any)?.twitter_url || '#'}
    target="_blank"
    rel="noopener noreferrer"
    className="p-3 rounded-full transition-all hover:scale-110"
    style={{ 
      backgroundColor: '#000000', // Twitter mavisi yerine X siyahı
      color: '#FFFFFF',
    }}
    aria-label="X (Twitter)"
  >
    {/* Yeni X Logosu */}
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  </a>
)}

                      {(restaurant?.website_url || branchSocial?.website_url) && (
                        <a
                          href={restaurant?.website_url || branchSocial?.website_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-full transition-all hover:scale-110"
                          style={{ 
                            backgroundColor: primaryColor,
                            color: '#FFFFFF',
                          }}
                          aria-label="Website"
                        >
                          <Link2 className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Contact Info Section */}
                  {(restaurant?.address || restaurant?.phone_number || branch?.address || branch?.phone) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: primaryColor }}>
                        <MapPin className="w-5 h-5" />
                        {locale === 'tr' ? 'İletişim Bilgileri' : locale === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
                      </h3>
                      <div className="space-y-3">
                        {(restaurant?.address || branch?.address) && (
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {restaurant?.address || branch?.address}
                            </p>
                          </div>
                        )}
                        {(restaurant?.phone_number || branch?.phone) && (
                          <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <a
                              href={`tel:${restaurant?.phone_number || branch?.phone}`}
                              className="text-sm text-gray-700 hover:underline"
                            >
                              {restaurant?.phone_number || branch?.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Legal & Info Section */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="space-y-3">
                      {/* VAT Info */}
                      {restaurant?.include_vat && (
                        <p className="text-sm text-gray-600">
                          {locale === 'tr' ? 'Fiyatlara KDV Dahildir' : locale === 'ar' ? 'الأسعار تشمل ضريبة القيمة المضافة' : 'Prices include VAT'}
                        </p>
                      )}

                      {/* Service Fee */}
                      {restaurant?.has_service_fee && restaurant?.service_fee_amount && (
                        <p className="text-sm text-gray-600">
                    {locale === 'tr' 
                      ? `Servis Ücreti: %${Number(restaurant.service_fee_amount).toFixed(0)}` 
                      : locale === 'ar'
                      ? `رسوم الخدمة: %${Number(restaurant.service_fee_amount).toFixed(0)}`
                      : `Service Charge: %${Number(restaurant.service_fee_amount).toFixed(0)}`}
                        </p>
                      )}

                      {/* Allergen Warning */}
                      {(restaurant?.allergen_info || restaurant?.allergen_disclaimer) && (
                        <div className="mt-4 p-4 rounded-lg bg-gray-50">
                          <p className="text-xs leading-relaxed text-gray-600">
                            {restaurant?.allergen_info || restaurant?.allergen_disclaimer}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProductForModal && (
          <>
            {/* Backdrop with Flexbox Centering */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProductForModal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4"
            >
              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-[92%] max-w-[400px] max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
                style={{ backgroundColor: cardColor }}
                dir={textDirection}
              >
              {/* Close Button */}
              <button
                onClick={() => setSelectedProductForModal(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full transition-colors hover:bg-black/10"
                style={{ color: textColor }}
                aria-label={locale === 'tr' ? 'Kapat' : locale === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X className="w-6 h-6" />
              </button>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Product Image */}
                <div className="relative w-full h-56 bg-gray-100">
                  {selectedProductForModal.image_url || selectedProductForModal.image_path ? (
                    <img
                      src={getProductImageUrl(selectedProductForModal.image_url, selectedProductForModal.image_path) || ''}
                      alt={getProductName(selectedProductForModal)}
                      className="w-full h-full object-cover rounded-t-2xl"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: bgColor }}>
                      <Box className="w-16 h-16" style={{ color: textColor, opacity: 0.3 }} />
                    </div>
                  )}
                  {/* Gold Border Frame */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      border: `3px solid ${primaryColor}`,
                      borderRadius: '1rem',
                    }}
                  />
                </div>

                {/* Info Section */}
                <div className="p-6 space-y-4">
                  {/* Product Name */}
                  <h2
                    className="text-3xl md:text-4xl font-serif font-bold"
                    style={{ color: primaryColor }}
                  >
                    {getProductName(selectedProductForModal)}
                  </h2>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span
                      className="text-2xl md:text-3xl font-bold"
                      style={{ color: textColor }}
                    >
                      {selectedProductForModal.effectivePrice.toFixed(2)} ₺
                    </span>
                  </div>

                  {/* Description */}
                  {getProductDescription(selectedProductForModal) && (
                    <p
                      className="text-base leading-relaxed"
                      style={{ color: textColor, opacity: 0.8 }}
                    >
                      {getProductDescription(selectedProductForModal)}
                    </p>
                  )}

                  {/* Allergen Section */}
                  <div className="pt-4 border-t" style={{ borderColor: `${textColor}20` }}>
                    <h3
                      className="text-lg font-semibold mb-3"
                      style={{ color: primaryColor }}
                    >
                      {locale === 'tr' ? 'Alerjenler' : locale === 'ar' ? 'مسببات الحساسية' : 'Allergens'}
                    </h3>
                    {selectedProductForModal.allergens && selectedProductForModal.allergens.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {getAllergensByKeys(selectedProductForModal.allergens).map((allergen) => (
                          <div
                            key={allergen.key}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg"
                            style={{
                              backgroundColor: `${primaryColor}15`,
                              border: `1px solid ${primaryColor}30`,
                            }}
                          >
                            <span className="text-xl">{allergen.icon}</span>
                            <span
                              className="text-sm font-medium"
                              style={{ color: textColor }}
                            >
                              {allergen.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p
                        className="text-sm italic"
                        style={{ color: textColor, opacity: 0.6 }}
                      >
                        {locale === 'tr'
                          ? 'Bu üründe alerjen bilgisi girilmemiştir.'
                          : locale === 'ar'
                          ? 'لم يتم إدخال معلومات الحساسية لهذا المنتج.'
                          : 'No allergen information has been entered for this product.'}
                      </p>
                    )}
                  </div>

                  {/* Recommendations Section */}
                  {selectedProductForModal.recommended_item_ids && selectedProductForModal.recommended_item_ids.length > 0 && (() => {
                    const recommendedProducts = selectedProductForModal.recommended_item_ids
                      .slice(0, 3)
                      .map(id => products.find(p => p.id === id))
                      .filter((p): p is Product => p !== undefined);
                    
                    if (recommendedProducts.length === 0) return null;
                    
                    return (
                      <div className="pt-4 border-t" style={{ borderColor: `${textColor}20` }}>
                        <h3
                          className="text-lg font-semibold mb-3"
                          style={{ color: primaryColor }}
                        >
                          {locale === 'tr' ? 'Yanına Ne İyi Gider?' : locale === 'ar' ? 'ماذا يصلح معه؟' : 'What Goes Well With It?'}
                        </h3>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                          {recommendedProducts.map((recommendedProduct) => (
                            <div
                              key={recommendedProduct.id}
                              onClick={() => {
                                setSelectedProductForModal(recommendedProduct);
                              }}
                              className="flex-shrink-0 w-32 cursor-pointer group"
                            >
                              {recommendedProduct.image_url || recommendedProduct.image_path ? (
                                <img
                                  src={getProductImageUrl(recommendedProduct.image_url, recommendedProduct.image_path) || ''}
                                  alt={getProductName(recommendedProduct)}
                                  className="w-full h-24 object-cover rounded-lg mb-2 group-hover:opacity-80 transition-opacity"
                                />
                              ) : (
                                <div
                                  className="w-full h-24 rounded-lg mb-2 flex items-center justify-center"
                                  style={{ backgroundColor: bgColor }}
                                >
                                  <Box className="w-8 h-8" style={{ color: textColor, opacity: 0.3 }} />
                                </div>
                              )}
                              <p
                                className="text-sm font-medium truncate"
                                style={{ color: textColor }}
                              >
                                {getProductName(recommendedProduct)}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: textColor, opacity: 0.7 }}
                              >
                                {recommendedProduct.effectivePrice.toFixed(2)} ₺
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Masada Gör: iOS+USDZ = blob open (beyaz sayfa yok, direkt "Bu 3B model açılsın mı?"); diğer = modal */}
                  {selectedProductForModal.has_ar && (() => {
                    const usdzUrl = getUSDZUrl(selectedProductForModal);
                    const isIOSDevice = typeof window !== 'undefined' && (
                      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
                    );
                    if (isIOSDevice && usdzUrl) {
                      const posterImageUrl = getProductImageUrl(selectedProductForModal.image_url, selectedProductForModal.image_path);
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProductForModal(null);
                            openARWithBlob(usdzUrl, posterImageUrl || undefined);
                          }}
                          className="w-full mt-6 py-4 px-6 rounded-xl font-semibold text-white transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                          style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}DD 100%)` }}
                        >
                          <Box className="w-5 h-5" />
                          <span>{locale === 'tr' ? 'Masada Gör' : locale === 'ar' ? 'عرض على الطاولة' : 'View on Table'}</span>
                        </button>
                      );
                    }
                    return (
                      <button
                        onClick={() => { handleARClick(selectedProductForModal); setSelectedProductForModal(null); }}
                        className="w-full mt-6 py-4 px-6 rounded-xl font-semibold text-white transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}DD 100%)` }}
                      >
                        <Box className="w-5 h-5" />
                        <span>{locale === 'tr' ? 'Masada Gör' : locale === 'ar' ? 'عرض على الطاولة' : 'View on Table'}</span>
                      </button>
                    );
                  })()}
                </div>
              </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
