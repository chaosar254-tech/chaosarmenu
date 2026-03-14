'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { X, Search, Globe } from 'lucide-react'
import { getPlanLimit, PLAN_LIMITS } from '@/lib/plan-limits'
import { optimizeImage, type OptimizeImageResult } from '@/lib/image/optimizeImage'
import { ALLERGENS } from '@/lib/allergens'
import { useActiveBranch } from '@/contexts/BranchContext'
import { useSubscription } from '@/lib/subscription-context'

interface Category {
  id: string
  name: string
  sort_order: number
  is_active: boolean
  image_url?: string | null
}

interface Subcategory {
  id: string
  name: string
  sort_order: number
  is_active: boolean
  category_id: string
}

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null // Legacy field
  image_path: string | null // Storage path
  category_id: string
  subcategory_id?: string | null
  is_active: boolean
  sort_order: number
  has_ar?: boolean
  model_glb?: string | null
  model_usdz?: string | null
  ingredients?: string[] | null // Combo: ingredient list
  recommended_item_ids?: string[] | null // Recommended item IDs for pairings
  allergens?: string[] | null // Allergen identifiers
  name_en?: string | null
  name_ar?: string | null
  description_en?: string | null
  description_ar?: string | null
}

interface MenuManagementProps {
  restaurantId: string
  restaurantPlan: string | null
}

interface MenuItemWithOverride extends MenuItem {
  effectivePrice: number
  branchOverride?: {
    price_override: number | null
    is_available: boolean
    stock_status: string
  }
}

