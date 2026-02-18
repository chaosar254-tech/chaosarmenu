"use client";

// Force dynamic rendering and disable caching for this route
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { ClassicTheme } from "@/components/templates/ClassicTheme";
import { ModernTheme } from "@/components/templates/ModernTheme";

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
  ingredients?: string[] | null;
  recommended_item_ids?: string[] | null;
  allergens?: string[] | null;
  recommended_sides?: string | null;
  recommended_sides_auto?: string | null;
  recommended_sides_source?: 'auto' | 'manual';
  is_available?: boolean;
}

type SupportedLang = 'tr' | 'en' | 'ar';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  logo_path: string | null;
  cover_image?: string | null;
  template_id?: string | null;
  theme_primary?: string | null;
  theme_secondary?: string | null;
  theme_bg?: string | null;
  theme_card?: string | null;
  theme_text?: string | null;
  primary_color?: string | null;
  background_color?: string | null;
  card_color?: string | null;
  text_color?: string | null;
  include_vat?: boolean | null;
  has_service_fee?: boolean | null;
  has_cover_charge?: boolean | null;
  service_fee_amount?: number | null;
  allergen_disclaimer?: string | null;
  allergen_info?: string | null;
  supported_languages?: SupportedLang[] | null;
}

interface BranchSocial {
  google_review_url?: string | null;
  google_place_id?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  x_url?: string | null;
  website_url?: string | null;
}

function normalizeSupportedLanguages(raw: unknown): SupportedLang[] {
  const defaultLangs: SupportedLang[] = ['tr', 'en', 'ar'];
  if (raw == null) return defaultLangs;
  if (Array.isArray(raw)) {
    const valid = raw.filter((c): c is SupportedLang => c === 'tr' || c === 'en' || c === 'ar');
    return valid.length > 0 ? valid : defaultLangs;
  }
  return defaultLangs;
}

