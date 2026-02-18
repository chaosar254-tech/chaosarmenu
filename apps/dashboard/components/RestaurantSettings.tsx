'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useActiveBranch } from '@/contexts/BranchContext'
import { BUCKET_MENU_LOGOS } from '@/lib/storage-constants'

type SupportedLangCode = 'tr' | 'en' | 'ar'

interface Restaurant {
  id: string
  name: string
  slug: string
  logo_path?: string | null
  cover_image?: string | null
  template_id?: string | null
  theme_primary?: string | null
  theme_bg?: string | null
  theme_card?: string | null
  theme_text?: string | null
  theme_mode?: string | null
  include_vat?: boolean | null
  has_service_fee?: boolean | null
  has_cover_charge?: boolean | null
  supported_languages?: SupportedLangCode[] | null
}

interface RestaurantSettingsProps {
  restaurant: Restaurant
  initialBranchId?: string | null
}

// Theme presets
const THEME_PRESETS = [
  {
    name: 'Altın (Varsayılan)',
    primary: '#D4AF37',
    bg: '#0B0B0F',
    card: '#15151B',
    text: '#F5F5F5',
    mode: 'dark',
  },
  {
    name: 'Mavi',
    primary: '#3B82F6',
    bg: '#0F172A',
    card: '#1E293B',
    text: '#F1F5F9',
    mode: 'dark',
  },
  {
    name: 'Yeşil',
    primary: '#10B981',
    bg: '#064E3B',
    card: '#065F46',
    text: '#D1FAE5',
    mode: 'dark',
  },
  {
    name: 'Kırmızı',
    primary: '#EF4444',
    bg: '#7F1D1D',
    card: '#991B1B',
    text: '#FEE2E2',
    mode: 'dark',
  },
  {
    name: 'Açık Tema',
    primary: '#2563EB',
    bg: '#FFFFFF',
    card: '#F3F4F6',
    text: '#111827',
    mode: 'light',
  },
]

