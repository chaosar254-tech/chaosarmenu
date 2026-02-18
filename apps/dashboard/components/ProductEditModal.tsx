'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { ALLERGENS } from '@/lib/allergens'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  image_path: string | null
  category_id: string
  is_active: boolean
  sort_order: number
  has_ar?: boolean
  model_glb?: string | null
  model_usdz?: string | null
  ingredients?: string[] | null
  recommended_item_ids?: string[] | null
  allergens?: string[] | null
  name_en?: string | null
  name_ar?: string | null
  description_en?: string | null
  description_ar?: string | null
}

interface Category {
  id: string
  name: string
}

interface ProductEditModalProps {
  isOpen: boolean
  onClose: () => void
  item: MenuItem | null
  categories: Category[]
  allItems: MenuItem[]
  onSubmit: (data: any) => Promise<void>
  restaurantId: string
  isLimitReached: boolean
  onImageChange?: (file: File) => void
  imagePreview?: string | null
  optimizingImage?: boolean
  uploadingImage?: boolean
}

type TabId = 'genel' | 'icindekiler' | 'alerjenler' | 'yakin-da-iyi-gider' | 'ceviriler' | 'ar'

export default function ProductEditModal({
  isOpen,
  onClose,
  item,
  categories,
  allItems,
  onSubmit,
  restaurantId,
  isLimitReached,
  onImageChange,
  imagePreview,
  optimizingImage,
  uploadingImage,
}: ProductEditModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('genel')
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState(item?.name || '')
  const [description, setDescription] = useState(item?.description || '')
  const [price, setPrice] = useState(item?.price?.toString() || '')
  const [categoryId, setCategoryId] = useState(item?.category_id || '')
  const [isActive, setIsActive] = useState(item?.is_active !== false)
  const [sortOrder, setSortOrder] = useState(item?.sort_order?.toString() || '0')
  const [ingredients, setIngredients] = useState<string[]>(item?.ingredients || [])
  const [ingredientInput, setIngredientInput] = useState('')
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(item?.allergens || [])
  const [selectedRecommendedItems, setSelectedRecommendedItems] = useState<string[]>(item?.recommended_item_ids || [])
  const [hasAr, setHasAr] = useState(item?.has_ar || false)
  const [modelGlb, setModelGlb] = useState(item?.model_glb || '')
  const [modelUsdz, setModelUsdz] = useState(item?.model_usdz || '')
  const [nameEn, setNameEn] = useState(item?.name_en ?? '')
  const [nameAr, setNameAr] = useState(item?.name_ar ?? '')
  const [descriptionEn, setDescriptionEn] = useState(item?.description_en ?? '')
  const [descriptionAr, setDescriptionAr] = useState(item?.description_ar ?? '')

  // Sync translation fields when item changes (e.g. opening modal for another product)
  useEffect(() => {
    if (!item) return
    setNameEn(item.name_en ?? '')
    setNameAr(item.name_ar ?? '')
    setDescriptionEn(item.description_en ?? '')
    setDescriptionAr(item.description_ar ?? '')
  }, [item?.id, item?.name_en, item?.name_ar, item?.description_en, item?.description_ar])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId || !name || !price) {
      alert('Lütfen zorunlu alanları doldurun')
      return
    }

    setSaving(true)
    try {
      await onSubmit({
        id: item?.id,
        restaurant_id: restaurantId,
        category_id: categoryId,
        name,
        description: description || null,
        price: parseFloat(price),
        image_path: item?.image_path || null,
        sort_order: parseInt(sortOrder) || 0,
        is_active: isActive,
        has_ar: hasAr,
        model_glb: modelGlb || null,
        model_usdz: modelUsdz || null,
        ingredients: ingredients.length > 0 ? ingredients : null,
        recommended_item_ids: selectedRecommendedItems.length > 0 ? selectedRecommendedItems : null,
        allergens: selectedAllergens.length > 0 ? selectedAllergens : [],
        name_en: nameEn.trim() || null,
        name_ar: nameAr.trim() || null,
        description_en: descriptionEn.trim() || null,
        description_ar: descriptionAr.trim() || null,
      })
      onClose()
    } catch (error) {
      console.error('Error saving item:', error)
    } finally {
      setSaving(false)
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

  const handleToggleAllergen = (allergenKey: string) => {
    if (selectedAllergens.includes(allergenKey)) {
      setSelectedAllergens(selectedAllergens.filter(key => key !== allergenKey))
    } else if (selectedAllergens.length < 20) {
      setSelectedAllergens([...selectedAllergens, allergenKey])
    }
  }

  const handleToggleRecommendedItem = (itemId: string) => {
    if (selectedRecommendedItems.includes(itemId)) {
      setSelectedRecommendedItems(selectedRecommendedItems.filter(id => id !== itemId))
    } else if (selectedRecommendedItems.length < 6 && itemId !== item?.id) {
      setSelectedRecommendedItems([...selectedRecommendedItems, itemId])
    }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'genel', label: 'Genel' },
    { id: 'icindekiler', label: 'İçindekiler' },
    { id: 'alerjenler', label: 'Alerjenler' },
    { id: 'yakin-da-iyi-gider', label: 'Yanında İyi Gider' },
    { id: 'ceviriler', label: 'Çeviriler' },
    { id: 'ar', label: 'AR' },
  ]

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-zinc-900 dark:border-zinc-700 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b dark:border-zinc-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {item ? 'Ürün Düzenle' : 'Yeni Ürün'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-zinc-700 mb-4">
          <nav className="-mb-px flex space-x-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-zinc-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {/* Tab A: Genel */}
          {activeTab === 'genel' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Kategori *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                >
                  <option value="">Seçiniz</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Ürün Adı *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Fiyat (₺) *
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Görsel
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && onImageChange) {
                      onImageChange(file)
                    }
                  }}
                  disabled={uploadingImage || optimizingImage}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-zinc-800 dark:text-white dark:border-zinc-700 disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  JPEG, PNG veya WebP formatında (otomatik optimize edilir)
                </p>
                {optimizingImage && (
                  <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">Görsel optimize ediliyor...</p>
                )}
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-md border border-gray-300"
                    />
                  </div>
                )}
                {item?.image_url && !imagePreview && !optimizingImage && (
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    Mevcut görsel: {item.image_url}
                  </p>
                )}
                {uploadingImage && (
                  <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">Yükleniyor...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Sıra
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Aktif</span>
                </label>
              </div>
            </div>
          )}

          {/* Tab B: İçindekiler */}
          {activeTab === 'icindekiler' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  İçindekiler ({ingredients.length}/20)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    onKeyDown={handleAddIngredient}
                    placeholder="İçindekileri girin (Enter ile ekle)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 dark:bg-zinc-800 dark:text-white dark:border-zinc-700 disabled:opacity-50"
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maksimum 20 içindekiler, her biri maksimum 40 karakter
                </p>
              </div>
            </div>
          )}

          {/* Tab C: Alerjenler */}
          {activeTab === 'alerjenler' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Alerjenler</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                  {ALLERGENS.map((allergen) => (
                    <label
                      key={allergen.key}
                      className="flex items-center p-2 border border-gray-300 dark:border-zinc-700 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer bg-white dark:bg-zinc-900"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAllergens.includes(allergen.key)}
                        onChange={() => handleToggleAllergen(allergen.key)}
                        disabled={!selectedAllergens.includes(allergen.key) && selectedAllergens.length >= 20}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        <span className="mr-1">{allergen.icon}</span>
                        {allergen.label}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Maksimum 20 alerjen seçebilirsiniz ({selectedAllergens.length}/20)
                </p>
              </div>
            </div>
          )}

          {/* Tab: Çeviriler (Translations) */}
          {activeTab === 'ceviriler' && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Müşteri menüde dili değiştirdiğinde bu alanlar kullanılır. Boş bırakılırsa Türkçe (Genel sekmesi) gösterilir.
              </p>
              <div className="space-y-6">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/50">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">English</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        Product Name (EN)
                      </label>
                      <input
                        type="text"
                        value={nameEn}
                        onChange={(e) => setNameEn(e.target.value)}
                        placeholder="English product name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        Description (EN)
                      </label>
                      <textarea
                        value={descriptionEn}
                        onChange={(e) => setDescriptionEn(e.target.value)}
                        rows={3}
                        placeholder="English description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/50">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">العربية (Arabic)</h4>
                  <div className="space-y-3" dir="rtl">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        اسم المنتج (AR)
                      </label>
                      <input
                        type="text"
                        value={nameAr}
                        onChange={(e) => setNameAr(e.target.value)}
                        placeholder="اسم المنتج بالعربية"
                        dir="rtl"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-zinc-800 dark:text-white dark:border-zinc-700 text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        الوصف (AR)
                      </label>
                      <textarea
                        value={descriptionAr}
                        onChange={(e) => setDescriptionAr(e.target.value)}
                        rows={3}
                        placeholder="الوصف بالعربية"
                        dir="rtl"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-zinc-800 dark:text-white dark:border-zinc-700 text-right"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab D: Yanında İyi Gider */}
          {activeTab === 'yakin-da-iyi-gider' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Yanında İyi Gider ({selectedRecommendedItems.length}/6)
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white dark:bg-zinc-800 dark:border-zinc-700">
                  {allItems
                    .filter((i) => i.id !== item?.id)
                    .map((i) => (
                      <label
                        key={i.id}
                        className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRecommendedItems.includes(i.id)}
                          onChange={() => handleToggleRecommendedItem(i.id)}
                          disabled={!selectedRecommendedItems.includes(i.id) && selectedRecommendedItems.length >= 6}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-200">{i.name}</span>
                        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{i.price.toFixed(2)} ₺</span>
                      </label>
                    ))}
                  {allItems.filter((i) => i.id !== item?.id).length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                      Öneri için başka ürün bulunmuyor
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maksimum 6 ürün seçebilirsiniz (kendi ürününüz hariç)
                </p>
              </div>
            </div>
          )}

          {/* Tab E: AR */}
          {activeTab === 'ar' && (
            <div className="space-y-4">
              <div className="p-4 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg bg-gray-50 dark:bg-zinc-900/50">
                <div className="mb-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={hasAr}
                      onChange={(e) => setHasAr(e.target.checked)}
                      disabled={isLimitReached && !item?.has_ar}
                      className="mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className={`text-sm ${isLimitReached && !item?.has_ar ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                      AR Desteği
                    </span>
                  </label>
                  {isLimitReached && !item?.has_ar && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 ml-6">
                      Paket limitine ulaşıldı. Premium'a geç.
                    </p>
                  )}
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    GLB Model URL (Android/Web)
                  </label>
                  <input
                    type="url"
                    value={modelGlb}
                    onChange={(e) => setModelGlb(e.target.value)}
                    placeholder="/models/product.glb"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    USDZ Model URL (iOS)
                  </label>
                  <input
                    type="url"
                    value={modelUsdz}
                    onChange={(e) => setModelUsdz(e.target.value)}
                    placeholder="/models/product.usdz"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                  />
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  AR ürünü için: "AR Desteği" işaretleyin ve GLB model URL'i girin. Plan limitinize dikkat edin.
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t dark:border-zinc-700 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