export default function MenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  // Safely extract params - handle both array and object formats
  const restaurantSlug = (Array.isArray(params.restaurantSlug) 
    ? params.restaurantSlug[0] 
    : params.restaurantSlug) as string;
  const branchSlug = (Array.isArray(params.branchSlug) 
    ? params.branchSlug[0] 
    : params.branchSlug) as string;
  
  // Get table number from query param
  const table = searchParams?.get("table") || null;
  const tableNumber = table && 
                      table !== "genel" && 
                      table !== "general" && 
                      table.trim() !== "" && 
                      !isNaN(Number(table)) 
                      ? table 
                      : null;

  // Dev logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[Menu Page] Route params:', { 
      rawParams: params, 
      restaurantSlug, 
      branchSlug, 
      table, 
      tableNumber 
    })
  }

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branch, setBranch] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [branchSocial, setBranchSocial] = useState<BranchSocial | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableInfo, setTableInfo] = useState<{ table_no: string } | null>(null);
  
  // Splash screen state
  const [hasEntered, setHasEntered] = useState(false);
  const [language, setLanguage] = useState<'tr' | 'en' | 'ar'>('tr');

  // Supported languages from restaurant (default tr, en, ar)
  const supportedLangs = normalizeSupportedLanguages(restaurant?.supported_languages);

  // Sync language when restaurant loads: if current lang not in supported list, use first supported
  useEffect(() => {
    if (supportedLangs.length === 0) return;
    setLanguage((prev) => (supportedLangs.includes(prev) ? prev : supportedLangs[0]));
  }, [supportedLangs.join(',')]);

  // Helper to get table info from qr_slug (if table param is qr_slug)
  const getTableByQrSlug = async (qrSlug: string, branchId: string): Promise<string | null> => {
    try {
      const { data } = await supabase
        .from('restaurant_tables')
        .select('table_no')
        .eq('branch_id', branchId)
        .eq('qr_slug', qrSlug)
        .eq('is_active', true)
        .single()
      return data?.table_no || null
    } catch {
      return null
    }
  }

  // Load restaurant, branch, and menu data from Supabase
  useEffect(() => {
    const loadData = async () => {
      // Validate params are available and valid
      if (!restaurantSlug || !branchSlug || 
          restaurantSlug === 'undefined' || branchSlug === 'undefined' ||
          typeof restaurantSlug !== 'string' || typeof branchSlug !== 'string') {
        console.error('[Menu Page] Missing or invalid slugs:', { 
          restaurantSlug, 
          branchSlug,
          restaurantSlugType: typeof restaurantSlug,
          branchSlugType: typeof branchSlug,
          paramsKeys: Object.keys(params),
          fullParams: params
        });
        setError("Geçersiz URL parametreleri");
        setLoading(false);
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[Menu Page] Loading data for:', { restaurantSlug, branchSlug })
      }

      try {
        // Validate slugs before querying
        if (!restaurantSlug || typeof restaurantSlug !== 'string' || restaurantSlug.trim() === '') {
          console.error('[Menu Page] Invalid restaurant slug:', restaurantSlug);
          setError("Geçersiz restoran slug'ı");
          setLoading(false);
          return;
        }

        // Load restaurant (including template_id, color fields, legal info, contact, social, and cover_image)
        const { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("id, name, slug, logo_url, logo_path, cover_image, template_id, theme_primary, theme_secondary, theme_bg, theme_card, theme_text, primary_color, background_color, card_color, text_color, include_vat, has_service_fee, has_cover_charge, service_fee_amount, allergen_disclaimer, allergen_info, google_review_url, instagram_url, x_url, twitter_url, website_url, tiktok_url, google_rating, google_user_ratings_total, address, phone_number, supported_languages")
          .eq("slug", restaurantSlug.trim())
          .maybeSingle();

        if (restaurantError) {
          console.error('[Menu Page] Supabase error:', restaurantError);
          setError(`Veritabanı hatası: ${restaurantError.message}`);
          setLoading(false);
          return;
        }

        if (!restaurantData) {
          console.error('[Menu Page] Restaurant not found:', restaurantSlug);
          
          // Try to find all restaurants for debugging
          const { data: allRestaurants } = await supabase
            .from("restaurants")
            .select("slug, name")
            .limit(10);
          
          console.error('[Menu Page] Available restaurants:', allRestaurants);
          console.error('[Menu Page] Looking for slug:', restaurantSlug);
          
          setError(`Restoran bulunamadı: ${restaurantSlug}. Lütfen admin panelinden restaurant oluşturduğunuzdan ve slug'ın doğru olduğundan emin olun.`);
          setLoading(false);
          return;
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('[Menu Page] Restaurant found:', restaurantData.id, restaurantData.name, 'Template:', restaurantData.template_id)
        }

        setRestaurant(restaurantData);

        // Load branch (including address and phone)
        const { data: branchData, error: branchError } = await supabase
          .from("branches")
          .select("id, name, slug, address, phone")
          .eq("restaurant_id", restaurantData.id)
          .eq("slug", branchSlug.trim())
          .eq("is_active", true)
          .maybeSingle();

        if (branchError) {
          console.error('[Menu Page] Branch query error:', branchSlug, branchError);
          setError(`Şube sorgusu hatası: ${branchError.message}`);
          setLoading(false);
          return;
        }

        if (!branchData) {
          console.error('[Menu Page] Branch not found:', branchSlug, 'for restaurant:', restaurantData.id);
          setError(`Şube bulunamadı: ${branchSlug}`);
          setLoading(false);
          return;
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('[Menu Page] Branch found:', branchData.id, branchData.name)
        }

        setBranch(branchData);

        // Load branch social settings
        const { data: socialData } = await supabase
          .from("branch_social")
          .select("*")
          .eq("branch_id", branchData.id)
          .single();

        if (socialData) {
          setBranchSocial(socialData);
        }

        // If table param looks like a qr_slug (contains hyphens or is not numeric), try to resolve it
        if (table && table.includes('-')) {
          const resolvedTableNo = await getTableByQrSlug(table, branchData.id);
          if (resolvedTableNo) {
            setTableInfo({ table_no: resolvedTableNo });
          }
        } else if (tableNumber) {
          setTableInfo({ table_no: tableNumber });
        }

        // Log page view (if table info available)
        if (restaurantData.id) {
          await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurant_id: restaurantData.id,
              qr_id: null,
              event_type: 'page_view',
              meta: {
                branch_id: branchData.id,
                table_no: tableInfo?.table_no || tableNumber || null,
              },
            }),
          }).catch(() => {}) // Fail silently
        }

        // Load categories with translations
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("menu_categories")
          .select("id, name, name_en, name_ar, sort_order, is_active, image_url")
          .eq("restaurant_id", restaurantData.id)
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (categoriesError) {
          console.error("Categories error:", categoriesError);
        } else {
          setCategories(categoriesData || []);
        }

        // Load products with translations and branch overrides
        const { data: productsData, error: productsError } = await supabase
          .from("menu_items")
          .select("id, name, name_en, name_ar, price, description, description_en, description_ar, image_path, image_url, has_ar, category_id, is_active, sort_order, model_glb, model_usdz, ar_model_glb, ar_model_usdz, ingredients, recommended_item_ids, allergens, recommended_sides, recommended_sides_auto, recommended_sides_source")
          .eq("restaurant_id", restaurantData.id)
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (productsError) {
          console.error("Products error:", productsError);
        } else {
          // Load branch menu overrides
          const { data: overridesData } = await supabase
            .from("branch_menu_overrides")
            .select("*")
            .eq("branch_id", branchData.id);

          const overridesMap: Record<string, any> = {};
          overridesData?.forEach((override) => {
            overridesMap[override.menu_item_id] = override;
          });

          // Merge products with overrides to show effective prices and availability
          const productsWithOverrides: Product[] = (productsData || []).map((item) => {
            const override = overridesMap[item.id];
            return {
              ...item,
              effectivePrice: override?.price_override ?? item.price,
              is_available: override?.is_available !== false, // Default to true if no override
            };
          });

          // Filter out unavailable items
          setProducts(productsWithOverrides.filter(p => p.is_available !== false));
        }
      } catch (err) {
        console.error("Load error:", err);
        setError("Veri yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [restaurantSlug, branchSlug, table]);

  // Handle item view event logging
  const handleItemView = async (productId: string) => {
    if (restaurant && branch) {
      try {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurant_id: restaurant.id,
            qr_id: null,
            event_type: 'item_view',
            item_id: productId,
            meta: {
              branch_id: branch.id,
              table_no: tableInfo?.table_no || tableNumber || null,
            },
          }),
        })
      } catch (error) {
        console.error('[Analytics] Failed to log item_view:', error)
      }
    }
  };

  // Helper function to get storage URL for logo
  const getStorageUrl = (path: string | null, bucket: string) => {
    if (!path) return null;
    
    let cleanPath = path.trim().replace(/['"]/g, '').replace(/^\/+/, '');

    if (cleanPath.startsWith('http')) {
      if (cleanPath.includes('cdn.chaosarmenu.com')) {
         return cleanPath.replace('https://cdn.chaosarmenu.com', process.env.NEXT_PUBLIC_SUPABASE_URL || '');
      }
      return cleanPath;
    }

    if (cleanPath.startsWith(bucket + '/')) {
        cleanPath = cleanPath.replace(bucket + '/', '');
    }

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
    if (!baseUrl) {
      console.warn('NEXT_PUBLIC_SUPABASE_URL is not set');
      return null;
    }
    return `${baseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
  };

  // Get logo URL for splash screen
  const logoPath = restaurant?.logo_path || restaurant?.logo_url || null;
  const logoUrl = logoPath ? getStorageUrl(logoPath, 'menu_logos') : null;
  const primaryColor = restaurant?.primary_color || '#C09636';
  const luxuryGold = '#D4AF37'; // Premium gold color for splash screen (fallback)
  const bgColor = restaurant?.background_color || '#0F172A'; // Deep charcoal/navy for premium look
  const splashBgColor = bgColor === '#1A1A1A' || bgColor === '#2d304c' ? '#0F172A' : bgColor; // Ensure deep background
  // Dynamic text color from restaurant settings, fallback to luxuryGold for visibility
  const textColor = restaurant?.text_color || luxuryGold;

  // Determine which theme to render (default to Classic if template_id is null or not 'modern')
  const isModernTheme = restaurant?.template_id === 'modern';

  // Determine text direction for splash screen
  const splashTextDirection = language === 'ar' ? 'rtl' : 'ltr';

  // Table welcome display: "Masa X" or "Bahçe X" from URL param (B-prefix = Bahçe)
  const splashTableDisplayText = (() => {
    if (!table || table === 'genel' || table === 'general' || table.trim() === '') return null;
    const t = table.trim();
    if (t.toUpperCase().startsWith('B')) {
      const numPart = t.slice(1).trim();
      return numPart ? `Bahçe ${numPart}` : null;
    }
    if (tableNumber) return `Masa ${tableNumber}`;
    if (tableInfo?.table_no) return `Masa ${tableInfo.table_no}`;
    return null;
  })();

  // Get allergen warning text (with default fallback)
  const getAllergenWarning = (): string => {
    const allergenText = restaurant?.allergen_info || restaurant?.allergen_disclaimer;
    if (allergenText && allergenText.trim() !== '') {
      return allergenText;
    }
    // Default allergen warning
    if (language === 'tr') {
      return 'Alerjen uyarısı: Ürünlerimiz alerjen içerebilir. Alerjiniz varsa lütfen sipariş öncesinde bildiriniz.';
    } else if (language === 'ar') {
      return 'تحذير الحساسية: قد تحتوي منتجاتنا على مسببات الحساسية. إذا كان لديك حساسية، يرجى إبلاغنا قبل الطلب.';
    } else {
      return 'Allergen warning: Our products may contain allergens. If you have allergies, please inform us before ordering.';
    }
  };

  // Splash Screen Component
  const SplashScreen = () => (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ backgroundColor: splashBgColor }}
      dir={splashTextDirection}
      onClick={() => setHasEntered(true)}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mb-8"
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={restaurant?.name || 'Restaurant'}
            className="w-48 h-48 md:w-64 md:h-64 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
            <h1 className="text-4xl md:text-6xl font-bold" style={{ color: textColor }}>
              {restaurant?.name || 'Restaurant'}
            </h1>
          </div>
        )}
      </motion.div>

      {/* Table / Area Welcome Message (Masa X or Bahçe X) */}
      {splashTableDisplayText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-8"
        >
          <p
            className="text-lg md:text-xl font-semibold text-center"
            style={{
              color: textColor,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.05em',
            }}
          >
            {language === 'tr'
              ? `${splashTableDisplayText}'e Hoşgeldiniz`
              : language === 'ar'
              ? `مرحباً بك في ${splashTableDisplayText}`
              : `Welcome to ${splashTableDisplayText}`}
          </p>
        </motion.div>
      )}

      {/* Click to Start Text - Premium Serif Typography with Dynamic Text Color */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8
        }}
        className="text-sm md:text-base font-serif cursor-pointer mb-20"
        style={{ 
          color: textColor,
          letterSpacing: '0.15em',
          fontFamily: 'Georgia, "Times New Roman", serif'
        }}
      >
        {language === 'tr' ? 'BAŞLAMAK İÇİN TIKLAYIN' : language === 'ar' ? 'انقر للبدء' : 'CLICK TO START'}
      </motion.p>

      {/* Language Selector - only supported languages */}
      {supportedLangs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="absolute bottom-32 md:bottom-28 flex items-center gap-2 text-xs md:text-sm"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          onClick={(e) => e.stopPropagation()}
        >
          {supportedLangs.map((lang, i) => (
            <span key={lang} className="flex items-center gap-2">
              {i > 0 && <span style={{ color: textColor, opacity: 0.3 }}>•</span>}
              <button
                type="button"
                onClick={() => setLanguage(lang)}
                className="flex items-center gap-1.5 transition-all hover:opacity-80"
                style={{
                  color: textColor,
                  opacity: language === lang ? 1 : 0.5,
                  fontWeight: language === lang ? '500' : '300',
                }}
              >
                <span className="text-xs">
                  {lang === 'tr' ? '🇹🇷' : lang === 'en' ? '🇬🇧' : '🇸🇦'}
                </span>
                <span>{lang === 'tr' ? 'TR' : lang === 'en' ? 'EN' : 'AR'}</span>
              </button>
            </span>
          ))}
        </motion.div>
      )}

      {/* Legal Information - Bottom (Always show allergen, conditionally show VAT) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute bottom-10 w-full max-w-md px-6"
      >
        {/* Separator Line */}
        <div 
          className="w-full mb-2"
          style={{ 
            height: '0.5px',
            backgroundColor: textColor,
            opacity: 0.3
          }}
        />
        {/* Legal Text Container */}
        <div className="space-y-1">
          {/* VAT Info - Line 1 */}
          {restaurant?.include_vat && (
            <p 
              className="text-center"
              style={{ 
                fontSize: '10px',
                color: textColor,
                opacity: 0.8,
                letterSpacing: '0.05em',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                lineHeight: '1.4'
              }}
            >
              {language === 'tr' 
                ? 'Tüm fiyatlarımıza KDV dahildir.' 
                : language === 'ar'
                ? 'جميع الأسعار تشمل ضريبة القيمة المضافة.'
                : 'All prices include VAT.'}
            </p>
          )}
          {/* Allergen Warning - Line 2 (Always shown) */}
          <p 
            className="text-center"
            style={{ 
              fontSize: '10px',
              color: textColor,
              opacity: 0.8,
              letterSpacing: '0.05em',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: '1.4'
            }}
          >
            {getAllergenWarning()}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );

  // Show loading state
  if (loading || !restaurant) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: primaryColor }}></div>
          <p className="text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Render appropriate theme component
  // Themes handle their own loading/error states
  if (isModernTheme) {
    return (
      <>
        <AnimatePresence mode="wait">
          {!hasEntered ? (
            <SplashScreen key="splash" />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <ModernTheme
                restaurant={restaurant || { id: '', name: '', slug: '', logo_url: null, logo_path: null, cover_image: null }}
                branch={branch || { id: '', name: '', slug: '', address: null, phone: null }}
                branchSocial={branchSocial}
                categories={categories}
                products={products}
                tableNumber={tableNumber}
                loading={loading}
                initialLocale={language}
                supportedLanguages={normalizeSupportedLanguages(restaurant?.supported_languages)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Default to ClassicTheme (handles loading/error states internally)
  return (
    <>
      <AnimatePresence mode="wait">
        {!hasEntered ? (
          <SplashScreen key="splash" />
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ClassicTheme
              restaurant={restaurant || { id: '', name: '', slug: '', logo_url: null, logo_path: null, cover_image: null, include_vat: null, has_service_fee: null, has_cover_charge: null }}
              branch={branch || { id: '', name: '', slug: '' }}
              categories={categories}
              products={products}
              branchSocial={branchSocial}
              tableNumber={tableNumber}
              tableInfo={tableInfo}
              loading={loading}
              error={error}
              onItemView={handleItemView}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
