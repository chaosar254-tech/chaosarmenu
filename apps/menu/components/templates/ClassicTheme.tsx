"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Share2, Menu, Search, Grid3x3, Utensils, IceCream, Flame, Coffee, ChefHat, Cake, Monitor } from "lucide-react";
import { ARViewer } from "@/app/components/ARViewer";
import { MenuLegalInfo } from "@/app/components/MenuLegalInfo";
import ReviewAndSocialSheet from "@/app/components/ReviewAndSocialSheet";
import { getAllergensByKeys } from "@/lib/allergens";
import { getRecommendedSidesDisplay } from "@/lib/recommendationEngine";
import { ProductImage } from "./classic/ProductImage";
import { CategoryImage } from "./classic/CategoryImage";
import { CubeIcon } from "./classic/CubeIcon";
import { supabase } from "@/lib/supabase";
import { getImageSrc } from "@/lib/image-utils";
import { openARWithBlob } from "@/lib/ar-utils";

interface Category {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  image_url?: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  effectivePrice: number;
  description: string | null;
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
  ingredients?: string[] | null;
  recommended_item_ids?: string[] | null;
  allergens?: string[] | null;
  recommended_sides?: string | null;
  recommended_sides_auto?: string | null;
  recommended_sides_source?: 'auto' | 'manual';
  is_available?: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  logo_path: string | null;
  cover_image?: string | null;
  theme_primary?: string | null;
  theme_secondary?: string | null;
  theme_bg?: string | null;
  theme_card?: string | null;
  theme_text?: string | null;
  include_vat?: boolean | null;
  has_service_fee?: boolean | null;
  has_cover_charge?: boolean | null;
}

interface Branch {
  id: string;
  name: string;
  slug: string;
}

interface BranchSocial {
  google_review_url?: string | null;
  google_place_id?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  x_url?: string | null;
  website_url?: string | null;
}

interface ClassicThemeProps {
  restaurant: Restaurant;
  branch: Branch;
  categories: Category[];
  products: Product[];
  branchSocial?: BranchSocial | null;
  tableNumber?: string | null;
  tableInfo?: { table_no: string } | null;
  loading?: boolean;
  error?: string | null;
  onItemView?: (productId: string) => void;
}