export default function RestaurantSettings({ restaurant: initialRestaurant, initialBranchId }: RestaurantSettingsProps) {
  const { activeBranchId: contextBranchId } = useActiveBranch()
  
  // Use prop if provided, otherwise fall back to context (for backward compatibility)
  const activeBranchId = initialBranchId !== undefined ? initialBranchId : contextBranchId
  const [restaurant, setRestaurant] = useState(initialRestaurant)
  const [loading, setLoading] = useState(false)
  const [showSlugWarning, setShowSlugWarning] = useState(false)
  const [newSlug, setNewSlug] = useState(restaurant.slug)
  
  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPath, setLogoPath] = useState<string | null>(restaurant.logo_path || null)
  
  // Cover image state (safely initialized with optional chaining)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [coverImageUploading, setCoverImageUploading] = useState(false)
  const [coverImagePath, setCoverImagePath] = useState<string | null>((restaurant as any)?.cover_image || null)
  
  // Theme state
  const [themePrimary, setThemePrimary] = useState(restaurant.theme_primary || '#D4AF37')
  const [themeBg, setThemeBg] = useState(restaurant.theme_bg || '#0B0B0F')
  const [themeCard, setThemeCard] = useState(restaurant.theme_card || '#15151B')
  const [themeText, setThemeText] = useState(restaurant.theme_text || '#F5F5F5')
  const [themeMode, setThemeMode] = useState(restaurant.theme_mode || 'dark')
  const [themeFont, setThemeFont] = useState((restaurant as any).theme_font || 'Inter')
  const [themeBorderRadius, setThemeBorderRadius] = useState((restaurant as any).theme_border_radius || '12')
  const [themeShadow, setThemeShadow] = useState((restaurant as any).theme_shadow || 'lg')
  const [themeHover, setThemeHover] = useState((restaurant as any).theme_hover || themePrimary)
  
  // Menu template state
  const [templateId, setTemplateId] = useState<string>(restaurant.template_id || 'classic')
  
  // Legal info state
  const [includeVAT, setIncludeVAT] = useState(restaurant.include_vat ?? true)
  const [hasServiceFee, setHasServiceFee] = useState(restaurant.has_service_fee ?? false)
  const [serviceFeeAmount, setServiceFeeAmount] = useState<string>((restaurant as any).service_fee_amount?.toString() || '')
  const [hasCoverCharge, setHasCoverCharge] = useState(restaurant.has_cover_charge ?? false)
  const [allergenDisclaimer, setAllergenDisclaimer] = useState<string>((restaurant as any).allergen_disclaimer || '')

  // Dil ayarları: menüde gösterilecek diller (varsayılan tr, en, ar)
  const defaultLangs: SupportedLangCode[] = ['tr', 'en', 'ar']
  const initialLangs = Array.isArray((restaurant as any).supported_languages)
    ? (restaurant as any).supported_languages.filter((c: string) => ['tr', 'en', 'ar'].includes(c))
    : defaultLangs
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLangCode[]>(
    initialLangs.length > 0 ? initialLangs : defaultLangs
  )
  const toggleLanguage = (code: SupportedLangCode) => {
    setSupportedLanguages((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
      return next.length > 0 ? next : prev
    })
  }
  
  // Social media & review state
  const [googlePlaceId, setGooglePlaceId] = useState<string>('')
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string>('')
  const [instagramUrl, setInstagramUrl] = useState<string>('')
  const [tiktokUrl, setTiktokUrl] = useState<string>('')
  const [xUrl, setXUrl] = useState<string>('')
  const [googleRating, setGoogleRating] = useState<string>('')
  const [googleReviewCount, setGoogleReviewCount] = useState<string>('')
  const [socialLoading, setSocialLoading] = useState(false)
  const [fetchingRating, setFetchingRating] = useState(false)
  const [socialHasChanges, setSocialHasChanges] = useState(false)
  const [initialSocialData, setInitialSocialData] = useState<any>(null)
  const [placeIdError, setPlaceIdError] = useState<string>('')
  
  const router = useRouter()

  // Ensure restaurant.id exists, fetch if missing
  useEffect(() => {
    if (!restaurant.id) {
      console.warn('RestaurantSettings: restaurant.id is missing, fetching restaurant...')
      fetchRestaurant()
    } else {
      console.log('RestaurantSettings: restaurant.id =', restaurant.id)
    }
  }, [restaurant.id])

  // Fetch social media settings on mount and when branch changes
  useEffect(() => {
    if (activeBranchId) {
      const fetchData = async () => {
        try {
          const response = await fetch(`/api/branches/${activeBranchId}/social`)
          if (!response.ok) throw new Error('Failed to fetch branch social settings')

          const data = await response.json()
          const social = data.social || {}
          setGooglePlaceId(social.google_place_id || '')
          setGoogleReviewUrl(social.google_review_url || '')
          setInstagramUrl(social.instagram_url || '')
          setTiktokUrl(social.tiktok_url || '')
          setXUrl(social.x_url || '')
          // Note: Google rating/review count are not stored in branch_social, they're fetched separately
          setGoogleRating('')
          setGoogleReviewCount('')
          
          // Store initial data for change detection
          setInitialSocialData(social)
          setSocialHasChanges(false)
        } catch (error: any) {
          console.error('Error fetching branch social settings:', error)
          toast.error('Sosyal medya ayarları yüklenemedi')
        }
      }
      fetchData()
    } else {
      // Clear social data when no branch selected
      setGooglePlaceId('')
      setGoogleReviewUrl('')
      setInstagramUrl('')
      setTiktokUrl('')
      setXUrl('')
      setGoogleRating('')
      setGoogleReviewCount('')
      setInitialSocialData(null)
      setSocialHasChanges(false)
    }
  }, [activeBranchId])


  // Check for changes in social media fields
  useEffect(() => {
    if (!initialSocialData) return

    const hasChanges = 
      googlePlaceId !== (initialSocialData.google_place_id || '') ||
      googleReviewUrl !== (initialSocialData.google_review_url || '') ||
      instagramUrl !== (initialSocialData.instagram_url || '') ||
      tiktokUrl !== (initialSocialData.tiktok_url || '') ||
      xUrl !== (initialSocialData.x_url || '')

    setSocialHasChanges(hasChanges)
  }, [googlePlaceId, googleReviewUrl, instagramUrl, tiktokUrl, xUrl, initialSocialData])

  // Validate Place ID format
  const validatePlaceId = (placeId: string): string => {
    const trimmed = placeId.trim()
    
    if (!trimmed) {
      return '' // Empty is OK (optional field)
    }

    // Check if it's a URL (starts with http)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return 'Bu alan Place ID ister, link değil.'
    }

    // Must start with "ChIJ" and be at least 10 chars
    if (!trimmed.startsWith('ChIJ')) {
      return 'Place ID "ChIJ" ile başlamalıdır.'
    }

    if (trimmed.length < 10) {
      return 'Place ID en az 10 karakter olmalıdır.'
    }

    return '' // Valid
  }

  const handlePlaceIdChange = (value: string) => {
    setGooglePlaceId(value)
    const error = validatePlaceId(value)
    setPlaceIdError(error)
  }

  const handleFetchGoogleRating = async () => {
    const trimmed = googlePlaceId.trim()
    const error = validatePlaceId(trimmed)
    
    if (error) {
      setPlaceIdError(error)
      toast.error(error)
      return
    }

    if (!trimmed) {
      toast.error('Lütfen Google Place ID girin')
      return
    }

    setFetchingRating(true)
    setPlaceIdError('')
    
    try {
      const response = await fetch(`/api/google/place-details?placeId=${encodeURIComponent(trimmed)}`)
      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || 'Google Places API hatası')
      }

      // Update local state with fetched values
      // Only set if values are valid (> 0)
      if (data.rating !== null && data.rating !== undefined && Number(data.rating) > 0) {
        setGoogleRating(data.rating.toString())
      } else {
        setGoogleRating('')
      }
      
      if (data.reviewCount !== null && data.reviewCount !== undefined && Number(data.reviewCount) > 0) {
        setGoogleReviewCount(data.reviewCount.toString())
      } else {
        setGoogleReviewCount('')
      }

      toast.success(
        data.cached 
          ? 'Önbellekten alındı (son 24 saat içinde güncellendi)'
          : `Google puanı güncellendi: ${data.rating?.toFixed(1)} ⭐ (${data.reviewCount?.toLocaleString()} yorum)`
      )

      // Note: Google rating is fetched from Google API, not stored in branch_social
      // The rating/review count are just displayed, not persisted
    } catch (error: any) {
      console.error('Error fetching Google rating:', error)
      toast.error(error.message || 'Google puanı alınamadı')
      
      // Clear rating/review count on error (show "-" in UI)
      setGoogleRating('')
      setGoogleReviewCount('')
    } finally {
      setFetchingRating(false)
    }
  }

  const handleSocialSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    if (!activeBranchId) {
      toast.error('Lütfen önce bir şube seçin')
      return
    }
    
    setSocialLoading(true)

    // Normalize payload: empty strings -> null
    const payload = {
      google_place_id: googlePlaceId.trim() === '' ? null : googlePlaceId.trim(),
      google_review_url: googleReviewUrl.trim() === '' ? null : googleReviewUrl.trim(),
      instagram_url: instagramUrl.trim() === '' ? null : instagramUrl.trim(),
      tiktok_url: tiktokUrl.trim() === '' ? null : tiktokUrl.trim(),
      x_url: xUrl.trim() === '' ? null : xUrl.trim(),
    }

    console.log('[Client] PATCH /api/branches/[id]/social payload:', payload)

    try {
      const response = await fetch(`/api/branches/${activeBranchId}/social`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[Client] API error:', data)
        throw new Error(data.error || 'Ayarlar güncellenemedi')
      }

      console.log('[Client] API success:', data)
      toast.success('Sosyal medya ayarları başarıyla kaydedildi')
      
      // Refresh initial data by fetching again
      if (activeBranchId) {
        const refreshResponse = await fetch(`/api/branches/${activeBranchId}/social`)
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          const social = refreshData.social || {}
          setInitialSocialData(social)
          setSocialHasChanges(false)
        }
      }
      router.refresh()
    } catch (error: any) {
      console.error('[Client] Error saving social settings:', error)
      toast.error(error.message || 'Ayarlar kaydedilirken bir hata oluştu')
    } finally {
      setSocialLoading(false)
    }
  }

  const fetchRestaurant = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch restaurant data (without cover_image for backward compatibility until migration is run)
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, slug, logo_path, template_id, theme_primary, theme_bg, theme_card, theme_text, theme_mode, include_vat, has_service_fee, service_fee_amount, has_cover_charge, allergen_disclaimer, google_place_id, google_review_url, instagram_url, tiktok_url, x_url, twitter_url, google_rating, google_review_count, google_rating_updated_at, supported_languages')
        .eq('owner_user_id', user.id)
        .single()

      if (error) throw error
      if (data) {
        console.log('RestaurantSettings: fetched restaurant.id =', data.id)
        setRestaurant(data)
        setNewSlug(data.slug)
        setLogoPath(data.logo_path || null)
        // cover_image will be fetched separately if migration is run
        setCoverImagePath((data as any)?.cover_image || null)
        // Update theme state
        setThemePrimary(data.theme_primary || '#D4AF37')
        setThemeBg(data.theme_bg || '#0B0B0F')
        setThemeCard(data.theme_card || '#15151B')
        setThemeText(data.theme_text || '#F5F5F5')
        setThemeMode(data.theme_mode || 'dark')
        // Update template state
        setTemplateId(data.template_id || 'classic')
        // Update legal info state
        setIncludeVAT(data.include_vat ?? true)
        setHasServiceFee(data.has_service_fee ?? false)
        setHasCoverCharge(data.has_cover_charge ?? false)
        const langs = Array.isArray((data as any).supported_languages)
          ? (data as any).supported_languages.filter((c: string) => ['tr', 'en', 'ar'].includes(c))
          : defaultLangs
        setSupportedLanguages(langs.length > 0 ? langs : defaultLangs)
      }
    } catch (error: any) {
      console.error('RestaurantSettings: error fetching restaurant:', error)
      toast.error('Restoran bilgisi alınamadı')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    
    // Get theme values from form
    const themePrimaryValue = (formData.get('theme_primary') as string) || '#D4AF37'
    const themeBgValue = (formData.get('theme_bg') as string) || '#0B0B0F'
    const themeCardValue = (formData.get('theme_card') as string) || '#15151B'
    const themeTextValue = (formData.get('theme_text') as string) || '#F5F5F5'
    const themeModeValue = (formData.get('theme_mode') as string) || 'dark'
    
    // Validate hex colors
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    const validatedPrimary = hexPattern.test(themePrimaryValue) ? themePrimaryValue : '#D4AF37'
    const validatedBg = hexPattern.test(themeBgValue) ? themeBgValue : '#0B0B0F'
    const validatedCard = hexPattern.test(themeCardValue) ? themeCardValue : '#15151B'
    const validatedText = hexPattern.test(themeTextValue) ? themeTextValue : '#F5F5F5'

    // Ensure restaurant.id exists
    if (!restaurant.id) {
      console.error('RestaurantSettings: restaurant.id is missing, cannot update')
      toast.error('Restoran ID bulunamadı. Sayfa yenileniyor...')
      await fetchRestaurant()
      setLoading(false)
      return
    }

    console.log('RestaurantSettings: Before save - restaurant.id =', restaurant.id)
    console.log('RestaurantSettings: Payload - name:', name, 'slug:', slug)

    // Check if slug changed
    if (slug !== restaurant.slug) {
      if (!confirm('Slug değişirse mevcut QR kodlarınız bozulabilir. Devam etmek istiyor musunuz?')) {
        setLoading(false)
        return
      }
    }

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .update({ 
          name, 
          slug,
          template_id: templateId,
          theme_primary: validatedPrimary,
          theme_bg: validatedBg,
          theme_card: validatedCard,
          theme_text: validatedText,
          // Also save to new color fields for ModernTheme compatibility
          primary_color: validatedPrimary,
          background_color: validatedBg,
          card_color: validatedCard,
          text_color: validatedText,
          theme_mode: themeModeValue,
          theme_font: themeFont,
          theme_border_radius: parseInt(themeBorderRadius) || 12,
          theme_shadow: themeShadow,
          theme_hover: themeHover || validatedPrimary,
          include_vat: includeVAT,
          has_service_fee: hasServiceFee,
          service_fee_amount: hasServiceFee && serviceFeeAmount ? parseFloat(serviceFeeAmount) : null,
          has_cover_charge: hasCoverCharge,
          allergen_disclaimer: allergenDisclaimer.trim() || null,
          supported_languages: supportedLanguages,
        })
        .eq('id', restaurant.id)
        .select('id')
        .single()

      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505' || error.message.includes('unique') || error.message.includes('duplicate')) {
          toast.error('Bu slug zaten kullanılıyor. Lütfen farklı bir slug seçin.')
          throw error
        }
        throw error
      }

      console.log('RestaurantSettings: After save - response row id =', data?.id)

      toast.success('Ayarlar güncellendi')
      setRestaurant({ 
        ...restaurant, 
        name, 
        slug,
        template_id: templateId,
        theme_primary: validatedPrimary,
        theme_bg: validatedBg,
        theme_card: validatedCard,
        theme_text: validatedText,
        theme_mode: themeModeValue,
        include_vat: includeVAT,
        has_service_fee: hasServiceFee,
        has_cover_charge: hasCoverCharge,
      })
      setNewSlug(slug)
      // Update theme state
      setThemePrimary(validatedPrimary)
      setThemeBg(validatedBg)
      setThemeCard(validatedCard)
      setThemeText(validatedText)
      setThemeMode(themeModeValue)
      
      // Refresh server-side data to update layout and other components
      router.refresh()
    } catch (error: any) {
      console.error('RestaurantSettings: Update error:', error)
      // Error message already shown above for unique constraint
      if (error.code !== '23505' && !error.message.includes('unique') && !error.message.includes('duplicate')) {
        toast.error('Hata: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSlugChange = (value: string) => {
    setNewSlug(value)
    if (value !== restaurant.slug) {
      setShowSlugWarning(true)
    } else {
      setShowSlugWarning(false)
    }
  }

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Sadece JPG, PNG ve WebP formatları desteklenir.')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('Logo boyutu çok büyük. Maksimum 10MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setLogoFile(file)

    // Auto upload
    await handleLogoUpload(file)
  }

  const handleLogoUpload = async (file?: File) => {
    const fileToUpload = file || logoFile
    if (!fileToUpload || !restaurant.id) {
      toast.error('Logo dosyası veya restoran ID bulunamadı')
      return
    }

    setLogoUploading(true)

    try {
      // Generate unique file name: logos/{restaurantId}/{uuid}.{ext}
      const extension = fileToUpload.name.split('.').pop()?.toLowerCase() || 'png'
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp']
      const finalExtension = validExtensions.includes(extension) ? extension : 'png'

      // Use browser's crypto API for UUID
      const uuid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      const storagePath = `logos/${restaurant.id}/${uuid}.${finalExtension}`

      console.log('[Logo Upload] Starting direct client-side upload:', {
        bucket: BUCKET_MENU_LOGOS,
        path: storagePath,
        fileSize: fileToUpload.size,
        restaurantId: restaurant.id,
      })

      // Direct upload to Supabase Storage from client
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_MENU_LOGOS)
        .upload(storagePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('[Logo Upload] Storage upload error:', uploadError)
        // Handle specific error cases
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
          throw new Error(`Storage bucket '${BUCKET_MENU_LOGOS}' bulunamadı. Lütfen Supabase Dashboard'dan bucket'ı oluşturun.`)
        }
        if (uploadError.message.includes('new row violates row-level security') ||
            uploadError.message.includes('RLS') ||
            uploadError.message.includes('permission denied')) {
          throw new Error('Yükleme başarısız: İzin hatası. Lütfen restoran sahipliğinizi kontrol edin.')
        }
        throw new Error(uploadError.message || 'Logo yüklenirken bir hata oluştu')
      }

      if (!uploadData) {
        throw new Error('Yükleme başarılı oldu ancak veri döndürülmedi')
      }

      console.log('[Logo Upload] File uploaded successfully:', {
        path: uploadData.path,
        restaurantId: restaurant.id,
      })

      // Delete old logo if exists (optional cleanup)
      if (logoPath && logoPath !== uploadData.path) {
        const oldPathParts = logoPath.split('/')
        if (oldPathParts.length >= 3 && oldPathParts[0] === 'logos') {
          const { error: deleteError } = await supabase.storage
            .from(BUCKET_MENU_LOGOS)
            .remove([logoPath])

          if (deleteError) {
            console.warn('[Logo Upload] Failed to delete old logo:', deleteError)
          } else {
            console.log('[Logo Upload] Old logo deleted:', logoPath)
          }
        }
      }

      // Get public URL for logo_url field
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const publicUrl = supabaseUrl 
        ? `${supabaseUrl}/storage/v1/object/public/${BUCKET_MENU_LOGOS}/${uploadData.path}`
        : null

      // Update restaurants table with logo_path and logo_url
      const updateData: { logo_path: string; logo_url?: string | null } = {
        logo_path: uploadData.path,
      }
      if (publicUrl) {
        updateData.logo_url = publicUrl
      }

      const { error: updateError } = await supabase
        .from('restaurants')
        .update(updateData)
        .eq('id', restaurant.id)

      if (updateError) {
        console.error('[Logo Upload] Error updating logo in database:', updateError)
        // Try to delete the uploaded file since DB update failed
        await supabase.storage
          .from(BUCKET_MENU_LOGOS)
          .remove([uploadData.path])

        throw new Error('Yükleme başarılı oldu ancak veritabanı güncellenemedi. Dosya kaldırıldı.')
      }

      // Update local state
      setLogoPath(uploadData.path)
      setRestaurant({ 
        ...restaurant, 
        logo_path: uploadData.path,
        logo_url: publicUrl || restaurant.logo_url
      })

      toast.success('Logo başarıyla yüklendi')
      // Refresh to update server-side data
      router.refresh()
    } catch (error: any) {
      console.error('Logo upload error:', error)
      toast.error(error.message || 'Logo yüklenirken bir hata oluştu')
    } finally {
      setLogoUploading(false)
      setLogoFile(null)
    }
  }

  const handleCoverImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Sadece JPG, PNG ve WebP formatları desteklenir.')
      return
    }

    // Validate file size (max 20MB for cover images)
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      toast.error('Kapak fotoğrafı boyutu çok büyük. Maksimum 20MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setCoverImageFile(file)

    // Auto upload
    await handleCoverImageUpload(file)
  }

  const handleCoverImageUpload = async (file?: File) => {
    const fileToUpload = file || coverImageFile
    if (!fileToUpload || !restaurant?.id) {
      toast.error('Kapak fotoğrafı dosyası veya restoran ID bulunamadı')
      return
    }

    setCoverImageUploading(true)

    try {
      // Generate unique file name: covers/{restaurantId}/{uuid}.{ext}
      const extension = fileToUpload.name.split('.').pop()?.toLowerCase() || 'png'
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp']
      const finalExtension = validExtensions.includes(extension) ? extension : 'png'
      
      // Use browser's crypto API for UUID
      const uuid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      const storagePath = `covers/${restaurant.id}/${uuid}.${finalExtension}`

      console.log('[Cover Image Upload] Starting direct client-side upload:', {
        bucket: BUCKET_MENU_LOGOS,
        path: storagePath,
        fileSize: fileToUpload.size,
        restaurantId: restaurant.id,
      })

      // Direct upload to Supabase Storage from client
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_MENU_LOGOS)
        .upload(storagePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('[Cover Image Upload] Storage upload error:', uploadError)
        
        // Handle specific error cases
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
          throw new Error(`Storage bucket '${BUCKET_MENU_LOGOS}' bulunamadı. Lütfen Supabase Dashboard'dan bucket'ı oluşturun.`)
        }
        
        if (uploadError.message.includes('new row violates row-level security') || 
            uploadError.message.includes('RLS') ||
            uploadError.message.includes('permission denied')) {
          throw new Error('Yükleme başarısız: İzin hatası. Lütfen restoran sahipliğinizi kontrol edin.')
        }
        
        throw new Error(uploadError.message || 'Kapak fotoğrafı yüklenirken bir hata oluştu')
      }

      if (!uploadData) {
        throw new Error('Yükleme başarılı oldu ancak veri döndürülmedi')
      }

      console.log('[Cover Image Upload] File uploaded successfully:', {
        path: uploadData.path,
        restaurantId: restaurant.id,
      })

      // Delete old cover image if exists (optional cleanup)
      if (coverImagePath && coverImagePath !== uploadData.path) {
        const oldPathParts = coverImagePath.split('/')
        if (oldPathParts.length >= 3 && oldPathParts[0] === 'covers') {
          const { error: deleteError } = await supabase.storage
            .from(BUCKET_MENU_LOGOS)
            .remove([coverImagePath])
          
          if (deleteError) {
            console.warn('[Cover Image Upload] Failed to delete old cover image:', deleteError)
          } else {
            console.log('[Cover Image Upload] Old cover image deleted:', coverImagePath)
          }
        }
      }

      // Update restaurants table with cover_image path
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ cover_image: uploadData.path })
        .eq('id', restaurant.id)

      if (updateError) {
        console.error('[Cover Image Upload] Error updating cover_image in database:', updateError)
        // Try to delete the uploaded file since DB update failed
        await supabase.storage
          .from(BUCKET_MENU_LOGOS)
          .remove([uploadData.path])
        
        throw new Error('Yükleme başarılı oldu ancak veritabanı güncellenemedi. Dosya kaldırıldı.')
      }

      // Update local state
      setCoverImagePath(uploadData.path)
      setRestaurant({ ...restaurant, cover_image: uploadData.path })
      
      toast.success('Kapak fotoğrafı başarıyla yüklendi')
      
      // Refresh to update server-side data
      router.refresh()
    } catch (error: any) {
      console.error('Cover image upload error:', error)
      toast.error(error.message || 'Kapak fotoğrafı yüklenirken bir hata oluştu')
    } finally {
      setCoverImageUploading(false)
      setCoverImageFile(null)
    }
  }

  const handleCoverImageRemove = async () => {
    if (!coverImagePath || !restaurant?.id) {
      toast.error('Silinecek kapak fotoğrafı bulunamadı')
      return
    }

    if (!confirm('Kapak fotoğrafını silmek istediğinize emin misiniz?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ cover_image: null })
        .eq('id', restaurant.id)

      if (error) throw error

      setCoverImagePath(null)
      setCoverImagePreview(null)
      setRestaurant({ ...restaurant, cover_image: null })
      
      toast.success('Kapak fotoğrafı silindi')
      router.refresh()
    } catch (error: any) {
      console.error('Cover image remove error:', error)
      toast.error('Kapak fotoğrafı silinirken bir hata oluştu')
    }
  }

  // Helper function to get cover image URL
  const getCoverImageUrl = (path: string | null): string | null => {
    if (!path) return null
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) return null
    
    // Remove bucket prefix if present
    let cleanPath = path.startsWith('/') ? path.slice(1) : path
    if (cleanPath.startsWith('menu_logos/')) {
      cleanPath = cleanPath.substring(11)
    }
    
    return `${supabaseUrl}/storage/v1/object/public/menu_logos/${cleanPath}`
  }

  // Safety check: ensure restaurant exists
  if (!restaurant || !restaurant.id) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">Restoran bilgileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Restoran Adı *
          </label>
          <input
            type="text"
            name="name"
            required
            defaultValue={restaurant.name}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slug (URL) *
          </label>
          <input
            type="text"
            name="slug"
            required
            value={newSlug}
            onChange={(e) => handleSlugChange(e.target.value)}
            pattern="[a-z0-9-]+"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Sadece küçük harf, rakam ve tire (-) kullanılabilir. Menü URL'iniz: /menu/{newSlug}
          </p>
          {showSlugWarning && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ Slug değişirse mevcut QR kodlarınız eski URL'e yönlendirecek. 
                Yeni QR kodlar oluşturmanız gerekebilir.
              </p>
            </div>
          )}
        </div>

        {/* Logo Section */}
        <div className="mb-6 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo</h3>
          
          <div className="space-y-4">
            {/* Logo Preview */}
            {(logoPreview || logoPath) && (
              <div className="flex items-center gap-4">
                <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  ) : logoPath ? (
                    <div className="text-sm text-gray-500">Logo yüklü</div>
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">
                    {logoPath ? 'Mevcut logo görüntüleniyor' : 'Yeni logo önizlemesi'}
                  </p>
                  {logoPath && (
                    <p className="text-xs text-gray-500">
                      Path: {logoPath}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo Dosyası
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleLogoFileChange}
                disabled={logoUploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG veya WebP formatında, maksimum 10MB
              </p>
            </div>

            {logoUploading && (
              <div className="text-sm text-gray-600">
                Logo yükleniyor...
              </div>
            )}
          </div>
        </div>

        {/* Cover Image Section */}
        <div className="mb-6 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kapak Fotoğrafı</h3>
          
          <div className="space-y-4">
            {/* Cover Image Preview */}
            {(coverImagePreview || coverImagePath) && (
              <div className="space-y-3">
                <div className="relative w-full h-48 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                  {coverImagePreview ? (
                    <img
                      src={coverImagePreview}
                      alt="Cover image preview"
                      className="w-full h-full object-cover"
                    />
                  ) : coverImagePath ? (
                    <img
                      src={getCoverImageUrl(coverImagePath) || ''}
                      alt="Cover image"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full text-sm text-gray-500">Kapak fotoğrafı yüklü</div>'
                      }}
                    />
                  ) : null}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {coverImagePath ? 'Mevcut kapak fotoğrafı görüntüleniyor' : 'Yeni kapak fotoğrafı önizlemesi'}
                  </p>
                  {coverImagePath && (
                    <button
                      type="button"
                      onClick={handleCoverImageRemove}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                    >
                      Kaldır
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kapak Fotoğrafı Dosyası
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleCoverImageFileChange}
                disabled={coverImageUploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG veya WebP formatında, maksimum 20MB. Bu görsel menünüzün en üstünde gösterilecektir.
              </p>
            </div>

            {coverImageUploading && (
              <div className="text-sm text-gray-600">
                Kapak fotoğrafı yükleniyor...
              </div>
            )}
          </div>
        </div>

        {/* Theme Section */}
        <div className="mb-6 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tema Ayarları</h3>
          
          {/* Live Preview */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Canlı Önizleme
            </label>
            <div className="bg-white rounded-lg overflow-hidden shadow-sm" style={{ maxWidth: '375px', margin: '0 auto' }}>
              {/* Mobile Preview Frame */}
              <div 
                className="p-4 min-h-[400px] relative"
                style={{ 
                  backgroundColor: themeBg,
                  fontFamily: themeFont,
                }}
              >
                {/* Header */}
                <div className="mb-4">
                  <div 
                    className="h-12 flex items-center justify-center rounded-lg mb-2"
                    style={{ 
                      backgroundColor: themeCard,
                      borderRadius: `${themeBorderRadius}px`,
                      boxShadow: themeShadow === 'none' ? 'none' : 
                                 themeShadow === 'sm' ? '0 1px 2px rgba(0,0,0,0.1)' :
                                 themeShadow === 'md' ? '0 4px 6px rgba(0,0,0,0.1)' :
                                 themeShadow === 'lg' ? '0 10px 15px rgba(0,0,0,0.1)' :
                                 '0 20px 25px rgba(0,0,0,0.15)',
                    }}
                  >
                    <span style={{ color: themeText, fontSize: '14px', fontWeight: 600 }}>Restoran Adı</span>
                  </div>
                </div>

                {/* Menu Card Preview */}
                <div 
                  className="mb-3 p-3 rounded-lg transition-all"
                  style={{ 
                    backgroundColor: themeCard,
                    borderRadius: `${themeBorderRadius}px`,
                    boxShadow: themeShadow === 'none' ? 'none' : 
                               themeShadow === 'sm' ? '0 1px 2px rgba(0,0,0,0.1)' :
                               themeShadow === 'md' ? '0 4px 6px rgba(0,0,0,0.1)' :
                               themeShadow === 'lg' ? '0 10px 15px rgba(0,0,0,0.1)' :
                               '0 20px 25px rgba(0,0,0,0.15)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themeHover
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = themeCard
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: themeText, fontSize: '16px', fontWeight: 600 }}>Ürün Adı</span>
                    <span style={{ color: themePrimary, fontSize: '14px', fontWeight: 600 }}>₺25.00</span>
                  </div>
                  <p style={{ color: themeText, opacity: 0.7, fontSize: '12px' }}>Ürün açıklaması burada görünür</p>
                </div>

                {/* Button Preview */}
                <button
                  className="w-full py-2 rounded-lg transition-all"
                  style={{ 
                    backgroundColor: themePrimary,
                    color: themeText,
                    borderRadius: `${themeBorderRadius}px`,
                    fontSize: '14px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: themeShadow === 'none' ? 'none' : 
                               themeShadow === 'sm' ? '0 1px 2px rgba(0,0,0,0.1)' :
                               themeShadow === 'md' ? '0 4px 6px rgba(0,0,0,0.1)' :
                               themeShadow === 'lg' ? '0 10px 15px rgba(0,0,0,0.1)' :
                               '0 20px 25px rgba(0,0,0,0.15)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themeHover
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = themePrimary
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  Buton Örneği
                </button>
              </div>
            </div>
          </div>
          
          {/* Presets */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hazır Temalar
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setThemePrimary(preset.primary)
                    setThemeBg(preset.bg)
                    setThemeCard(preset.card)
                    setThemeText(preset.text)
                    setThemeMode(preset.mode)
                    setThemeHover(preset.primary)
                  }}
                  className="px-3 py-2 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ana Renk (Primary)
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="theme_primary"
                  value={themePrimary}
                  onChange={(e) => setThemePrimary(e.target.value)}
                  className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="theme_primary"
                  value={themePrimary}
                  onChange={(e) => setThemePrimary(e.target.value)}
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  placeholder="#D4AF37"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arka Plan (Background)
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="theme_bg"
                  value={themeBg}
                  onChange={(e) => setThemeBg(e.target.value)}
                  className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="theme_bg"
                  value={themeBg}
                  onChange={(e) => setThemeBg(e.target.value)}
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  placeholder="#0B0B0F"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kart Rengi (Card)
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="theme_card"
                  value={themeCard}
                  onChange={(e) => setThemeCard(e.target.value)}
                  className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="theme_card"
                  value={themeCard}
                  onChange={(e) => setThemeCard(e.target.value)}
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  placeholder="#15151B"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metin Rengi (Text)
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="theme_text"
                  value={themeText}
                  onChange={(e) => setThemeText(e.target.value)}
                  className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="theme_text"
                  value={themeText}
                  onChange={(e) => setThemeText(e.target.value)}
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  placeholder="#F5F5F5"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Reset to Defaults Button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                // Apply different defaults based on selected template
                if (templateId === 'modern') {
                  // Premium Modern theme defaults
                  setThemePrimary('#C09636')  // Gold/Bronze
                  setThemeBg('#F8FAFC')      // Very Light Gray/White
                  setThemeCard('#FFFFFF')     // Pure White
                  setThemeText('#0F172A')     // Dark Navy
                  setThemeHover('#C09636')    // Match primary
                } else {
                  // Classic theme defaults
                  setThemePrimary('#EA580C')  // Orange
                  setThemeBg('#FFFFFF')       // White
                  setThemeCard('#FFFFFF')     // White
                  setThemeText('#000000')     // Black
                  setThemeHover('#EA580C')    // Match primary
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Varsayılan Renklere Dön
            </button>
          </div>

          {/* Theme Mode */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tema Modu
            </label>
            <select
              name="theme_mode"
              value={themeMode}
              onChange={(e) => setThemeMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="dark">Koyu</option>
              <option value="light">Açık</option>
            </select>
          </div>

          {/* Advanced Theme Options */}
          <div className="mb-4 pt-4 border-t border-gray-200">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Gelişmiş Tema Özellikleri</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Font Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Ailesi (Font Family)
                </label>
                <select
                  name="theme_font"
                  value={themeFont}
                  onChange={(e) => setThemeFont(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ fontFamily: themeFont }}
                >
                  <option value="Inter">Inter (Varsayılan)</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Lato">Lato</option>
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Merriweather">Merriweather</option>
                </select>
              </div>

              {/* Border Radius */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Köşe Yuvarlaklığı (Border Radius)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={themeBorderRadius}
                    onChange={(e) => setThemeBorderRadius(e.target.value)}
                    className="flex-1"
                  />
                  <input
                    type="text"
                    value={`${themeBorderRadius}px`}
                    readOnly
                    className="w-20 px-2 py-2 border border-gray-300 rounded-md text-sm text-center"
                  />
                </div>
              </div>

              {/* Shadow */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gölge (Shadow)
                </label>
                <select
                  name="theme_shadow"
                  value={themeShadow}
                  onChange={(e) => setThemeShadow(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="none">Yok</option>
                  <option value="sm">Küçük</option>
                  <option value="md">Orta</option>
                  <option value="lg">Büyük</option>
                  <option value="xl">Çok Büyük</option>
                </select>
              </div>

              {/* Hover Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hover Rengi (Hover Color)
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="theme_hover"
                    value={themeHover}
                    onChange={(e) => setThemeHover(e.target.value)}
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    name="theme_hover"
                    value={themeHover}
                    onChange={(e) => setThemeHover(e.target.value)}
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    placeholder="#E5C448"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Butonlar ve kartlar üzerine gelindiğinde görünecek renk</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Design Section */}
        <div className="mb-6 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Menu Tasarımı</h3>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Menü sayfanızın görünümünü seçin. Bu ayar tüm şubeleriniz için geçerlidir.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Classic Template Option */}
              <label
                className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  templateId === 'classic'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="template_id"
                  value="classic"
                  checked={templateId === 'classic'}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    templateId === 'classic'
                      ? 'border-primary-600 bg-primary-600'
                      : 'border-gray-300'
                  }`}>
                    {templateId === 'classic' && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      Klasik Grid Görünüm
                    </div>
                    <p className="text-sm text-gray-600">
                      Ürünler kategoriler halinde grid görünümünde gösterilir. Mobil uyumlu, kart tabanlı tasarım.
                    </p>
                  </div>
                </div>
              </label>

              {/* Modern Template Option */}
              <label
                className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  templateId === 'modern'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="template_id"
                  value="modern"
                  checked={templateId === 'modern'}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    templateId === 'modern'
                      ? 'border-primary-600 bg-primary-600'
                      : 'border-gray-300'
                  }`}>
                    {templateId === 'modern' && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      Modern Liste Görünüm
                    </div>
                    <p className="text-sm text-gray-600">
                      Ürünler liste formatında, yan yana görüntülenir. Modern ve minimal tasarım.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Legal Information Section */}
        <div className="mb-6 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Yasal Bilgiler</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="include_vat"
                checked={includeVAT}
                onChange={(e) => setIncludeVAT(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="include_vat" className="ml-2 block text-sm text-gray-700">
                Fiyatlara KDV dahildir
              </label>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="has_service_fee"
                  checked={hasServiceFee}
                  onChange={(e) => setHasServiceFee(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="has_service_fee" className="ml-2 block text-sm text-gray-700">
                  Servis ücreti alınmaktadır
                </label>
              </div>
              {hasServiceFee && (
                <div className="ml-6 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servis Ücreti Miktarı (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={serviceFeeAmount}
                    onChange={(e) => setServiceFeeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="has_cover_charge"
                checked={hasCoverCharge}
                onChange={(e) => setHasCoverCharge(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="has_cover_charge" className="ml-2 block text-sm text-gray-700">
                Kuver ücreti bulunmaktadır
              </label>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alerjen Uyarı Metni
              </label>
              <textarea
                value={allergenDisclaimer}
                onChange={(e) => setAllergenDisclaimer(e.target.value)}
                placeholder="Alerjen uyarısı: Ürünlerimiz alerjen içerebilir. Alerjiniz varsa lütfen sipariş öncesinde bildiriniz."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Boş bırakılırsa varsayılan metin kullanılacaktır.
              </p>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Bu ayarlar menü sayfasında yasal bilgiler bölümünde görüntülenecektir.
            </p>
          </div>
        </div>

        {/* Dil Ayarları - Menüde gösterilecek diller */}
        <div className="mb-6 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dil Ayarları</h3>
          <p className="text-sm text-gray-600 mb-4">
            Menü sayfasındaki dil seçicide hangi dillerin görüneceğini belirleyin. Kapalı olan diller menüde listelenmez.
          </p>
          <div className="space-y-3">
            {(['tr', 'en', 'ar'] as const).map((code) => {
              const label = code === 'tr' ? 'Türkçe' : code === 'en' ? 'İngilizce' : 'Arapça'
              const enabled = supportedLanguages.includes(code)
              return (
                <div key={code} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">{label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    onClick={() => toggleLanguage(code)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      enabled ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                        enabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            En az bir dil açık kalmalıdır. Değişiklikleri kaydetmek için aşağıdaki &quot;Kaydet&quot; butonuna tıklayın.
          </p>
        </div>

        {/* Social Media & Review Section - Branch Scoped */}
        <div className="mb-6 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Yorum & Sosyal Medya (Şube Özel)</h3>
          
          {!activeBranchId ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                Sosyal medya ayarları şube bazlıdır. Lütfen yukarıdaki dropdown'dan bir şube seçin.
              </p>
            </div>
          ) : (
          <div className="space-y-4">
            {/* Google Place ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Place ID (ChIJ...)
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={googlePlaceId}
                    onChange={(e) => handlePlaceIdChange(e.target.value)}
                    placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      placeIdError 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-primary-500'
                    }`}
                  />
                  {placeIdError && (
                    <p className="text-xs text-red-600 mt-1">{placeIdError}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleFetchGoogleRating}
                  disabled={fetchingRating || !googlePlaceId.trim() || !!placeIdError}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {fetchingRating ? 'Yükleniyor...' : 'Puanı Getir'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Google Business profil sayfanızdan Place ID'yi alın. Örnek: <code className="bg-gray-100 px-1 rounded">ChIJN1t_tDeuEmsRUsoyG83frY4</code>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                💡 Place ID nasıl bulunur: Google Maps'te işletmenizi açın → "Paylaş" → "Place ID'yi kopyala" veya URL'deki <code className="bg-gray-100 px-1 rounded">?cid=...</code> parametresini kullanın.
              </p>
            </div>

            {/* Google Rating & Review Count (Display only - fetched from API) */}
            {(googleRating || googleReviewCount || googlePlaceId) && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Google Puanı:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {googleRating && Number(googleRating) > 0 ? `${Number(googleRating).toFixed(1)} ⭐` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Yorum Sayısı:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {googleReviewCount && Number(googleReviewCount) > 0 ? `${Number(googleReviewCount).toLocaleString()}` : '—'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Bu değerler Google Places API'den otomatik olarak çekilir ve 24 saat önbellekte tutulur.
                </p>
              </div>
            )}

            {/* Google Review URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Yorum Linki
              </label>
              <input
                type="url"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                placeholder="https://g.page/r/.../review veya Google Maps 'write a review' linki"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Google Business sayfanızdan "Yorum Yaz" linkini buraya yapıştırın (müşteriler bu linke yönlendirilecek)
              </p>
            </div>

            {/* Instagram URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram Linki
              </label>
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://www.instagram.com/restoran_adi/"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* TikTok URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TikTok Linki
              </label>
              <input
                type="url"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@restoran_adi"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* X (Twitter) URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                X (Twitter) Linki
              </label>
              <input
                type="url"
                value={xUrl}
                onChange={(e) => setXUrl(e.target.value)}
                placeholder="https://x.com/restoran_adi veya https://twitter.com/restoran_adi"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>


            <div className="flex justify-end pt-4 border-t">
              <button
                type="button"
                onClick={handleSocialSubmit}
                disabled={socialLoading || !socialHasChanges}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {socialLoading ? 'Kaydediliyor...' : 'Sosyal Medya Ayarlarını Kaydet'}
              </button>
            </div>
          </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
}