export default function MenuManagement({ restaurantId, restaurantPlan }: MenuManagementProps) {
  const { activeBranchId, requireBranch, branches } = useActiveBranch()
  const { hasActiveSubscription, isSubscriptionExpired } = useSubscription()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItemWithOverride[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [branchOverrides, setBranchOverrides] = useState<Record<string, any>>({})
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [subcategoryCategory, setSubcategoryCategory] = useState<Category | null>(null)
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false)
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null)
  const [editingSubcategoryName, setEditingSubcategoryName] = useState('')
  const [subcategoriesSaving, setSubcategoriesSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [optimizingImage, setOptimizingImage] = useState(false)
  const [submittingItem, setSubmittingItem] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [optimizedImageInfo, setOptimizedImageInfo] = useState<{
    size: number
    format: string
    originalSize: number
  } | null>(null)
  const [optimizedImageBlob, setOptimizedImageBlob] = useState<Blob | null>(null)
  // Category image upload state
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false)
  const [optimizingCategoryImage, setOptimizingCategoryImage] = useState(false)
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null)
  const [optimizedCategoryImageInfo, setOptimizedCategoryImageInfo] = useState<{
    size: number
    format: string
    originalSize: number
  } | null>(null)
  const [optimizedCategoryImageBlob, setOptimizedCategoryImageBlob] = useState<Blob | null>(null)
  // Combo fields state
  const [ingredients, setIngredients] = useState<string[]>([])
  const [ingredientInput, setIngredientInput] = useState('')
  const [selectedRecommendedItems, setSelectedRecommendedItems] = useState<string[]>([])
  // Allergen state
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])
  const [activeItemTab, setActiveItemTab] = useState<'genel' | 'icindekiler' | 'alerjenler' | 'upsell' | 'ceviriler' | 'ar'>('genel')
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  const [categorySearchQuery, setCategorySearchQuery] = useState('')
  const [recommendedItemsSearchQuery, setRecommendedItemsSearchQuery] = useState('')
  const [categorySubcategories, setCategorySubcategories] = useState<Subcategory[]>([])
  const [categorySubcategoriesLoading, setCategorySubcategoriesLoading] = useState(false)
  // Form state for item inputs (to preserve values when switching tabs)
  const [itemFormData, setItemFormData] = useState({
    category_id: '',
    subcategory_id: '',
    name: '',
    description: '',
    price: '',
    sort_order: '',
    is_active: true,
    has_ar: false,
    model_glb: '',
    model_usdz: '',
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
  })

  // Calculate AR usage
  const plan = restaurantPlan || 'starter'
  const limit = getPlanLimit(plan)
  const arProducts = items.filter(item => item.has_ar && item.model_glb)
  const arCount = arProducts.length
  const isLimitReached = limit !== Infinity && arCount >= limit

  useEffect(() => {
    if (activeBranchId) {
      loadData()
    } else {
      setCategories([])
      setItems([])
      setBranchOverrides({})
      setLoading(false)
    }
  }, [restaurantId, activeBranchId])

  const loadData = async () => {
    if (!activeBranchId) {
      console.warn('[MenuManagement] loadData called without activeBranchId')
      return
    }

    setLoading(true)
    try {
      console.log('[MenuManagement] Loading data for branch:', activeBranchId)

      // Load categories filtered by branch_id
      const { data: cats, error: catsError } = await supabase
        .from('menu_categories')
        .select('id, name, sort_order, is_active, image_url')
        .eq('branch_id', activeBranchId)
        .order('sort_order', { ascending: true })

      if (catsError) {
        console.error('[MenuManagement] Categories error:', catsError)
        throw catsError
      }

      // Load items filtered by branch_id
      const { data: its, error: itemsError } = await supabase
        .from('menu_items')
        .select('id, name, description, price, image_url, image_path, category_id, subcategory_id, is_active, sort_order, has_ar, model_glb, model_usdz, ingredients, recommended_item_ids, allergens, name_en, name_ar, description_en, description_ar')
        .eq('branch_id', activeBranchId)
        .order('sort_order', { ascending: true })

      if (itemsError) {
        console.error('[MenuManagement] Items error:', itemsError)
        throw itemsError
      }

      console.log('[MenuManagement] Loaded:', { categories: cats?.length || 0, items: its?.length || 0 })

      setCategories(cats || [])

      // Items are now branch-scoped, no need for overrides
      const itemsWithPrices: MenuItemWithOverride[] = (its || []).map((item) => ({
        ...item,
        effectivePrice: item.price, // Items are branch-scoped, price is already effective
      }))

      setItems(itemsWithPrices)
      setBranchOverrides({}) // No longer needed, but keep for backward compatibility
    } catch (error: any) {
      console.error('[MenuManagement] Load error:', error)
      toast.error('Veri yüklenirken hata: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Check subscription status (soft lock)
    if (!hasActiveSubscription) {
      toast.error('Aboneliğiniz sona ermiş. Devam etmek için lütfen ödeme yapın.')
      router.push('/dashboard/billing')
      return
    }

    if (!activeBranchId) {
      toast.error('Lütfen önce bir şube seçin')
      return
    }

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const sortOrder = parseInt(formData.get('sort_order') as string) || 0

    try {
      let categoryId: string

      if (editingCategory) {
        // Update existing category
        const { data, error } = await supabase
          .from('menu_categories')
          .update({ name, sort_order: sortOrder })
          .eq('id', editingCategory.id)
          .eq('branch_id', activeBranchId) // Ensure category belongs to active branch
          .select()
          .single()
        if (error) throw error
        categoryId = editingCategory.id
        toast.success('Kategori güncellendi')
      } else {
        // Create new category with branch_id
        const { data, error } = await supabase
          .from('menu_categories')
          .insert({
            branch_id: activeBranchId,
            restaurant_id: restaurantId,
            name,
            sort_order: sortOrder
          })
          .select()
          .single()
        if (error) {
          console.error('[MenuManagement] Category creation error:', error)
          throw error
        }
        categoryId = data.id
        console.log('[MenuManagement] Created category:', categoryId, 'for branch:', activeBranchId)
        toast.success('Kategori oluşturuldu')
      }

      // Upload category image if available
      if (optimizedCategoryImageBlob && categoryId) {
        setUploadingCategoryImage(true)
        try {
          const fileName = `category-${categoryId}-${Date.now()}.${optimizedCategoryImageInfo?.format === 'image/webp' ? 'webp' : 'jpg'}`
          const file = new File([optimizedCategoryImageBlob], fileName, { type: optimizedCategoryImageBlob.type })
          
          const uploadFormData = new FormData()
          uploadFormData.append('file', file)
          uploadFormData.append('restaurant_id', restaurantId)
          uploadFormData.append('category_id', categoryId)

          const response = await fetch('/api/upload/category-image', {
            method: 'POST',
            body: uploadFormData,
          })

          // Always parse JSON response
          let result: any
          try {
            result = await response.json()
          } catch (parseError) {
            const text = await response.text()
            console.error('[Category Image Upload] Failed to parse JSON response:', {
              status: response.status,
              text: text.substring(0, 200),
            })
            throw new Error(`Server error (${response.status}): Failed to parse response`)
          }

          // Check if response is OK
          if (!response.ok || result.ok === false) {
            console.error('[Category Image Upload] Upload failed:', {
              status: response.status,
              ok: result.ok,
              error: result.error,
              bucket: result.bucket,
              path: result.path,
            })
            
            // Show server error.message
            const errorMessage = result.error || 'Category image upload failed'
            throw new Error(errorMessage)
          }

          console.log('[Category Image Upload] Upload successful:', {
            ok: result.ok,
            path: result.path,
            publicUrl: result.publicUrl,
            message: result.message,
          })

          toast.success('Kategori görseli yüklendi')
        } catch (error: any) {
          // Always show error.message from server or client
          const errorMessage = error?.message || 'Görsel yüklenirken bilinmeyen bir hata oluştu'
          console.error('[Category Image Upload] Error:', error)
          toast.error(errorMessage)
        } finally {
          setUploadingCategoryImage(false)
        }
      }

      setShowCategoryModal(false)
      setEditingCategory(null)
      setCategoryImagePreview(null)
      setOptimizedCategoryImageInfo(null)
      setOptimizedCategoryImageBlob(null)
      loadData()
    } catch (error: any) {
      toast.error('Hata: ' + error.message)
    }
  }

  const handleImageUpload = async (blob: Blob, fileName: string, menuItemId: string): Promise<{ path: string; image_url: string | null } | null> => {
    setUploadingImage(true)
    try {
      console.log('[MenuManagement] Starting image upload:', { fileName, menuItemId, blobSize: blob.size })

      // Create a File from the blob for FormData
      const file = new File([blob], fileName, { type: blob.type })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('restaurant_id', restaurantId)
      if (menuItemId) {
        formData.append('menu_item_id', menuItemId)
      }

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('[MenuManagement] Upload failed:', {
          status: response.status,
          error: result.error,
        })
        throw new Error(result.error || 'Upload failed')
      }

      console.log('[MenuManagement] Upload successful:', {
        path: result.path,
        image_url: result.image_url ? 'present' : 'missing',
      })

      // Return both path and image_url (CDN URL)
      return {
        path: result.path,
        image_url: result.image_url || null,
      }
    } catch (error: any) {
      console.error('[MenuManagement] Image upload error:', error)
      toast.error('Görsel yüklenirken hata: ' + error.message)
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleItemSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Check subscription status (soft lock)
    if (!hasActiveSubscription) {
      toast.error('Aboneliğiniz sona ermiş. Devam etmek için lütfen ödeme yapın.')
      router.push('/dashboard/billing')
      return
    }

    // Prevent double submission
    if (submittingItem) {
      return
    }

    // Early validation checks before setting submitting state
    if (!activeBranchId) {
      toast.error('Şube seçiniz. Lütfen bir şube seçin.')
      return
    }

    // Set submitting state after all validation checks
    setSubmittingItem(true)

    const formData = new FormData(e.currentTarget)
    // Use itemFormData state for form values (controlled components)
    // When editing, use editingItem.category_id as fallback if form doesn't have it
    // This allows saving from any tab without requiring the user to visit "Genel" tab
    const categoryId = itemFormData.category_id || editingItem?.category_id || ''
    
    // Client-side logging
    console.log('[MenuManagement] handleItemSubmit - payload:', {
      activeBranchId,
      categoryId,
      editingItemCategoryId: editingItem?.category_id,
      formCategoryId: formData.get('category_id'),
      formName: formData.get('name'),
      editingItemId: editingItem?.id,
      restaurantId,
    })
    
    if (!categoryId) {
        toast.error('Kategori seçiniz')
        setSubmittingItem(false)
        return
      }

    let imagePath = editingItem?.image_path || null
    let createdItemId: string | null = null

    // For new items: create item first, then upload image with proper path
    if (!editingItem && optimizedImageBlob) {
      // Create item without image first (branch_id will be set by server from cookie)
        const createData = {
        restaurant_id: restaurantId,
        category_id: categoryId,
          subcategory_id: itemFormData.subcategory_id || null,
        name: itemFormData.name,
        description: itemFormData.description || null,
        price: parseFloat(itemFormData.price) || 0,
        image_path: null,
        sort_order: parseInt(itemFormData.sort_order) || 0,
        is_active: itemFormData.is_active,
        has_ar: itemFormData.has_ar,
        model_glb: itemFormData.model_glb || null,
        model_usdz: itemFormData.model_usdz || null,
        ingredients: ingredients.length > 0 ? ingredients : null,
        recommended_item_ids: selectedRecommendedItems.length > 0 ? selectedRecommendedItems : null,
        allergens: selectedAllergens.length > 0 ? selectedAllergens : [],
      }

      console.log('[MenuManagement] Creating item with payload:', { ...createData, activeBranchId })
      const createResponse = await fetch('/api/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      })

      const createResult = await createResponse.json()

      if (!createResponse.ok) {
        if (createResult.error === 'AR_LIMIT_REACHED') {
          toast.error(createResult.message || 'AR ürün limitine ulaştınız. Planınızı yükseltin.')
        } else {
          toast.error(createResult.error || 'Ürün oluşturulamadı')
        }
        return
      }

      createdItemId = createResult.data.id

      if (!createdItemId) {
        toast.error('Ürün ID alınamadı')
        setSubmittingItem(false)
        return
      }

      // Now upload image with the item ID
      const extension = optimizedImageInfo?.format === 'image/webp' ? 'webp' : 'jpg'
      const fileName = `optimized.${extension}`
      
      const uploadResult = await handleImageUpload(optimizedImageBlob, fileName, createdItemId)
      if (uploadResult) {
        imagePath = uploadResult.path
        const imageUrl = uploadResult.image_url
        
        console.log('[MenuManagement] Updating item with image:', {
          itemId: createdItemId,
          imagePath,
          imageUrl: imageUrl ? 'present' : 'missing',
        })
        
        // Update item with image_path and image_url (branch_id will be validated by server from cookie)
        const updateResponse = await fetch('/api/menu-items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: createdItemId,
            restaurant_id: restaurantId,
            category_id: categoryId,
            subcategory_id: itemFormData.subcategory_id || null,
            name: itemFormData.name,
            description: itemFormData.description || null,
            price: parseFloat(itemFormData.price) || 0,
            image_path: imagePath,
            image_url: imageUrl, // CDN URL from Supabase Storage
            sort_order: parseInt(itemFormData.sort_order) || 0,
            is_active: itemFormData.is_active,
            has_ar: itemFormData.has_ar,
            model_glb: itemFormData.model_glb || null,
            model_usdz: itemFormData.model_usdz || null,
            ingredients: ingredients.length > 0 ? ingredients : null,
            recommended_item_ids: selectedRecommendedItems.length > 0 ? selectedRecommendedItems : null,
            allergens: selectedAllergens.length > 0 ? selectedAllergens : [],
          }),
        })

        if (!updateResponse.ok) {
          const updateResult = await updateResponse.json()
          console.error('[MenuManagement] Database update failed:', {
            status: updateResponse.status,
            error: updateResult.error,
          })
          toast.error('Görsel kaydedilemedi: ' + (updateResult.error || 'Bilinmeyen hata'))
          setSubmittingItem(false)
          loadData()
          return
        }

        console.log('[MenuManagement] Item updated successfully with image')
      }

      toast.success('Ürün eklendi')
      setSubmittingItem(false)
      setShowItemModal(false)
      setEditingItem(null)
      setImagePreview(null)
      setOptimizedImageInfo(null)
      setOptimizedImageBlob(null)
      setIngredients([])
      setIngredientInput('')
      setSelectedRecommendedItems([])
      setSelectedAllergens([])
      // Reset form data
      setItemFormData({
        category_id: '',
        name: '',
        name_en: '',
        name_ar: '',
        description: '',
        description_en: '',
        description_ar: '',
        price: '',
        sort_order: '',
        is_active: true,
        has_ar: false,
        model_glb: '',
        model_usdz: '',
      })
      loadData()
      return
    }

    // For updates or if no new image: proceed normally
    let imageUrl: string | null = editingItem?.image_url || null
    if (editingItem && optimizedImageBlob) {
      // Upload image with existing item ID
      const extension = optimizedImageInfo?.format === 'image/webp' ? 'webp' : 'jpg'
      const fileName = `optimized.${extension}`
      
      const uploadResult = await handleImageUpload(optimizedImageBlob, fileName, editingItem.id)
      if (uploadResult) {
        imagePath = uploadResult.path
        imageUrl = uploadResult.image_url
        console.log('[MenuManagement] Image uploaded for edit:', {
          imagePath,
          imageUrl: imageUrl ? 'present' : 'missing',
        })
      } else {
        // Upload failed, don't proceed
        console.error('[MenuManagement] Image upload failed during edit')
        return
      }
    }

    // Use itemFormData state for form values (controlled components)
    // This allows saving from any tab without requiring user to visit "Genel" tab
    const name = itemFormData.name?.trim() || editingItem?.name || ''
    const description = itemFormData.description?.trim() || editingItem?.description || null
    const price = itemFormData.price ? parseFloat(itemFormData.price) : (editingItem?.price ?? 0)
    const sortOrder = itemFormData.sort_order ? parseInt(itemFormData.sort_order) : (editingItem?.sort_order ?? 0)
    
    // Use itemFormData state values
    const isActive = itemFormData.is_active ?? (editingItem?.is_active ?? true)
    const hasAr = itemFormData.has_ar ?? (editingItem?.has_ar ?? false)
    
    const modelGlb = itemFormData.model_glb?.trim() || editingItem?.model_glb || null
    const modelUsdz = itemFormData.model_usdz?.trim() || editingItem?.model_usdz || null

    const data = {
      restaurant_id: restaurantId,
      category_id: categoryId,
      subcategory_id: itemFormData.subcategory_id || editingItem?.subcategory_id || null,
      name,
      description,
      price,
      image_path: imagePath,
      image_url: imageUrl, // CDN URL from Supabase Storage
      sort_order: sortOrder,
      is_active: isActive,
      has_ar: hasAr,
      model_glb: modelGlb,
      model_usdz: modelUsdz,
      ingredients: ingredients.length > 0 ? ingredients : null,
      recommended_item_ids: selectedRecommendedItems.length > 0 ? selectedRecommendedItems : null,
      allergens: selectedAllergens.length > 0 ? selectedAllergens : [],
      name_en: itemFormData.name_en?.trim() || null,
      name_ar: itemFormData.name_ar?.trim() || null,
      description_en: itemFormData.description_en?.trim() || null,
      description_ar: itemFormData.description_ar?.trim() || null,
    }

    try {
      const url = '/api/menu-items'
      const method = editingItem ? 'PUT' : 'POST'
      const body = editingItem ? { ...data, id: editingItem.id } : data

      console.log('[MenuManagement] handleItemSubmit - sending request:', {
        method,
        url,
        activeBranchId,
        body: { ...body, ingredients: body.ingredients?.length || 0, allergens: body.allergens?.length || 0 }
      })

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      let result: any
      try {
        result = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        toast.error('Sunucudan geçersiz yanıt alındı')
        setSubmittingItem(false)
        return
      }

      if (!response.ok) {
        console.error('API error response:', {
          status: response.status,
          statusText: response.statusText,
          error: result.error,
          details: result.details,
        })
        
        if (result.error === 'AR_LIMIT_REACHED') {
          toast.error(result.message || 'AR ürün limitine ulaştınız. Planınızı yükseltin.')
        } else {
          const errorMessage = result.error || result.details || `Sunucu hatası: ${response.status} ${response.statusText}`
          toast.error(errorMessage)
        }
        setSubmittingItem(false)
        return
      }

      toast.success(editingItem ? 'Ürün güncellendi' : 'Ürün eklendi')
      setSubmittingItem(false)
      setShowItemModal(false)
      setEditingItem(null)
      setImagePreview(null)
      setOptimizedImageInfo(null)
      setOptimizedImageBlob(null)
      setIngredients([])
      setIngredientInput('')
      setSelectedRecommendedItems([])
      setSelectedAllergens([])
      // Reset form data
      setItemFormData({
        category_id: '',
        name: '',
        description: '',
        price: '',
        sort_order: '',
        is_active: true,
        has_ar: false,
        model_glb: '',
        model_usdz: '',
        name_en: '',
        name_ar: '',
        description_en: '',
        description_ar: '',
      })
      loadData()
    } catch (error: any) {
      toast.error('Hata: ' + error.message)
      setSubmittingItem(false)
    }
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setImagePreview(null)
      setOptimizedImageInfo(null)
      setOptimizedImageBlob(null)
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Sadece JPG/PNG/WebP formatları destekleniyor.')
      e.target.value = '' // Clear input
      return
    }

    setOptimizingImage(true)
    setImagePreview(null)
    setOptimizedImageInfo(null)
    setOptimizedImageBlob(null)

    try {
      // Optimize image
      const result: OptimizeImageResult = await optimizeImage(file)

      // Create preview from optimized blob
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(result.blob)

      // Store optimized blob and info
      setOptimizedImageBlob(result.blob)
      setOptimizedImageInfo({
        size: result.optimizedSize,
        format: result.format,
        originalSize: result.originalSize,
      })
    } catch (error: any) {
      toast.error(error.message || 'Görsel optimize edilemedi')
      e.target.value = '' // Clear input
      setImagePreview(null)
      setOptimizedImageInfo(null)
      setOptimizedImageBlob(null)
    } finally {
      setOptimizingImage(false)
    }
  }

  const handleCategoryImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setCategoryImagePreview(null)
      setOptimizedCategoryImageInfo(null)
      setOptimizedCategoryImageBlob(null)
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Sadece JPG/PNG/WebP formatları destekleniyor.')
      e.target.value = '' // Clear input
      return
    }

    setOptimizingCategoryImage(true)
    setCategoryImagePreview(null)
    setOptimizedCategoryImageInfo(null)
    setOptimizedCategoryImageBlob(null)

    try {
      // Optimize image
      const result: OptimizeImageResult = await optimizeImage(file)

      // Create preview from optimized blob
      const reader = new FileReader()
      reader.onloadend = () => {
        setCategoryImagePreview(reader.result as string)
      }
      reader.readAsDataURL(result.blob)

      // Store optimized blob and info
      setOptimizedCategoryImageBlob(result.blob)
      setOptimizedCategoryImageInfo({
        size: result.optimizedSize,
        format: result.format,
        originalSize: result.originalSize,
      })
    } catch (error: any) {
      toast.error(error.message || 'Görsel optimize edilemedi')
      e.target.value = '' // Clear input
      setCategoryImagePreview(null)
      setOptimizedCategoryImageInfo(null)
      setOptimizedCategoryImageBlob(null)
    } finally {
      setOptimizingCategoryImage(false)
    }
  }

  const handleEditItem = (item: MenuItem) => {
    setSubmittingItem(false)
    setEditingItem(item)
    setImagePreview(null) // Reset preview when editing
    setOptimizedImageInfo(null)
    setOptimizedImageBlob(null)
    setIngredients(item.ingredients || [])
    setIngredientInput('')
    setSelectedRecommendedItems(item.recommended_item_ids || [])
    setSelectedAllergens(item.allergens || [])
    setRecommendedItemsSearchQuery('')
    setActiveItemTab('genel')
    // Set form data from item
    setItemFormData({
      category_id: item.category_id || '',
      subcategory_id: item.subcategory_id || '',
      name: item.name || '',
      description: item.description || '',
      price: item.price?.toString() || '',
      sort_order: item.sort_order?.toString() || '',
      is_active: item.is_active ?? true,
      has_ar: item.has_ar ?? false,
      model_glb: item.model_glb || '',
      model_usdz: item.model_usdz || '',
      name_en: item.name_en ?? '',
      name_ar: item.name_ar ?? '',
      description_en: item.description_en ?? '',
      description_ar: item.description_ar ?? '',
    })
    // Load subcategories for the item's category so subcategory dropdown is populated
    if (item.category_id) {
      void (async () => {
        try {
          setCategorySubcategoriesLoading(true)
          const response = await fetch(`/api/subcategories?category_id=${encodeURIComponent(item.category_id)}`)
          const result = await response.json()
          if (!response.ok) {
            throw new Error(result.error || 'Alt kategoriler yüklenemedi')
          }
          setCategorySubcategories(result.data || [])
        } catch (error) {
          console.error('[MenuManagement] Failed to load subcategories for edit:', error)
        } finally {
          setCategorySubcategoriesLoading(false)
        }
      })()
    } else {
      setCategorySubcategories([])
    }
    setShowItemModal(true)
  }

  // Handle URL query param for edit (after items are loaded and handleEditItem is defined)
  useEffect(() => {
    const editItemId = searchParams.get('edit')
    if (editItemId && items.length > 0 && !editingItem && !showItemModal) {
      const itemToEdit = items.find(item => item.id === editItemId)
      if (itemToEdit) {
        handleEditItem(itemToEdit)
        // Clean up URL without scroll
        const url = new URL(window.location.href)
        url.searchParams.delete('edit')
        window.history.replaceState({}, '', url.toString())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, items, editingItem, showItemModal])

  const handleNewItem = () => {
    setSubmittingItem(false)
    setEditingItem(null)
    setImagePreview(null)
    setOptimizedImageInfo(null)
    setOptimizedImageBlob(null)
    setIngredients([])
    setIngredientInput('')
    setSelectedRecommendedItems([])
    setSelectedAllergens([])
    setRecommendedItemsSearchQuery('')
    setCategorySubcategories([])
    setActiveItemTab('genel')
    // Reset form data for new item
    setItemFormData({
      category_id: '',
      subcategory_id: '',
      name: '',
      description: '',
      price: '',
      sort_order: items.length > 0 ? (Math.max(...items.map(i => i.sort_order || 0)) + 1).toString() : '0',
      is_active: true,
      has_ar: false,
      model_glb: '',
      model_usdz: '',
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
    })
    setShowItemModal(true)
  }

  const handleToggleAllergen = (allergenKey: string) => {
    if (selectedAllergens.includes(allergenKey)) {
      setSelectedAllergens(selectedAllergens.filter(key => key !== allergenKey))
    } else if (selectedAllergens.length < 20) {
      setSelectedAllergens([...selectedAllergens, allergenKey])
    }
  }

  const handleAddIngredient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && ingredientInput.trim()) {
      e.preventDefault()
      const trimmed = ingredientInput.trim().substring(0, 40)
      if (trimmed && ingredients.length < 20 && !ingredients.includes(trimmed)) {
        setIngredients([...ingredients, trimmed])
        setIngredientInput('')
      }
    }
  }

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleToggleRecommendedItem = (itemId: string) => {
    if (selectedRecommendedItems.includes(itemId)) {
      setSelectedRecommendedItems(selectedRecommendedItems.filter(id => id !== itemId))
    } else if (selectedRecommendedItems.length < 6 && itemId !== editingItem?.id) {
      setSelectedRecommendedItems([...selectedRecommendedItems, itemId])
    }
  }

  const handleDeleteCategory = async (id: string) => {
    // Check subscription status (soft lock)
    if (!hasActiveSubscription) {
      toast.error('Aboneliğiniz sona ermiş. Devam etmek için lütfen ödeme yapın.')
      router.push('/dashboard/billing')
      return
    }
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id)
      if (error) throw error
      toast.success('Kategori silindi')
      loadData()
    } catch (error: any) {
      toast.error('Hata: ' + error.message)
    }
  }

  const loadSubcategoriesForCategory = async (categoryId: string) => {
    try {
      setSubcategoriesLoading(true)
      const response = await fetch(`/api/subcategories?category_id=${encodeURIComponent(categoryId)}`)
      const result = await response.json()
      if (!response.ok) {
        console.error('[Subcategories] Load failed:', result)
        throw new Error(result.error || 'Alt kategoriler yüklenemedi')
      }
      setSubcategories(result.data || [])
    } catch (error: any) {
      console.error('[Subcategories] Load error:', error)
      toast.error(error.message || 'Alt kategoriler yüklenirken hata oluştu')
    } finally {
      setSubcategoriesLoading(false)
    }
  }

  const handleOpenSubcategoryModal = (category: Category) => {
    setSubcategoryCategory(category)
    setNewSubcategoryName('')
    setEditingSubcategoryId(null)
    setEditingSubcategoryName('')
    setShowSubcategoryModal(true)
    void loadSubcategoriesForCategory(category.id)
  }

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subcategoryCategory) return

    if (!hasActiveSubscription) {
      toast.error('Aboneliğiniz sona ermiş. Devam etmek için lütfen ödeme yapın.')
      router.push('/dashboard/billing')
      return
    }

    const name = newSubcategoryName.trim()
    if (!name) {
      toast.error('Alt kategori adı giriniz')
      return
    }

    try {
      setSubcategoriesSaving(true)
      const response = await fetch('/api/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: subcategoryCategory.id,
          name,
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        console.error('[Subcategories] Create failed:', result)
        throw new Error(result.error || 'Alt kategori oluşturulamadı')
      }
      toast.success('Alt kategori eklendi')
      setNewSubcategoryName('')
      await loadSubcategoriesForCategory(subcategoryCategory.id)
    } catch (error: any) {
      toast.error(error.message || 'Alt kategori eklenirken hata oluştu')
    } finally {
      setSubcategoriesSaving(false)
    }
  }

  const handleStartEditSubcategory = (sub: Subcategory) => {
    setEditingSubcategoryId(sub.id)
    setEditingSubcategoryName(sub.name)
  }

  const handleSaveEditSubcategory = async () => {
    if (!subcategoryCategory || !editingSubcategoryId) return

    if (!hasActiveSubscription) {
      toast.error('Aboneliğiniz sona ermiş. Devam etmek için lütfen ödeme yapın.')
      router.push('/dashboard/billing')
      return
    }

    const name = editingSubcategoryName.trim()
    if (!name) {
      toast.error('Alt kategori adı giriniz')
      return
    }

    try {
      setSubcategoriesSaving(true)
      const response = await fetch('/api/subcategories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSubcategoryId,
          name,
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        console.error('[Subcategories] Update failed:', result)
        throw new Error(result.error || 'Alt kategori güncellenemedi')
      }
      toast.success('Alt kategori güncellendi')
      setEditingSubcategoryId(null)
      setEditingSubcategoryName('')
      await loadSubcategoriesForCategory(subcategoryCategory.id)
    } catch (error: any) {
      toast.error(error.message || 'Alt kategori güncellenirken hata oluştu')
    } finally {
      setSubcategoriesSaving(false)
    }
  }

  const handleDeleteSubcategory = async (id: string) => {
    if (!subcategoryCategory) return

    if (!hasActiveSubscription) {
      toast.error('Aboneliğiniz sona ermiş. Devam etmek için lütfen ödeme yapın.')
      router.push('/dashboard/billing')
      return
    }

    if (!confirm('Bu alt kategoriyi silmek istediğinize emin misiniz?')) return

    try {
      setSubcategoriesSaving(true)
      const response = await fetch('/api/subcategories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const result = await response.json()
      if (!response.ok) {
        console.error('[Subcategories] Delete failed:', result)
        throw new Error(result.error || 'Alt kategori silinemedi')
      }
      toast.success('Alt kategori silindi')
      await loadSubcategoriesForCategory(subcategoryCategory.id)
    } catch (error: any) {
      toast.error(error.message || 'Alt kategori silinirken hata oluştu')
    } finally {
      setSubcategoriesSaving(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    // Check subscription status (soft lock)
    if (!hasActiveSubscription) {
      toast.error('Aboneliğiniz sona ermiş. Devam etmek için lütfen ödeme yapın.')
      router.push('/dashboard/billing')
      return
    }

    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)
      if (error) throw error
      toast.success('Ürün silindi')
      loadData()
    } catch (error: any) {
      toast.error('Hata: ' + error.message)
    }
  }

  const toggleCategoryActive = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('menu_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id)
      if (error) throw error
      loadData()
    } catch (error: any) {
      toast.error('Hata: ' + error.message)
    }
  }

  const toggleItemActive = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_active: !item.is_active })
        .eq('id', item.id)
      if (error) throw error
      loadData()
    } catch (error: any) {
      toast.error('Hata: ' + error.message)
    }
  }

  const toggleBranchAvailability = async (item: MenuItemWithOverride) => {
    if (!activeBranchId) {
      toast.error('Lütfen önce bir şube seçin')
      return
    }

    const currentOverride = item.branchOverride
    const newAvailability = currentOverride ? !currentOverride.is_available : false

    try {
      const response = await fetch(`/api/branches/${activeBranchId}/menu-overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_item_id: item.id,
          is_available: newAvailability,
          stock_status: newAvailability ? 'in_stock' : 'out_of_stock',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Güncelleme başarısız')
      }

      toast.success(newAvailability ? 'Ürün şubede mevcut' : 'Ürün şubede mevcut değil')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Güncelleme hatası')
    }
  }

  // Show empty state if no branch selected (but allow if no branches exist yet)
  if (!loading && branches.length > 0 && !activeBranchId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800 font-medium mb-2">Şube Seçiniz</p>
        <p className="text-sm text-yellow-700 mb-4">
          Menü yönetimi için yukarıdaki dropdown'dan bir şube seçin.
        </p>
        <a
          href="/dashboard/branches"
          className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
        >
          Şube Yönetimi
        </a>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12">Yükleniyor...</div>
  }

  return (
    <div className="space-y-8">
      {/* AR Usage Info */}
      <div className="bg-white shadow rounded-lg p-4 border-l-4 border-primary-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">AR Kullanımı</h3>
            <p className="text-lg font-bold text-primary-600 mt-1">
              {arCount} / {limit === Infinity ? 'Sınırsız' : limit}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Plan: <span className="font-semibold capitalize">{plan}</span></p>
            {isLimitReached && (
              <p className="text-xs text-red-600 mt-1">Limit dolu</p>
            )}
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Kategoriler</h2>
          <button
            onClick={() => {
              setEditingCategory(null)
              setCategoryImagePreview(null)
              setOptimizedCategoryImageInfo(null)
              setOptimizedCategoryImageBlob(null)
              setShowCategoryModal(true)
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            + Kategori Ekle
          </button>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Kategori adı ile ara..."
              value={categorySearchQuery}
              onChange={(e) => setCategorySearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {categorySearchQuery && (
              <button
                onClick={() => setCategorySearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Filter categories by search query */}
        {(() => {
          const filteredCategories = categorySearchQuery
            ? categories.filter((category) =>
                category.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
              )
            : categories

          return (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sıra
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                          {categorySearchQuery ? `"${categorySearchQuery}" için sonuç bulunamadı` : 'Henüz kategori eklenmedi'}
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.sort_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleCategoryActive(category)}
                        className={`px-2 py-1 text-xs rounded-full ${
                          category.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {category.is_active ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => {
                          setEditingCategory(category)
                          setCategoryImagePreview(null)
                          setOptimizedCategoryImageInfo(null)
                          setOptimizedCategoryImageBlob(null)
                          setShowCategoryModal(true)
                        }}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleOpenSubcategoryModal(category)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Alt Kategoriler
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Sil
                      </button>
                    </td>
                    </tr>
                  ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredCategories.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {categorySearchQuery ? `"${categorySearchQuery}" için sonuç bulunamadı` : 'Henüz kategori eklenmedi'}
                  </div>
                ) : (
                  filteredCategories.map((category) => (
                <div key={category.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {category.name}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">Sıra: {category.sort_order}</p>
                    </div>
                    <button
                      onClick={() => toggleCategoryActive(category)}
                      className={`px-2 py-1 text-xs rounded-full shrink-0 ml-2 ${
                        category.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {category.is_active ? 'Aktif' : 'Pasif'}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingCategory(category)
                        setCategoryImagePreview(null)
                        setOptimizedCategoryImageInfo(null)
                        setOptimizedCategoryImageBlob(null)
                        setShowCategoryModal(true)
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-900 border border-primary-600 rounded-md hover:bg-primary-50"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleOpenSubcategoryModal(category)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Alt Kategoriler
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-900 border border-red-600 rounded-md hover:bg-red-50"
                    >
                      Sil
                    </button>
                  </div>
                  </div>
                ))
                )}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Items Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Menü Ürünleri</h2>
          <button
            onClick={handleNewItem}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            disabled={categories.length === 0}
          >
            + Ürün Ekle
          </button>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Ürün adı ile ara..."
              value={itemSearchQuery}
              onChange={(e) => setItemSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {itemSearchQuery && (
              <button
                onClick={() => setItemSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {categories.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Önce bir kategori oluşturmanız gerekiyor.
            </p>
          </div>
        )}

        {/* Filter items by search query */}
        {(() => {
          const filteredItems = itemSearchQuery
            ? items.filter((item) =>
                item.name.toLowerCase().includes(itemSearchQuery.toLowerCase())
              )
            : items

          return (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fiyat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durumlar
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                          {itemSearchQuery ? `"${itemSearchQuery}" için sonuç bulunamadı` : 'Henüz ürün eklenmedi'}
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                  const category = categories.find(c => c.id === item.category_id)
                  const hasPhoto = !!(item.image_path || item.image_url)
                  const hasAR = !!(item.has_ar && (item.model_glb || item.model_usdz))
                  const hasAllergens = !!(item.allergens && Array.isArray(item.allergens) && item.allergens.length > 0)
                  const hasIngredients = !!(item.ingredients && Array.isArray(item.ingredients) && item.ingredients.length > 0)
                  const hasUpsell = !!(item.recommended_item_ids && Array.isArray(item.recommended_item_ids) && item.recommended_item_ids.length > 0)
                  
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category?.name || '-'}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <span>{item.effectivePrice.toFixed(2)} ₺</span>
                        {item.branchOverride?.price_override && (
                          <span className="text-xs text-gray-400 line-through">
                            {item.price.toFixed(2)} ₺
                          </span>
                        )}
                      </div>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleItemActive(item)}
                          className={`px-2 py-1 text-xs rounded-full ${
                            item.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.is_active ? 'Aktif' : 'Pasif'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              hasPhoto
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                            title={hasPhoto ? 'Fotoğraf var' : 'Fotoğraf eksik'}
                          >
                            {hasPhoto ? '✅' : '❌'} Foto
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              hasAR
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                            title={hasAR ? 'AR var' : 'AR yok'}
                          >
                            {hasAR ? '✅' : '❌'} AR
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              hasAllergens
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                            title={hasAllergens ? 'Alerjen var' : 'Alerjen eksik'}
                          >
                            {hasAllergens ? '✅' : '⚠️'} Alerjen
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              hasIngredients
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                            title={hasIngredients ? 'İçindekiler var' : 'İçindekiler eksik'}
                          >
                            {hasIngredients ? '✅' : '⚠️'} İçerik
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              hasUpsell
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                            title={hasUpsell ? 'Upsell var' : 'Upsell yok'}
                          >
                            {hasUpsell ? '✅' : '⚠️'} Upsell
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {activeBranchId && (
                            <button
                              onClick={() => toggleBranchAvailability(item)}
                              className={`px-2 py-1 text-xs rounded-full ${
                                item.branchOverride?.is_available !== false
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                              title={item.branchOverride?.is_available !== false ? 'Şubede mevcut' : 'Şubede mevcut değil'}
                            >
                              {item.branchOverride?.is_available !== false ? '✓' : '✗'}
                            </button>
                          )}
                          <button
                            onClick={() => handleEditItem(item)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                      )
                    }))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredItems.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {itemSearchQuery ? `"${itemSearchQuery}" için sonuç bulunamadı` : 'Henüz ürün eklenmedi'}
                  </div>
                ) : (
                  filteredItems.map((item) => {
                const category = categories.find(c => c.id === item.category_id)
                const hasPhoto = !!(item.image_path || item.image_url)
                const hasAR = !!(item.has_ar && (item.model_glb || item.model_usdz))
                const hasAllergens = !!(item.allergens && Array.isArray(item.allergens) && item.allergens.length > 0)
                const hasIngredients = !!(item.ingredients && Array.isArray(item.ingredients) && item.ingredients.length > 0)
                const hasUpsell = !!(item.recommended_item_ids && Array.isArray(item.recommended_item_ids) && item.recommended_item_ids.length > 0)
                
                return (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          {category?.name || 'Kategori yok'} • {item.effectivePrice.toFixed(2)} ₺
                          {item.branchOverride?.price_override && (
                            <span className="ml-1 text-gray-400 line-through">
                              {item.price.toFixed(2)} ₺
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleItemActive(item)}
                        className={`px-2 py-1 text-xs rounded-full shrink-0 ${
                          item.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.is_active ? 'Aktif' : 'Pasif'}
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          hasPhoto
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {hasPhoto ? '✅' : '❌'} Foto
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          hasAR
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {hasAR ? '✅' : '❌'} AR
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          hasAllergens
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {hasAllergens ? '✅' : '⚠️'} Alerjen
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          hasIngredients
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {hasIngredients ? '✅' : '⚠️'} İçerik
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          hasUpsell
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {hasUpsell ? '✅' : '⚠️'} Upsell
                      </span>
                    </div>
                    
                    <div className="flex gap-2 pt-1">
                      {activeBranchId && (
                        <button
                          onClick={() => toggleBranchAvailability(item)}
                          className={`px-3 py-2 text-sm font-medium rounded-md border ${
                            item.branchOverride?.is_available !== false
                              ? 'bg-green-50 text-green-800 border-green-300 hover:bg-green-100'
                              : 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
                          }`}
                        >
                          {item.branchOverride?.is_available !== false ? '✓ Mevcut' : '✗ Mevcut Değil'}
                        </button>
                      )}
                      <button
                        onClick={() => handleEditItem(item)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-900 border border-primary-600 rounded-md hover:bg-primary-50"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-900 border border-red-600 rounded-md hover:bg-red-50"
                      >
                        Sil
                      </button>
                    </div>
                    </div>
                  )
                })
                )}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto z-50 flex items-start justify-center p-4">
          <div className="relative w-full max-w-md mt-4 mb-4 p-4 sm:p-5 border shadow-lg rounded-md bg-white max-h-[calc(100vh-2rem)] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}
            </h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori Adı
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingCategory?.name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sıra
                </label>
                <input
                  type="number"
                  name="sort_order"
                  defaultValue={
                    editingCategory?.sort_order ?? 
                    (categories.length > 0 
                      ? Math.max(...categories.map(c => c.sort_order || 0)) + 1 
                      : 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori Görseli
                </label>
                <input
                  type="file"
                  name="category_image_file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleCategoryImageFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={uploadingCategoryImage || optimizingCategoryImage}
                />
                <p className="mt-1 text-xs text-gray-500">
                  JPEG, PNG veya WebP formatında (otomatik optimize edilir)
                </p>
                {optimizingCategoryImage && (
                  <p className="mt-2 text-xs text-blue-600">Görsel optimize ediliyor...</p>
                )}
                {categoryImagePreview && optimizedCategoryImageInfo && (
                  <div className="mt-2 space-y-2">
                    <div className="relative">
                      <img
                        src={categoryImagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-md border border-gray-300"
                      />
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Format:</span>{' '}
                        {optimizedCategoryImageInfo.format === 'image/webp' ? 'WebP' : 'JPEG'}
                      </p>
                      <p>
                        <span className="font-medium">Boyut:</span>{' '}
                        {(optimizedCategoryImageInfo.size / 1024).toFixed(1)} KB
                        {optimizedCategoryImageInfo.originalSize !== optimizedCategoryImageInfo.size && (
                          <span className="text-gray-500 ml-1">
                            (Orijinal: {(optimizedCategoryImageInfo.originalSize / 1024).toFixed(1)} KB)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {editingCategory?.image_url && !categoryImagePreview && !optimizingCategoryImage && (
                  <p className="mt-2 text-xs text-gray-600">
                    Mevcut görsel yüklü
                  </p>
                )}
                {uploadingCategoryImage && (
                  <p className="mt-2 text-xs text-blue-600">Yükleniyor...</p>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false)
                    setEditingCategory(null)
                    setCategoryImagePreview(null)
                    setOptimizedCategoryImageInfo(null)
                    setOptimizedCategoryImageBlob(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  disabled={uploadingCategoryImage || optimizingCategoryImage}
                >
                  {uploadingCategoryImage ? 'Yükleniyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subcategory Modal */}
      {showSubcategoryModal && subcategoryCategory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto z-50 flex items-start justify-center p-4">
          <div className="relative w-full max-w-md mt-4 mb-4 p-4 sm:p-5 border shadow-lg rounded-md bg-white max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Alt Kategoriler</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Ana kategori: <span className="font-medium">{subcategoryCategory.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSubcategoryModal(false)
                  setSubcategoryCategory(null)
                  setSubcategories([])
                  setNewSubcategoryName('')
                  setEditingSubcategoryId(null)
                  setEditingSubcategoryName('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSubcategory} className="mb-4 flex gap-2">
              <input
                type="text"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                placeholder="Alt kategori adı..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                disabled={subcategoriesSaving}
              >
                {subcategoriesSaving ? 'Ekleniyor...' : 'Ekle'}
              </button>
            </form>

            {subcategoriesLoading ? (
              <p className="text-sm text-gray-500">Alt kategoriler yükleniyor...</p>
            ) : subcategories.length === 0 ? (
              <p className="text-sm text-gray-500">
                Bu kategori için henüz alt kategori eklenmemiş.
              </p>
            ) : (
              <ul className="space-y-2">
                {subcategories.map((sub) => {
                  const isEditing = editingSubcategoryId === sub.id
                  return (
                    <li
                      key={sub.id}
                      className="flex items-center justify-between gap-2 border border-gray-200 rounded-md px-3 py-2"
                    >
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingSubcategoryName}
                            onChange={(e) => setEditingSubcategoryName(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {sub.name}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5">
                          Sıra: {sub.sort_order}{' '}
                          {sub.is_active ? '(Aktif)' : '(Pasif)'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={handleSaveEditSubcategory}
                              className="px-2 py-1 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700"
                              disabled={subcategoriesSaving}
                            >
                              Kaydet
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSubcategoryId(null)
                                setEditingSubcategoryName('')
                              }}
                              className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
                            >
                              İptal
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEditSubcategory(sub)}
                              className="px-2 py-1 text-xs text-primary-600 hover:text-primary-900"
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubcategory(sub.id)}
                              className="px-2 py-1 text-xs text-red-600 hover:text-red-900"
                              disabled={subcategoriesSaving}
                            >
                              Sil
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Item Modal - Tab-Based */}
      {showItemModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto z-50 flex items-start justify-center p-4">
          <div className="relative w-full max-w-4xl mt-4 mb-4 p-4 sm:p-5 border shadow-lg rounded-md bg-white max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                {editingItem ? 'Ürün Düzenle' : 'Yeni Ürün'}
              </h3>
              <button
                onClick={() => {
                  setShowItemModal(false)
                  setEditingItem(null)
                  setRecommendedItemsSearchQuery('')
                  setActiveItemTab('genel')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex space-x-4 overflow-x-auto">
                {[
                  { id: 'genel' as const, label: 'Genel' },
                  { id: 'icindekiler' as const, label: 'İçindekiler' },
                  { id: 'alerjenler' as const, label: 'Alerjenler' },
                  { id: 'upsell' as const, label: 'Yanında İyi Gider' },
                  { id: 'ar' as const, label: 'AR' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveItemTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeItemTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <form onSubmit={handleItemSubmit} className="flex-1 overflow-y-auto">
              {/* Hidden field to ensure category_id is always in form data when editing and not on Genel tab */}
              {editingItem && activeItemTab !== 'genel' && (
                <input
                  type="hidden"
                  name="category_id"
                  value={editingItem.category_id}
                />
              )}
              {/* Tab A: Genel */}
              {activeItemTab === 'genel' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori *
                    </label>
                    <select
                      name="category_id"
                      required
                      value={itemFormData.category_id}
                      onChange={async (e) => {
                        const value = e.target.value
                        setItemFormData({ ...itemFormData, category_id: value, subcategory_id: '' })
                        setCategorySubcategories([])
                        if (!value) return
                        try {
                          setCategorySubcategoriesLoading(true)
                          const response = await fetch(`/api/subcategories?category_id=${encodeURIComponent(value)}`)
                          const result = await response.json()
                          if (!response.ok) {
                            throw new Error(result.error || 'Alt kategoriler yüklenemedi')
                          }
                          setCategorySubcategories(result.data || [])
                        } catch (error: any) {
                          console.error('[MenuManagement] Failed to load subcategories for category change:', error)
                          toast.error(error.message || 'Alt kategoriler yüklenirken hata oluştu')
                        } finally {
                          setCategorySubcategoriesLoading(false)
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Seçiniz</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {categorySubcategoriesLoading && (
                      <p className="mt-1 text-xs text-gray-500">Alt kategoriler yükleniyor...</p>
                    )}
                    {!categorySubcategoriesLoading && categorySubcategories.length > 0 && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alt Kategori (opsiyonel)
                        </label>
                        <select
                          name="subcategory_id"
                          value={itemFormData.subcategory_id}
                          onChange={(e) =>
                            setItemFormData({ ...itemFormData, subcategory_id: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="">Seçiniz</option>
                          {categorySubcategories.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ürün Adı *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={itemFormData.name}
                      onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Açıklama
                    </label>
                    <textarea
                      name="description"
                      value={itemFormData.description}
                      onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fiyat (₺) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      step="0.01"
                      required
                      value={itemFormData.price}
                      onChange={(e) => setItemFormData({ ...itemFormData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Görsel
                    </label>
                    <input
                      type="file"
                      name="image_file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={uploadingImage || optimizingImage}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      JPEG, PNG veya WebP formatında (otomatik optimize edilir)
                    </p>
                    {optimizingImage && (
                      <p className="mt-2 text-xs text-blue-600">Görsel optimize ediliyor...</p>
                    )}
                    {imagePreview && optimizedImageInfo && (
                      <div className="mt-2 space-y-2">
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-md border border-gray-300"
                          />
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Format:</span>{' '}
                            {optimizedImageInfo.format === 'image/webp' ? 'WebP' : 'JPEG'}
                          </p>
                          <p>
                            <span className="font-medium">Boyut:</span>{' '}
                            {(optimizedImageInfo.size / 1024).toFixed(1)} KB
                            {optimizedImageInfo.originalSize !== optimizedImageInfo.size && (
                              <span className="text-gray-500 ml-1">
                                (Orijinal: {(optimizedImageInfo.originalSize / 1024).toFixed(1)} KB)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                    {editingItem?.image_url && !imagePreview && !optimizingImage && (
                      <p className="mt-2 text-xs text-gray-600">
                        Mevcut görsel: {editingItem.image_url}
                      </p>
                    )}
                    {uploadingImage && (
                      <p className="mt-2 text-xs text-blue-600">Yükleniyor...</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sıra
                    </label>
                    <input
                      type="number"
                      name="sort_order"
                      value={itemFormData.sort_order}
                      onChange={(e) => setItemFormData({ ...itemFormData, sort_order: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={itemFormData.is_active}
                        onChange={(e) => setItemFormData({ ...itemFormData, is_active: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Aktif</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab B: İçindekiler */}
              {activeItemTab === 'icindekiler' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      İçindekiler ({ingredients.length}/20)
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={ingredientInput}
                        onChange={(e) => setIngredientInput(e.target.value)}
                        onKeyDown={handleAddIngredient}
                        placeholder="İçindekileri girin (Enter ile ekle)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        maxLength={40}
                        disabled={ingredients.length >= 20}
                      />
                    </div>
                    {ingredients.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {ingredients.map((ing, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs"
                          >
                            {ing}
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(idx)}
                              className="hover:text-primary-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Maksimum 20 içindekiler, her biri maksimum 40 karakter
                    </p>
                  </div>
                </div>
              )}

              {/* Tab C: Alerjenler */}
              {activeItemTab === 'alerjenler' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Alerjenler</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                      {ALLERGENS.map((allergen) => (
                        <label
                          key={allergen.key}
                          className="flex items-center p-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAllergens.includes(allergen.key)}
                            onChange={() => handleToggleAllergen(allergen.key)}
                            disabled={!selectedAllergens.includes(allergen.key) && selectedAllergens.length >= 20}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">
                            <span className="mr-1">{allergen.icon}</span>
                            {allergen.label}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Maksimum 20 alerjen seçebilirsiniz ({selectedAllergens.length}/20)
                    </p>
                  </div>
                </div>
              )}

              {/* Tab D: Yanında İyi Gider */}
              {activeItemTab === 'upsell' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Yanında İyi Gider ({selectedRecommendedItems.length}/6)
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Bu ürünle birlikte önerilecek diğer ürünleri seçin
                    </p>
                    <p className="text-xs text-gray-400 mb-3 italic">
                      💡 Not: Bu ürünle birlikte alındı önerileri otomatik hesaplanır (rule-based).
                    </p>
                    
                    {/* Search Input */}
                    <div className="mb-3">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Ürün adı ile ara..."
                          value={recommendedItemsSearchQuery}
                          onChange={(e) => setRecommendedItemsSearchQuery(e.target.value)}
                          className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        />
                        {recommendedItemsSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setRecommendedItemsSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {(() => {
                        const filteredItems = items
                          .filter((i) => {
                            // Filter out current editing item and inactive items
                            if (i.id === editingItem?.id || !i.is_active) return false
                            // Apply search filter
                            if (recommendedItemsSearchQuery) {
                              return i.name.toLowerCase().includes(recommendedItemsSearchQuery.toLowerCase())
                            }
                            return true
                          })

                        return filteredItems.length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-4">
                            {recommendedItemsSearchQuery 
                              ? `"${recommendedItemsSearchQuery}" için sonuç bulunamadı` 
                              : 'Öneri için başka ürün bulunmuyor'}
                          </p>
                        ) : (
                          filteredItems.map((i) => (
                          <label
                            key={i.id}
                            className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedRecommendedItems.includes(i.id)}
                              onChange={() => handleToggleRecommendedItem(i.id)}
                              disabled={!selectedRecommendedItems.includes(i.id) && selectedRecommendedItems.length >= 6}
                              className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 flex-1">{i.name}</span>
                            <span className="text-xs text-gray-500 ml-2">{i.price.toFixed(2)} ₺</span>
                          </label>
                          ))
                        )
                      })()}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Maksimum 6 ürün seçebilirsiniz
                    </p>
                  </div>
                </div>
              )}

              {/* Tab E: AR */}
              {activeItemTab === 'ar' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">AR Özellikleri</h4>
                    <div className="mb-3">
                      <div className="relative group">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="has_ar"
                            checked={itemFormData.has_ar}
                            onChange={(e) => setItemFormData({ ...itemFormData, has_ar: e.target.checked })}
                            disabled={isLimitReached && (!editingItem || !editingItem.has_ar)}
                            title={isLimitReached && (!editingItem || !editingItem.has_ar) ? "Paket limitine ulaşıldı. Premium'a geç." : undefined}
                            className="mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className={`text-sm ${isLimitReached && (!editingItem || !editingItem.has_ar) ? 'text-gray-400' : 'text-gray-700'}`}>
                            AR Desteği
                          </span>
                        </label>
                        {isLimitReached && (!editingItem || !editingItem.has_ar) && (
                          <div className="absolute left-0 top-6 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none shadow-lg">
                            Paket limitine ulaşıldı. Premium'a geç.
                            <div className="absolute -top-1 left-2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                          </div>
                        )}
                      </div>
                      {isLimitReached && (!editingItem || !editingItem.has_ar) && (
                        <p className="text-xs text-red-600 mt-1 ml-6">
                          Paket limitine ulaşıldı. Premium'a geç.
                        </p>
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GLB Model URL (Android/Web)
                      </label>
                      <input
                        type="url"
                        name="model_glb"
                        value={itemFormData.model_glb}
                        onChange={(e) => setItemFormData({ ...itemFormData, model_glb: e.target.value })}
                        placeholder="/models/product.glb"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        USDZ Model URL (iOS)
                      </label>
                      <input
                        type="url"
                        name="model_usdz"
                        value={itemFormData.model_usdz}
                        onChange={(e) => setItemFormData({ ...itemFormData, model_usdz: e.target.value })}
                        placeholder="/models/product.usdz"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      AR ürünü için: "AR Desteği" işaretleyin ve GLB model URL'i girin. Plan limitinize dikkat edin.
                    </p>
                  </div>
                </div>
              )}

              {/* Footer - Always visible */}
              <div className="mt-6 pt-4 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittingItem(false)
                    setShowItemModal(false)
                    setEditingItem(null)
                    setRecommendedItemsSearchQuery('')
                    setActiveItemTab('genel')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submittingItem}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingItem ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