function ClassicThemeProductCard({
  product,
  themePrimary,
  themeCard,
  onSelect,
}: {
  product: Product;
  themePrimary: string;
  themeCard: string;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      className="relative rounded-lg p-6 text-left transition-all duration-300 border-2 group overflow-hidden"
      style={{
        backgroundColor: themeCard,
        borderColor: `${themePrimary}30`,
      }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        initial={{ border: "2px solid transparent", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)" }}
        whileHover={{
          border: `2px solid ${themePrimary}`,
          boxShadow: `0 0 20px ${themePrimary}40, 0 0 40px ${themePrimary}30, 0 0 60px ${themePrimary}20, 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 20px ${themePrimary}10`,
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
      <motion.div
        className="absolute -inset-1 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, ${themePrimary}30 0%, transparent 70%)`, filter: "blur(12px)" }}
        transition={{ duration: 0.4 }}
      />
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        initial={{ boxShadow: "inset 0 0 0 0 rgba(255, 255, 255, 0)" }}
        whileHover={{ boxShadow: `inset 0 0 30px 1px ${themePrimary}20` }}
        transition={{ duration: 0.4 }}
      />
      <div className="relative z-10">
        {product.image_path || product.image_url ? (
          <ProductImage
            path={product.image_path}
            legacyUrl={product.image_url}
            alt={product.name}
            className="w-full h-48 mb-4 rounded-lg overflow-hidden"
            style={{ backgroundColor: themeCard }}
          />
        ) : (
          <div className="w-full h-48 mb-4 rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: themeCard }}>
            <span className="text-sm" style={{ color: themePrimary, opacity: 0.5 }}>No Image</span>
          </div>
        )}
        <motion.h3
          className="text-lg font-semibold mb-2 px-3 py-1.5 rounded-lg border-2 inline-block relative"
          style={{ color: themePrimary, borderColor: `${themePrimary}40` }}
          whileHover={{ borderColor: themePrimary, boxShadow: `0 0 10px ${themePrimary}40, 0 0 20px ${themePrimary}30, inset 0 0 10px ${themePrimary}10` }}
          transition={{ duration: 0.3 }}
        >
          {product.name}
        </motion.h3>
        {product.description && (
          <p className="text-sm mb-2" style={{ color: themePrimary, opacity: 0.72 }}>{product.description}</p>
        )}
        <p className="text-xl font-bold mb-2" style={{ color: themePrimary }}>
          {product.effectivePrice.toFixed(2)} ₺
          {product.effectivePrice !== product.price && (
            <span className="ml-2 text-sm line-through opacity-60">{product.price.toFixed(2)} ₺</span>
          )}
        </p>
        {product.allergens && product.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {getAllergensByKeys(product.allergens.slice(0, 4)).map((allergen) => (
              <span
                key={allergen.key}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded"
                style={{ backgroundColor: `${themePrimary}20`, color: themePrimary, border: `1px solid ${themePrimary}40` }}
                title={allergen.label}
              >
                <span>{allergen.icon}</span>
                <span className="hidden sm:inline">{allergen.label}</span>
              </span>
            ))}
            {product.allergens.length > 4 && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 text-xs rounded"
                style={{ backgroundColor: `${themePrimary}20`, color: themePrimary, border: `1px solid ${themePrimary}40` }}
                title={getAllergensByKeys(product.allergens.slice(4)).map((a) => a.label).join(", ")}
              >
                +{product.allergens.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}

export function ClassicTheme({
  restaurant,
  branch,
  categories,
  products,
  branchSocial = null,
  tableNumber = null,
  tableInfo = null,
  loading = false,
  error = null,
  onItemView,
}: ClassicThemeProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [arOpen, setArOpen] = useState(false);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [arPosterUrl, setArPosterUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [recommendedItems, setRecommendedItems] = useState<Product[]>([]);
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);

  const selectedProduct = selectedItem
    ? products.find((p) => p.id === selectedItem)
    : null;

  // Splash screen timer
  useEffect(() => {
    if (!loading) {
      const timer = window.setTimeout(() => setShowSplash(false), 3000);
      return () => window.clearTimeout(timer);
    }
  }, [loading]);

  // Fetch logo signed URL when restaurant loads
  useEffect(() => {
    if (restaurant?.logo_path) {
      const fetchLogoUrl = async () => {
        try {
          const encodedPath = encodeURIComponent(restaurant.logo_path!);
          const response = await fetch(`/api/logo?path=${encodedPath}`);
          if (response.ok) {
            const { url } = await response.json();
            setLogoUrl(url);
          } else {
            console.error('Failed to fetch logo URL:', restaurant.logo_path);
            setLogoUrl(null);
          }
        } catch (error) {
          console.error('Error fetching logo URL:', error);
          setLogoUrl(null);
        }
      };
      fetchLogoUrl();
    } else if (restaurant?.logo_url) {
      setLogoUrl(restaurant.logo_url);
    } else {
      setLogoUrl(null);
    }
  }, [restaurant?.logo_path, restaurant?.logo_url]);

  // Fetch AR poster URL when selected product changes
  useEffect(() => {
    if (selectedProduct?.image_path) {
      const fetchPosterUrl = async () => {
        try {
          const encodedPath = encodeURIComponent(selectedProduct.image_path!);
          const response = await fetch(`/api/image?path=${encodedPath}`);
          if (response.ok) {
            const { url } = await response.json();
            setArPosterUrl(url);
          } else {
            if (selectedProduct.image_url) {
              setArPosterUrl(selectedProduct.image_url);
            } else {
              setArPosterUrl(null);
            }
          }
        } catch (error) {
          console.error('Failed to fetch poster image:', error);
          if (selectedProduct.image_url) {
            setArPosterUrl(selectedProduct.image_url);
          } else {
            setArPosterUrl(null);
          }
        }
      };
      fetchPosterUrl();
    } else if (selectedProduct?.image_url) {
      setArPosterUrl(selectedProduct.image_url);
    } else {
      setArPosterUrl(null);
    }
  }, [selectedProduct?.image_path, selectedProduct?.image_url]);

  // Fetch recommended items when selectedProduct changes
  useEffect(() => {
    if (!selectedProduct?.recommended_item_ids || selectedProduct.recommended_item_ids.length === 0) {
      setRecommendedItems([])
      return
    }

    const recommendedIds = selectedProduct.recommended_item_ids

    const fetchRecommendedItems = async () => {
      const cachedItems = recommendedIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined)

      if (cachedItems.length === recommendedIds.length) {
        setRecommendedItems(cachedItems)
        return
      }

      const missingIds = recommendedIds.filter(
        (id) => !products.find((p) => p.id === id)
      )

      if (missingIds.length > 0 && restaurant) {
        try {
          const { data: fetchedItems, error } = await supabase
            .from('menu_items')
            .select('id, name, price, image_path, image_url, allergens')
            .eq('restaurant_id', restaurant.id)
            .eq('is_active', true)
            .in('id', missingIds)

          if (!error && fetchedItems) {
            const allItems = [
              ...cachedItems,
              ...fetchedItems.map((item) => ({
                ...item,
                description: null,
                has_ar: false,
                category_id: '',
                is_active: true,
                sort_order: 0,
                effectivePrice: item.price,
                is_available: true,
              } as Product)),
            ]
            setRecommendedItems(allItems)
          } else {
            setRecommendedItems(cachedItems)
          }
        } catch (error) {
          console.error('Failed to fetch recommended items:', error)
          setRecommendedItems(cachedItems)
        }
      } else {
        setRecommendedItems(cachedItems)
      }
    }

    fetchRecommendedItems()
  }, [selectedProduct?.id, selectedProduct?.recommended_item_ids, products, restaurant])

  // Single-page scroll: no category filter; only search filters the list (for search results UI)
  const filteredProducts = products.filter((p) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = p.name.toLowerCase().includes(query);
      const matchesDescription = p.description?.toLowerCase().includes(query) || false;
      return matchesName || matchesDescription;
    }
    return true;
  });

  const scrollToCategory = (categoryId: string | null) => {
    if (categoryId === null) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(`category-${categoryId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getUSDZUrl = (product: Product): string | null => {
    const usdzSrc = product.model_usdz || product.ar_model_usdz;
    if (!usdzSrc) return null;
    if (usdzSrc.startsWith('http')) return usdzSrc;
    return `${window.location.origin}${usdzSrc.startsWith('/') ? '' : '/'}${usdzSrc}`;
  };

  const handleARClick = (e: React.MouseEvent) => {
    if (!selectedProduct) return;

    if (!selectedProduct.has_ar || !(selectedProduct.model_glb || selectedProduct.ar_model_glb || selectedProduct.model_usdz || selectedProduct.ar_model_usdz)) {
      return;
    }
    // Always open AR viewer modal first ("3D Modeli AR'da Açmak İster misiniz?")
    setArOpen(true);
  };

  const isMenuVisible = !showSplash && !loading;

  // Get theme colors with fallbacks
  const themePrimary = restaurant?.theme_primary || '#D4AF37'
  const themeSecondary = restaurant?.theme_secondary || '#C89B3C'
  const themeBg = restaurant?.theme_bg || '#0B0B0F'
  const themeCard = restaurant?.theme_card || '#15151B'
  const themeText = restaurant?.theme_text || '#F5F5F5'

  // CSS variables for theme
  const themeStyles: React.CSSProperties = {
    '--theme-primary': themePrimary,
    '--theme-bg': themeBg,
    '--theme-card': themeCard,
    '--theme-text': themeText,
  } as React.CSSProperties

  if (loading) {
    return (
      <main 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: themeBg,
          color: themeText,
          ...themeStyles,
        }}
      >
        <div style={{ color: themePrimary }} className="text-lg">Yükleniyor...</div>
      </main>
    );
  }

  if (error || !restaurant || !branch) {
    return (
      <main 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: themeBg,
          color: themeText,
          ...themeStyles,
        }}
      >
        <div className="text-red-400 text-lg">
          {error || "Restoran veya şube bulunamadı"}
        </div>
      </main>
    );
  }

  // Table label for header
  const tableLabel = tableInfo?.table_no || tableNumber ? `Masa ${tableInfo?.table_no || tableNumber}` : 'Menü';

  return (
    <div 
      className="min-h-[100dvh] flex flex-col"
      style={{
        backgroundColor: themeBg,
        color: themeText,
        ...themeStyles,
      }}
    >
      {/* Cover Image Hero Section (if available) */}
      {restaurant?.cover_image && (
        <div className="relative w-full h-48 overflow-hidden">
          <img
            src={getImageSrc(restaurant.cover_image, 'menu_logos') || ''}
            alt={`${restaurant.name} kapak fotoğrafı`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide image if it fails to load
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        </div>
      )}
      
      {/* Header - Logo, Restaurant Name, Branch Name, Table, Social Button (scrolls with page) */}
      <header 
        className="backdrop-blur-md border-b border-white/10"
        style={{
          backgroundColor: `${themeBg}CC`,
        }}
      >
        <div className="mx-auto max-w-md w-full px-4 py-3 flex items-center gap-3">
          {/* Logo */}
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={restaurant.name}
              className="h-10 w-10 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${themePrimary}20` }}
            >
              <CubeIcon className="h-6 w-6" style={{ color: themePrimary }} />
            </div>
          )}
          
          {/* Restaurant Name, Branch Name & Table Info */}
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-white truncate">
              {restaurant.name}
            </div>
            <div className="text-xs text-white/60 truncate">
              {branch.name} • {tableLabel}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setIsCategoryDrawerOpen(true)}
              aria-label="Kategoriler"
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all active:scale-95"
              style={{ color: themePrimary }}
            >
              <Menu size={20} strokeWidth={2.5} />
            </button>

            {/* Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Ara"
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all active:scale-95"
              style={{ color: themePrimary }}
            >
              <Search size={20} strokeWidth={2.5} />
            </button>

            {/* Social/Share Button */}
            <button
              type="button"
              onClick={() => setIsReviewSheetOpen(true)}
              aria-label="Yorum & Sosyal"
              data-testid="social-header-button"
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all active:scale-95"
              style={{ color: '#ffffff' }}
            >
              <Share2 size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto">
      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: themeBg }}
          >
            <div className="text-center px-6">
              {logoUrl ? (
                <motion.img
                  src={logoUrl}
                  alt={restaurant.name}
                  className="h-32 sm:h-40 md:h-48 mx-auto mb-6 object-contain"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{ maxHeight: '192px' }}
                />
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    <CubeIcon className="h-24 w-24 sm:h-32 sm:w-32 mx-auto mb-6" style={{ color: themePrimary }} />
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: themePrimary }}>
                      {restaurant.name}
                    </h1>
                  </motion.div>
                </>
              )}
              <motion.h2
                className="text-2xl sm:text-3xl font-semibold mb-4"
                style={{ color: themePrimary }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Hoş Geldiniz
              </motion.h2>
              {tableInfo?.table_no || tableNumber ? (
                <motion.p
                  style={{ color: themePrimary, opacity: 0.72 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.72 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-lg sm:text-xl"
                >
                  Masa {tableInfo?.table_no || tableNumber}
                </motion.p>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single-page menu: category grid + all sections (scroll-to-section, no filtering) */}
      {isMenuVisible && (
        <div className="mx-auto max-w-md w-full px-4 py-6 space-y-10">
          {/* Category cards (2x2) - click scrolls to section */}
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60">Henüz kategori bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => {
                const categoryProducts = products.filter(
                  (p) => p.category_id === category.id
                );
                const productCount = categoryProducts.length;
                
                return (
                  <motion.button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      scrollToCategory(category.id);
                    }}
                    className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 shadow-sm aspect-[4/5] flex flex-col group"
                    whileHover={{ 
                      scale: 1.03,
                      y: -6,
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 25 
                    }}
                    style={{
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    {/* Background Image with Subtle Zoom */}
                    {category.image_url ? (
                      <>
                        <motion.div 
                          className="absolute inset-0"
                          whileHover={{ scale: 1.08 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        >
                          <CategoryImage
                            path={category.image_url}
                            alt={category.name}
                            className="w-full h-full object-cover"
                            style={{ opacity: 0.9 }}
                          />
                        </motion.div>
                        {/* Subtle shine overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    ) : (
                      <div 
                        className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent"
                        style={{
                          backgroundImage: `
                            radial-gradient(circle at 20% 50%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(212, 175, 55, 0.05) 0%, transparent 50%)
                          `,
                        }}
                      />
                    )}
                    
                    {/* Bottom Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
                    
                    {/* Glowing Border - Thin Bright Frame */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      initial={{ 
                        border: '1px solid transparent',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      }}
                      whileHover={{ 
                        border: `1px solid ${themePrimary}40`,
                        boxShadow: `
                          0 0 20px ${themePrimary}40,
                          0 0 40px ${themePrimary}30,
                          0 0 60px ${themePrimary}20,
                          0 8px 32px rgba(0, 0, 0, 0.5),
                          inset 0 0 20px ${themePrimary}10
                        `,
                      }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                    
                    {/* Outer Glow Effect - Technology Vibe */}
                    <motion.div
                      className="absolute -inset-1 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100"
                      style={{
                        background: `radial-gradient(circle, ${themePrimary}30 0%, transparent 70%)`,
                        filter: 'blur(12px)',
                      }}
                      transition={{ duration: 0.4 }}
                    />
                    
                    {/* Inner Glow Ring */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      initial={{ 
                        boxShadow: 'inset 0 0 0 0 rgba(255, 255, 255, 0)',
                      }}
                      whileHover={{ 
                        boxShadow: `inset 0 0 30px 1px ${themePrimary}20`,
                      }}
                      transition={{ duration: 0.4 }}
                    />
                    
                    {/* Badge */}
                    <div 
                      className="absolute top-2 right-2 bg-black/55 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-semibold z-10 group-hover:bg-black/70 transition-colors duration-300"
                      style={{ color: themePrimary }}
                    >
                      {productCount} Ürün
                    </div>
                    
                    {/* Content */}
                    <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-0.5 z-10">
                      <h2 
                        className="text-base font-bold leading-tight group-hover:scale-105 transition-transform duration-300"
                        style={{ color: themePrimary }}
                      >
                        {category.name}
                      </h2>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Search results (when searching) */}
          {searchQuery && (
            <div className="container mx-auto">
              <div className="mb-4 flex items-center gap-2">
                <Search className="h-5 w-5" style={{ color: themePrimary }} />
                <span style={{ color: themePrimary }}>&quot;{searchQuery}&quot; için {filteredProducts.length} sonuç</span>
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-auto p-2 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: themePrimary }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-white/60">Arama sonucu bulunamadı.</p>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <ClassicThemeProductCard
                      key={product.id}
                      product={product}
                      themePrimary={themePrimary}
                      themeCard={themeCard}
                      onSelect={() => {
                        setSelectedItem(product.id);
                        onItemView?.(product.id);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* All category sections (single-page scroll targets) */}
          <div className="container mx-auto">
            {categories.map((category) => {
              const categoryProducts = products.filter((p) => p.category_id === category.id);
              if (categoryProducts.length === 0) return null;
              // If a category is selected, only render that category's section
              if (selectedCategory && category.id !== selectedCategory) return null;
              return (
                <section
                  key={category.id}
                  id={`category-${category.id}`}
                  className="scroll-mt-6 py-6"
                >
                  <h2 className="text-xl font-bold mb-4" style={{ color: themePrimary }}>
                    {category.name}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryProducts.map((product) => (
                      <ClassicThemeProductCard
                        key={product.id}
                        product={product}
                        themePrimary={themePrimary}
                        themeCard={themeCard}
                        onSelect={() => {
                          setSelectedItem(product.id);
                          onItemView?.(product.id);
                        }}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* Legal Info Footer - Inside scrollable content */}
      {restaurant && (
        <div className="px-4 pb-24 md:pb-12 pt-6">
          <MenuLegalInfo
            includeVAT={restaurant.include_vat ?? true}
            hasServiceFee={restaurant.has_service_fee ?? false}
            hasCoverCharge={restaurant.has_cover_charge ?? false}
            themePrimary={themePrimary}
            themeText={themeText}
          />
          
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
              style={{ color: themePrimary }}
            />
            
            {/* Text Content */}
            <p className="text-center text-xs md:text-sm flex items-center gap-1.5 flex-wrap justify-center" style={{ color: themeText }}>
              <span style={{ opacity: 0.75 }}>
                Digital Menu System by{' '}
              </span>
              <a
                href="https://chaosarmenu.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline transition-all"
                style={{ 
                  color: themePrimary,
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
      )}
      </main>

      {/* Category Drawer - Premium Version with Icons */}
      <AnimatePresence>
        {isCategoryDrawerOpen && (
          <>
            {/* Enhanced Backdrop with Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryDrawerOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />
            
            {/* Drawer with Glassmorphism */}
            <motion.div
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 right-0 max-h-[85vh] z-50 overflow-y-auto rounded-b-3xl"
              style={{
                backgroundColor: `${themeBg}ee`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: `2px solid ${themePrimary}30`,
                boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px ${themePrimary}10`,
              }}
            >
              <div className="p-6 pb-8">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: `${themePrimary}20` }}>
                  <div>
                    <h2 className="text-2xl font-bold mb-1" style={{ color: themePrimary }}>
                      Kategoriler
                    </h2>
                    <p className="text-xs" style={{ color: themeText, opacity: 0.6 }}>
                      {categories.length} kategori
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCategoryDrawerOpen(false)}
                    className="p-2.5 rounded-xl hover:bg-white/10 transition-all duration-300 group relative"
                    style={{ color: themePrimary }}
                  >
                    <div 
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: `radial-gradient(circle, ${themePrimary}20 0%, transparent 70%)`,
                        filter: 'blur(8px)',
                      }}
                    />
                    <X className="h-5 w-5 relative z-10" />
                  </button>
                </div>

                {/* Category List with Stagger Animation */}
                <div className="space-y-3">
                  {/* All Categories Button - Enhanced */}
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => {
                      setSelectedCategory(null);
                      setIsCategoryDrawerOpen(false);
                      scrollToCategory(null);
                    }}
                    className={`
                      relative w-full text-left px-5 py-4 rounded-xl font-bold text-sm uppercase
                      transition-all duration-300 border-2 overflow-hidden group
                    `}
                    style={{
                      backgroundColor: !selectedCategory && !searchQuery 
                        ? themePrimary 
                        : 'transparent',
                      borderColor: themePrimary,
                      color: !selectedCategory && !searchQuery ? '#1a1a1a' : themePrimary,
                      boxShadow: !selectedCategory && !searchQuery
                        ? `0 4px 20px ${themePrimary}30, inset 0 0 20px ${themePrimary}10`
                        : 'none',
                    }}
                    whileHover={{
                      scale: 1.02,
                      backgroundColor: !selectedCategory && !searchQuery 
                        ? themePrimary 
                        : `${themePrimary}15`,
                      boxShadow: `0 4px 20px ${themePrimary}25, inset 0 0 20px ${themePrimary}10`,
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Glow Effect */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: `radial-gradient(circle at center, ${themePrimary}30 0%, transparent 70%)`,
                        filter: 'blur(12px)',
                      }}
                    />
                    
                    {/* Content */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Grid3x3 
                          className="h-5 w-5 flex-shrink-0" 
                          style={{ color: !selectedCategory && !searchQuery ? '#1a1a1a' : themePrimary }}
                        />
                        <span>Tümü</span>
                      </div>
                      <span 
                        className="text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"
                        style={{
                          backgroundColor: !selectedCategory && !searchQuery 
                            ? 'rgba(0, 0, 0, 0.2)' 
                            : `${themePrimary}20`,
                          color: !selectedCategory && !searchQuery ? '#1a1a1a' : themePrimary,
                          border: `1px solid ${themePrimary}40`,
                        }}
                      >
                        {products.length}
                      </span>
                    </div>
                  </motion.button>

                  {/* Category Buttons - Enhanced with Icons */}
                  {categories.map((category, index) => {
                    const isActive = selectedCategory === category.id;
                    const categoryProducts = products.filter(
                      (p) => p.category_id === category.id
                    );
                    const productCount = categoryProducts.length;

                    // Icon selection based on category name
                    const getCategoryIcon = (categoryName: string) => {
                      const name = categoryName.toLowerCase();
                      if (name.includes('ana') || name.includes('yemek') || name.includes('main')) {
                        return <Utensils className="h-5 w-5 flex-shrink-0" />;
                      } else if (name.includes('tatlı') || name.includes('dessert') || name.includes('sweet')) {
                        return <IceCream className="h-5 w-5 flex-shrink-0" />;
                      } else if (name.includes('ara') || name.includes('sıcak') || name.includes('appetizer') || name.includes('starter')) {
                        return <Flame className="h-5 w-5 flex-shrink-0" />;
                      } else if (name.includes('içecek') || name.includes('drink') || name.includes('beverage')) {
                        return <Coffee className="h-5 w-5 flex-shrink-0" />;
                      } else if (name.includes('salata') || name.includes('salad')) {
                        return <ChefHat className="h-5 w-5 flex-shrink-0" />;
                      } else if (name.includes('pasta') || name.includes('cake')) {
                        return <Cake className="h-5 w-5 flex-shrink-0" />;
                      } else {
                        return <Utensils className="h-5 w-5 flex-shrink-0" />;
                      }
                    };

                    return (
                      <motion.button
                        key={category.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + (index * 0.05) }}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setIsCategoryDrawerOpen(false);
                          scrollToCategory(category.id);
                        }}
                        className={`
                          relative w-full text-left px-5 py-4 rounded-xl font-bold text-sm uppercase
                          transition-all duration-300 border-2 overflow-hidden group
                        `}
                        style={{
                          backgroundColor: isActive ? themePrimary : 'transparent',
                          borderColor: themePrimary,
                          color: isActive ? '#1a1a1a' : themePrimary,
                          boxShadow: isActive 
                            ? `0 4px 20px ${themePrimary}30, inset 0 0 20px ${themePrimary}10`
                            : 'none',
                        }}
                        whileHover={{
                          scale: 1.02,
                          backgroundColor: isActive ? themePrimary : `${themePrimary}15`,
                          boxShadow: `0 4px 20px ${themePrimary}25, inset 0 0 20px ${themePrimary}10`,
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Glow Effect */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            background: `radial-gradient(circle at center, ${themePrimary}30 0%, transparent 70%)`,
                            filter: 'blur(12px)',
                          }}
                        />
                        
                        {/* Content */}
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="p-1.5 rounded-lg transition-all duration-300 group-hover:scale-110"
                              style={{
                                backgroundColor: isActive 
                                  ? 'rgba(0, 0, 0, 0.15)' 
                                  : `${themePrimary}15`,
                              }}
                            >
                              {getCategoryIcon(category.name)}
                            </div>
                            <span>{category.name}</span>
                          </div>
                          <span 
                            className="text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"
                            style={{
                              backgroundColor: isActive 
                                ? 'rgba(0, 0, 0, 0.2)' 
                                : `${themePrimary}20`,
                              color: isActive ? '#1a1a1a' : themePrimary,
                              border: `1px solid ${themePrimary}40`,
                            }}
                          >
                            {productCount}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsSearchOpen(false);
                if (!searchQuery) {
                  setSearchQuery("");
                }
              }}
              className="fixed inset-0 bg-black/60 z-40"
            />
            
            {/* Search Input */}
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 right-0 z-50 p-4"
              style={{ backgroundColor: themeBg }}
            >
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 shrink-0" style={{ color: themePrimary }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ürün ara..."
                    autoFocus
                    className="flex-1 px-4 py-3 rounded-lg border-2 bg-transparent text-white placeholder-white/50 focus:outline-none"
                    style={{
                      borderColor: themePrimary,
                      color: themePrimary,
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    style={{ color: themePrimary }}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {searchQuery && (
                  <div className="mt-2 text-sm" style={{ color: themePrimary, opacity: 0.7 }}>
                    {filteredProducts.length} sonuç bulundu
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Detail Modal - Fixed overlay (outside scrollable main) */}
      <AnimatePresence>
        {selectedItem && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-[#0F0F0F] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md sm:w-[90%] max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Product Image */}
              <div className="relative w-full h-64 sm:h-72 overflow-hidden">
                {selectedProduct.image_path || selectedProduct.image_url ? (
                  <>
                    <ProductImage 
                      path={selectedProduct.image_path} 
                      legacyUrl={selectedProduct.image_url}
                      alt={selectedProduct.name} 
                      className="w-full h-full object-cover"
                      style={{ backgroundColor: themeCard }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
                  </>
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: themeCard }}
                  >
                    <span style={{ color: themePrimary, opacity: 0.5 }}>No Image</span>
                  </div>
                )}
                
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="bg-black/60 backdrop-blur-sm text-white p-2.5 rounded-full hover:bg-black/80 transition-all shadow-lg"
                    aria-label="Kapat"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  
                  <div 
                    className="px-4 py-2 rounded-full backdrop-blur-sm shadow-lg font-bold text-lg"
                    style={{
                      backgroundColor: `${themePrimary}E6`,
                      color: themeBg,
                    }}
                  >
                    {selectedProduct.effectivePrice.toFixed(0)} ₺
                    {selectedProduct.effectivePrice !== selectedProduct.price && (
                      <span className="ml-1 text-sm line-through opacity-70">
                        {selectedProduct.price.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-6 pt-6 pb-24 space-y-6">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                      {selectedProduct.name}
                    </h2>
                    {selectedProduct.description && (
                      <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                        {selectedProduct.description}
                      </p>
                    )}
                  </div>

                  <div className="h-px bg-gray-800" />

                  {/* Ingredients */}
                  {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                        İçindekiler
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.ingredients.map((ingredient, idx) => {
                          const getIngredientEmoji = (ing: string): string => {
                            const lower = ing.toLowerCase();
                            if (lower.includes('tavuk') || lower.includes('chicken')) return '🍗';
                            if (lower.includes('peynir') || lower.includes('cheese')) return '🧀';
                            if (lower.includes('marul') || lower.includes('lettuce')) return '🥬';
                            if (lower.includes('sos') || lower.includes('sauce')) return '🥫';
                            if (lower.includes('domates') || lower.includes('tomato')) return '🍅';
                            if (lower.includes('soğan') || lower.includes('onion')) return '🧅';
                            if (lower.includes('ekmek') || lower.includes('bread')) return '🍞';
                            if (lower.includes('et') || lower.includes('meat') || lower.includes('beef')) return '🥩';
                            if (lower.includes('balık') || lower.includes('fish')) return '🐟';
                            if (lower.includes('sebze') || lower.includes('vegetable')) return '🥕';
                            if (lower.includes('salata') || lower.includes('salad')) return '🥗';
                            if (lower.includes('patates') || lower.includes('potato')) return '🥔';
                            return '✨';
                          };
                          
                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border"
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                color: '#E5E5E5',
                              }}
                            >
                              <span>{getIngredientEmoji(ingredient)}</span>
                              <span>{ingredient}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Allergens */}
                  {selectedProduct.allergens && selectedProduct.allergens.length > 0 && (
                    <>
                      <div className="h-px bg-gray-800" />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                          Alerjenler
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {getAllergensByKeys(selectedProduct.allergens).map((allergen) => (
                            <span
                              key={allergen.key}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border"
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                color: '#E5E5E5',
                              }}
                            >
                              <span>{allergen.icon}</span>
                              <span>{allergen.label}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Recommended Sides */}
                  {(recommendedItems.length > 0 || getRecommendedSidesDisplay(
                    (selectedProduct.recommended_sides_source || 'auto') as 'auto' | 'manual',
                    selectedProduct.recommended_sides || null,
                    selectedProduct.recommended_sides_auto || null
                  )) && (
                    <>
                      <div className="h-px bg-gray-800" />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                          Yanında İyi Gider
                        </h3>
                        
                        {getRecommendedSidesDisplay(
                          (selectedProduct.recommended_sides_source || 'auto') as 'auto' | 'manual',
                          selectedProduct.recommended_sides || null,
                          selectedProduct.recommended_sides_auto || null
                        ) && (
                          <div className="mb-4">
                            <p className="text-base text-gray-200 leading-relaxed">
                              {getRecommendedSidesDisplay(
                                (selectedProduct.recommended_sides_source || 'auto') as 'auto' | 'manual',
                                selectedProduct.recommended_sides || null,
                                selectedProduct.recommended_sides_auto || null
                              )}
                            </p>
                          </div>
                        )}

                        {recommendedItems.length > 0 && (
                          <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                            {recommendedItems.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => setSelectedItem(item.id)}
                                className="flex-shrink-0 w-28 sm:w-32 rounded-xl p-3 text-left transition-all hover:opacity-90 active:scale-95"
                                style={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                              >
                                {item.image_path || item.image_url ? (
                                  <ProductImage
                                    path={item.image_path}
                                    legacyUrl={item.image_url}
                                    alt={item.name}
                                    className="w-full h-20 mb-2 rounded-lg overflow-hidden"
                                    style={{ backgroundColor: themeCard }}
                                  />
                                ) : (
                                  <div
                                    className="w-full h-20 mb-2 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                  >
                                    <span className="text-xs text-gray-500">📷</span>
                                  </div>
                                )}
                                <p className="text-xs font-semibold mb-1 line-clamp-2 text-white">
                                  {item.name}
                                </p>
                                <p className="text-xs font-bold" style={{ color: themePrimary }}>
                                  {item.effectivePrice.toFixed(0)} ₺
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                </div>
              </div>

              {/* Fixed Bottom Section */}
              <div className="border-t border-gray-800 bg-[#0F0F0F] px-6 py-4 space-y-3">
                {selectedProduct.has_ar && (selectedProduct.model_glb || selectedProduct.ar_model_glb || selectedProduct.model_usdz || selectedProduct.ar_model_usdz) ? (
                  (() => {
                    const usdzUrl = getUSDZUrl(selectedProduct);
                    const isIOSDevice = typeof window !== 'undefined' && (
                      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
                    );
                    if (isIOSDevice && usdzUrl) {
                      return (
                        <button
                          type="button"
                          onClick={() => openARWithBlob(usdzUrl, arPosterUrl || undefined)}
                          className="w-full py-4 px-6 rounded-xl font-semibold text-base transition-all active:scale-98 shadow-lg"
                          style={{ background: `linear-gradient(135deg, ${themePrimary}, ${themePrimary}DD)`, color: themeBg }}
                        >
                          Masada Gör
                        </button>
                      );
                    }
                    return (
                      <button
                        onClick={handleARClick}
                        className="w-full py-4 px-6 rounded-xl font-semibold text-base transition-all active:scale-98 shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${themePrimary}, ${themePrimary}DD)`, color: themeBg }}
                      >
                        Masada Gör
                      </button>
                    );
                  })()
                ) : (
                  <button
                    disabled
                    className="w-full py-4 px-6 rounded-xl font-semibold text-base opacity-50 cursor-not-allowed"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#666',
                    }}
                    title="Bu ürün AR desteğine sahip değil"
                  >
                    Masada Gör
                  </button>
                )}

                <p className="text-[10px] text-gray-500 text-center leading-relaxed px-2">
                  Alerjen uyarısı: Ürünlerimiz alerjen içerebilir. Alerjiniz varsa lütfen sipariş öncesinde bildiriniz.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AR Viewer Modal */}
      <AnimatePresence>
        {arOpen && selectedProduct && (
          <ARViewer
            open={arOpen}
            onClose={() => setArOpen(false)}
            glbSrc={selectedProduct.model_glb || selectedProduct.ar_model_glb || undefined}
            usdzSrc={selectedProduct.model_usdz || selectedProduct.ar_model_usdz || undefined}
            posterSrc={arPosterUrl || undefined}
          />
        )}
      </AnimatePresence>

      {/* Review and Social Sheet */}
      {restaurant && branchSocial && (
        <ReviewAndSocialSheet
          isOpen={isReviewSheetOpen}
          onClose={() => setIsReviewSheetOpen(false)}
          restaurantName={restaurant.name}
          googleReviewUrl={branchSocial.google_review_url || null}
          googleRating={null}
          googleReviewCount={null}
          instagramUrl={branchSocial.instagram_url || null}
          tiktokUrl={branchSocial.tiktok_url || null}
          twitterUrl={branchSocial.x_url || null}
          themePrimary={themePrimary}
          themeBg={themeBg}
        />
      )}
    </div>
  );
}
