'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type SubCategory = {
  id: string
  name: string
}

type Category = {
  id: string
  name: string
  subCategories: SubCategory[]
}

type StickyHierarchicalMenuProps = {
  categories: Category[]
  activeCategoryId: string | null
  onCategoryClick: (categoryId: string) => void
  onSubChange?: (categoryId: string, subId: 'all' | string) => void
  primaryColor?: string
  bgColor?: string
}

export function StickyHierarchicalMenu({
  categories,
  activeCategoryId,
  onCategoryClick,
  onSubChange,
  primaryColor = '#1e293b',
  bgColor = '#f8fafc',
}: StickyHierarchicalMenuProps) {
  const [activeSubId, setActiveSubId] = useState<'all' | string>('all')
  const [lastMainId, setLastMainId] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const subScrollRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  // Aktif kategori değişince sub filtreyi sıfırla
  if (activeCategoryId !== lastMainId) {
    setLastMainId(activeCategoryId)
    setActiveSubId('all')
  }

  // Aktif ana tab'ı görünür alana scroll
  useEffect(() => {
    if (!activeCategoryId) return
    const container = scrollContainerRef.current
    const btn = buttonRefs.current[activeCategoryId]
    if (!container || !btn) return
    const containerRect = container.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    const offset = btnRect.left - containerRect.left - containerRect.width / 2 + btnRect.width / 2
    container.scrollBy({ left: offset, behavior: 'smooth' })
  }, [activeCategoryId])

  // Alt kategori değişince sola sıfırla
  useEffect(() => {
    if (subScrollRef.current) {
      subScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }, [activeCategoryId])

  const activeMain = useMemo(
    () => categories.find((c) => c.id === activeCategoryId),
    [categories, activeCategoryId]
  )

  const handleSubClick = (subId: 'all' | string) => {
    setActiveSubId(subId)
    if (activeCategoryId) onSubChange?.(activeCategoryId, subId)
  }

  if (categories.length === 0) return null

  // Aktif kategorinin sub'ları (yoksa boş array → sadece "Tümü" gösterilir)
  const activeSubs = activeMain?.subCategories ?? []

  return (
    <div
      className="sticky top-0 z-40 shadow-sm"
      style={{ backgroundColor: bgColor }}
    >
      {/* ── Ana kategori bar ── */}
      <div className="px-3 pt-2.5 pb-2">
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
        >
          {categories.map((cat) => {
            const isActive = cat.id === activeCategoryId
            return (
              <button
                key={cat.id}
                ref={(el) => { buttonRefs.current[cat.id] = el }}
                type="button"
                onClick={() => onCategoryClick(cat.id)}
                style={
                  isActive
                    ? { backgroundColor: primaryColor, borderColor: primaryColor, color: '#fff' }
                    : { backgroundColor: 'transparent', borderColor: `${primaryColor}30`, color: primaryColor }
                }
                className="shrink-0 rounded-2xl px-4 py-1.5 text-sm font-medium border transition-all duration-200 whitespace-nowrap tracking-tight"
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Alt kategori bar — her zaman görünür ── */}
      <div style={{ borderTop: `1px solid ${primaryColor}18` }}>
        <div
          ref={subScrollRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar px-3 py-2"
        >
          <button
            type="button"
            onClick={() => handleSubClick('all')}
            style={
              activeSubId === 'all'
                ? { backgroundColor: primaryColor, color: '#fff', borderColor: primaryColor }
                : { backgroundColor: 'transparent', color: primaryColor, borderColor: `${primaryColor}40` }
            }
            className="shrink-0 rounded-xl px-3 py-1 text-xs font-semibold border transition-all duration-150 tracking-wide whitespace-nowrap"
          >
            Tümü
          </button>

          <AnimatePresence initial={false}>
            {activeSubs.map((sub) => (
              <motion.button
                key={sub.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.12 }}
                type="button"
                onClick={() => handleSubClick(sub.id)}
                style={
                  activeSubId === sub.id
                    ? { backgroundColor: primaryColor, color: '#fff', borderColor: primaryColor }
                    : { backgroundColor: 'transparent', color: primaryColor, borderColor: `${primaryColor}40` }
                }
                className="shrink-0 rounded-xl px-3 py-1 text-xs font-semibold border transition-all duration-150 whitespace-nowrap"
              >
                {sub.name}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Alt gölge ayırıcı */}
      <div style={{ height: '1px', backgroundColor: `${primaryColor}15` }} />
    </div>
  )
}