"use client";

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
  name_de?: string | null;
  name_fr?: string | null;
  sort_order: number;
  is_active: boolean;
  image_url?: string | null;
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

type SupportedLang = 'tr' | 'en' | 'ar' | 'de' | 'fr';

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

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
  sort_order: number;
  is_active: boolean;
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
    const valid = raw.filter((c): c is SupportedLang => c === 'tr' || c === 'en' || c === 'ar' || c === 'de' || c === 'fr');
    return valid.length > 0 ? valid : defaultLangs;
  }
  return defaultLangs;
}

// ✅ SplashScreen component dışarıda — her render'da yeniden oluşturulmaz
interface SplashScreenProps {
  bgColor: string;
  textColor: string;
  logoUrl: string | null;
  restaurantName: string;
  language: SupportedLang;
  setLanguage: (l: SupportedLang) => void;
  setHasEntered: (v: boolean) => void;
  supportedLangs: SupportedLang[];
  splashTableDisplayText: string | null;
  includeVat: boolean | null | undefined;
  allergenWarning: string;
}

function SplashScreen({
  bgColor, textColor, logoUrl, restaurantName,
  language, setLanguage, setHasEntered,
  supportedLangs, splashTableDisplayText,
  includeVat, allergenWarning,
}: SplashScreenProps) {
  const splashTextDirection = language === 'ar' ? 'rtl' : 'ltr';
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ backgroundColor: bgColor }}
      dir={splashTextDirection}
      onClick={() => setHasEntered(true)}
    >
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mb-8">
        {logoUrl ? (
          <img src={logoUrl} alt={restaurantName} className="w-48 h-48 md:w-64 md:h-64 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
            <h1 className="text-4xl md:text-6xl font-bold" style={{ color: textColor }}>{restaurantName}</h1>
          </div>
        )}
      </motion.div>

      {splashTableDisplayText && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="mb-8">
          <p className="text-lg md:text-xl font-semibold text-center"
            style={{ color: textColor, fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '0.05em' }}>
            {language === 'tr' ? `${splashTableDisplayText}'e Hoşgeldiniz`
              : language === 'ar' ? `مرحباً بك في ${splashTableDisplayText}`
              : language === 'de' ? `Willkommen bei ${splashTableDisplayText}`
              : language === 'fr' ? `Bienvenue à ${splashTableDisplayText}`
              : `Welcome to ${splashTableDisplayText}`}
          </p>
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        className="text-sm md:text-base font-serif cursor-pointer mb-20"
        style={{ color: textColor, letterSpacing: '0.15em', fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        {language === 'tr' ? 'BAŞLAMAK İÇİN TIKLAYIN' : language === 'ar' ? 'انقر للبدء' : language === 'de' ? 'KLICKEN SIE ZUM STARTEN' : language === 'fr' ? 'CLIQUEZ POUR COMMENCER' : 'CLICK TO START'}
      </motion.p>

      {supportedLangs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
          className="absolute bottom-32 md:bottom-28 flex items-center gap-2 text-xs md:text-sm"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          onClick={(e) => e.stopPropagation()}
        >
          {supportedLangs.map((lang, i) => (
            <span key={lang} className="flex items-center gap-2">
              {i > 0 && <span style={{ color: textColor, opacity: 0.3 }}>•</span>}
              <button type="button" onClick={() => setLanguage(lang)}
                className="flex items-center gap-1.5 transition-all hover:opacity-80"
                style={{ color: textColor, opacity: language === lang ? 1 : 0.5, fontWeight: language === lang ? '500' : '300' }}>
                <span className="text-xs">{lang === 'tr' ? '🇹🇷' : lang === 'en' ? '🇬🇧' : lang === 'ar' ? '🇸🇦' : lang === 'de' ? '🇩🇪' : '🇫🇷'}</span>
                <span>{lang === 'tr' ? 'TR' : lang === 'en' ? 'EN' : lang === 'ar' ? 'AR' : lang === 'de' ? 'DE' : 'FR'}</span>
              </button>
            </span>
          ))}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute bottom-10 w-full max-w-md px-6">
        <div className="w-full mb-2" style={{ height: '0.5px', backgroundColor: textColor, opacity: 0.3 }} />
        <div className="space-y-1">
          {includeVat && (
            <p className="text-center" style={{ fontSize: '10px', color: textColor, opacity: 0.8, letterSpacing: '0.05em', fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: '1.4' }}>
              {language === 'tr' ? 'Tüm fiyatlarımıza KDV dahildir.' : language === 'ar' ? 'جميع الأسعار تشمل ضريبة القيمة المضافة.' : language === 'de' ? 'Alle Preise verstehen sich inklusive MwSt.' : language === 'fr' ? 'Tous les prix incluent la TVA.' : 'All prices include VAT.'}
            </p>
          )}
          <p className="text-center" style={{ fontSize: '10px', color: textColor, opacity: 0.8, letterSpacing: '0.05em', fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: '1.4' }}>
            {allergenWarning}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const restaurantSlug = (Array.isArray(params.restaurantSlug)
    ? params.restaurantSlug[0]
    : params.restaurantSlug) as string;
  const branchSlug = (Array.isArray(params.branchSlug)
    ? params.branchSlug[0]
    : params.branchSlug) as string;

  const table = searchParams?.get("table") || null;
  const tableNumber = table &&
    table !== "genel" && table !== "general" &&
    table.trim() !== "" && !isNaN(Number(table))
    ? table : null;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branch, setBranch] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [branchSocial, setBranchSocial] = useState<BranchSocial | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableInfo, setTableInfo] = useState<{ table_no: string } | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [language, setLanguage] = useState<SupportedLang>('tr');
  const [cachedBgColor, setCachedBgColor] = useState('');
  const [cachedPrimaryColor, setCachedPrimaryColor] = useState('#C09636');
  const [colorsReady, setColorsReady] = useState(false);

  const supportedLangs = normalizeSupportedLanguages(restaurant?.supported_languages);

  useEffect(() => {
    const stored = localStorage.getItem(`bgColor_${restaurantSlug}`);
    if (stored) {
      setCachedBgColor(stored);
      setCachedPrimaryColor(localStorage.getItem(`primaryColor_${restaurantSlug}`) || '#C09636');
      setColorsReady(true);
    }
  }, [restaurantSlug]);

  useEffect(() => {
    if (supportedLangs.length === 0) return;
    setLanguage((prev) => (supportedLangs.includes(prev) ? prev : supportedLangs[0]));
  }, [supportedLangs.join(',')]);

  const getTableByQrSlug = async (qrSlug: string, branchId: string): Promise<string | null> => {
    try {
      const { data } = await supabase.from('restaurant_tables').select('table_no')
        .eq('branch_id', branchId).eq('qr_slug', qrSlug).eq('is_active', true).single();
      return data?.table_no || null;
    } catch { return null; }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!restaurantSlug || !branchSlug ||
        restaurantSlug === 'undefined' || branchSlug === 'undefined' ||
        typeof restaurantSlug !== 'string' || typeof branchSlug !== 'string') {
        setError("Geçersiz URL parametreleri");
        setLoading(false);
        setColorsReady(true);
        return;
      }

      try {
        const { data: colorData } = await supabase.from("restaurants")
          .select("background_color, primary_color, text_color")
          .eq("slug", restaurantSlug.trim()).maybeSingle();
        if (colorData?.background_color) {
          setCachedBgColor(colorData.background_color);
          localStorage.setItem(`bgColor_${restaurantSlug}`, colorData.background_color);
        }
        if (colorData?.primary_color) {
          setCachedPrimaryColor(colorData.primary_color);
          localStorage.setItem(`primaryColor_${restaurantSlug}`, colorData.primary_color);
        }
      } catch {}
      setColorsReady(true);

      try {
        const { data: restaurantData, error: restaurantError } = await supabase.from("restaurants")
          .select("id, name, slug, logo_url, logo_path, cover_image, template_id, theme_primary, theme_secondary, theme_bg, theme_card, theme_text, primary_color, background_color, card_color, text_color, include_vat, has_service_fee, has_cover_charge, service_fee_amount, allergen_disclaimer, allergen_info, google_review_url, instagram_url, x_url, twitter_url, website_url, tiktok_url, google_rating, google_user_ratings_total, address, phone_number, supported_languages")
          .eq("slug", restaurantSlug.trim()).maybeSingle();

        if (restaurantError) { setError(`Veritabanı hatası: ${restaurantError.message}`); setLoading(false); return; }
        if (!restaurantData) { setError(`Restoran bulunamadı: ${restaurantSlug}`); setLoading(false); return; }

        setRestaurant(restaurantData);
        if (restaurantData.background_color) {
          setCachedBgColor(restaurantData.background_color);
          localStorage.setItem(`bgColor_${restaurantSlug}`, restaurantData.background_color);
        }
        if (restaurantData.primary_color) {
          setCachedPrimaryColor(restaurantData.primary_color);
          localStorage.setItem(`primaryColor_${restaurantSlug}`, restaurantData.primary_color);
        }

        const { data: branchData, error: branchError } = await supabase.from("branches")
          .select("id, name, slug, address, phone")
          .eq("restaurant_id", restaurantData.id).eq("slug", branchSlug.trim()).eq("is_active", true).maybeSingle();

        if (branchError) { setError(`Şube sorgusu hatası: ${branchError.message}`); setLoading(false); return; }
        if (!branchData) { setError(`Şube bulunamadı: ${branchSlug}`); setLoading(false); return; }

        setBranch(branchData);

        const { data: socialData } = await supabase.from("branch_social").select("*").eq("branch_id", branchData.id).single();
        if (socialData) setBranchSocial(socialData);

        if (table && table.includes('-')) {
          const resolved = await getTableByQrSlug(table, branchData.id);
          if (resolved) setTableInfo({ table_no: resolved });
        } else if (tableNumber) {
          setTableInfo({ table_no: tableNumber });
        }

        if (restaurantData.id) {
          await fetch('/api/events', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ restaurant_id: restaurantData.id, qr_id: null, event_type: 'page_view',
              meta: { branch_id: branchData.id, table_no: tableInfo?.table_no || tableNumber || null } }),
          }).catch(() => {});
        }

        const { data: categoriesData } = await supabase.from("menu_categories")
          .select("id, name, name_en, name_ar, name_de, name_fr, sort_order, is_active, image_url")
          .eq("restaurant_id", restaurantData.id).eq("is_active", true).order("sort_order", { ascending: true });
        setCategories(categoriesData || []);

        // ✅ Alt kategorileri çek
        const { data: subcategoriesData } = await supabase.from("menu_subcategories")
          .select("id, name, category_id, sort_order, is_active")
          .eq("restaurant_id", restaurantData.id).eq("is_active", true)
          .order("sort_order", { ascending: true });
        setSubcategories(subcategoriesData || []);
        console.log('[DEBUG] subcategories:', subcategoriesData);

        const { data: productsData } = await supabase.from("menu_items")
          .select("id, name, name_en, name_ar, name_de, name_fr, price, description, description_en, description_ar, description_de, description_fr, image_path, image_url, has_ar, category_id, subcategory_id, is_active, sort_order, model_glb, model_usdz, ar_model_glb, ar_model_usdz, ingredients, recommended_item_ids, allergens, recommended_sides, recommended_sides_auto, recommended_sides_source")
          .eq("restaurant_id", restaurantData.id).eq("is_active", true).order("sort_order", { ascending: true });

        const { data: overridesData } = await supabase.from("branch_menu_overrides").select("*").eq("branch_id", branchData.id);
        const overridesMap: Record<string, any> = {};
        overridesData?.forEach((o) => { overridesMap[o.menu_item_id] = o; });

        const productsWithOverrides: Product[] = (productsData || []).map((item) => {
          const override = overridesMap[item.id];
          return { ...item, effectivePrice: override?.price_override ?? item.price, is_available: override?.is_available !== false };
        });
        setProducts(productsWithOverrides.filter(p => p.is_available !== false));
      } catch (err) {
        console.error("Load error:", err);
        setError("Veri yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [restaurantSlug, branchSlug, table]);

  const handleItemView = async (productId: string) => {
    if (restaurant && branch) {
      try {
        await fetch('/api/events', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurant_id: restaurant.id, qr_id: null, event_type: 'item_view', item_id: productId,
            meta: { branch_id: branch.id, table_no: tableInfo?.table_no || tableNumber || null } }),
        });
      } catch (e) { console.error('[Analytics] Failed to log item_view:', e); }
    }
  };

  const getStorageUrl = (path: string | null, bucket: string) => {
    if (!path) return null;
    let cleanPath = path.trim().replace(/['"]/g, '').replace(/^\/+/, '');
    if (cleanPath.startsWith('http')) {
      if (cleanPath.includes('cdn.chaosarmenu.com'))
        return cleanPath.replace('https://cdn.chaosarmenu.com', process.env.NEXT_PUBLIC_SUPABASE_URL || '');
      return cleanPath;
    }
    if (cleanPath.startsWith(bucket + '/')) cleanPath = cleanPath.replace(bucket + '/', '');
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
    if (!baseUrl) return null;
    return `${baseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
  };

  const bgColor = restaurant?.background_color || cachedBgColor || '#0F172A';
  const primaryColor = restaurant?.primary_color || cachedPrimaryColor || '#C09636';
  const luxuryGold = '#D4AF37';
  const textColor = restaurant?.text_color || luxuryGold;
  const isModernTheme = restaurant?.template_id === 'modern';
  const logoPath = restaurant?.logo_path || restaurant?.logo_url || null;
  const logoUrl = logoPath ? getStorageUrl(logoPath, 'menu_logos') : null;

  const splashTableDisplayText = (() => {
    if (!table || table === 'genel' || table === 'general' || table.trim() === '') return null;
    const t = table.trim();
    if (t.toUpperCase().startsWith('B')) { const n = t.slice(1).trim(); return n ? `Bahçe ${n}` : null; }
    if (tableNumber) return `Masa ${tableNumber}`;
    if (tableInfo?.table_no) return `Masa ${tableInfo.table_no}`;
    return null;
  })();

  const allergenWarning = (() => {
    const t = restaurant?.allergen_info || restaurant?.allergen_disclaimer;
    if (t && t.trim() !== '') return t;
    if (language === 'tr') return 'Alerjen uyarısı: Ürünlerimiz alerjen içerebilir. Alerjiniz varsa lütfen sipariş öncesinde bildiriniz.';
    if (language === 'ar') return 'تحذير الحساسية: قد تحتوي منتجاتنا على مسببات الحساسية. إذا كان لديك حساسية، يرجى إبلاغنا قبل الطلب.';
    if (language === 'de') return 'Allergenwarnung: Unsere Produkte können Allergene enthalten. Wenn Sie Allergien haben, informieren Sie uns bitte vor der Bestellung.';
    if (language === 'fr') return "Avertissement allergènes: Nos produits peuvent contenir des allergènes. Si vous avez des allergies, veuillez nous en informer avant de commander.";
    return 'Allergen warning: Our products may contain allergens. If you have allergies, please inform us before ordering.';
  })();

  // Splash'a geçilen props — her render'da aynı shape
  const splashProps: SplashScreenProps = {
    bgColor, textColor, logoUrl, restaurantName: restaurant?.name || '',
    language, setLanguage, setHasEntered,
    supportedLangs, splashTableDisplayText,
    includeVat: restaurant?.include_vat,
    allergenWarning,
  };

  if (!colorsReady) return null;

  // ✅ Tek AnimatePresence — splash her zaman aynı key ile aynı tree içinde
  const showSplash = loading || !restaurant || !hasEntered;

  return (
    <AnimatePresence mode="wait">
      {showSplash ? (
        <SplashScreen key="splash" {...splashProps} />
      ) : isModernTheme ? (
        <motion.div key="modern" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <ModernTheme
            restaurant={restaurant!}
            branch={branch || { id: '', name: '', slug: '', address: null, phone: null }}
            branchSocial={branchSocial}
            categories={categories}
            products={products}
            subcategories={subcategories}
            tableNumber={tableNumber}
            loading={false}
            initialLocale={language as 'tr' | 'en' | 'ar' | 'de' | 'fr'}
            supportedLanguages={normalizeSupportedLanguages(restaurant?.supported_languages)}
          />
        </motion.div>
      ) : (
        <motion.div key="classic" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <ClassicTheme
            restaurant={restaurant || { id: '', name: '', slug: '', logo_url: null, logo_path: null, cover_image: null, include_vat: null, has_service_fee: null, has_cover_charge: null }}
            branch={branch || { id: '', name: '', slug: '' }}
            categories={categories}
            products={products}
            branchSocial={branchSocial}
            tableNumber={tableNumber}
            tableInfo={tableInfo}
            loading={false}
            error={error}
            onItemView={handleItemView}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}