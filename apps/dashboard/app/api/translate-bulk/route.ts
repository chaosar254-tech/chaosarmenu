import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate'
const LANGS = [
  { code: 'EN-US', nameKey: 'name_en', descKey: 'description_en' },
  { code: 'AR',    nameKey: 'name_ar', descKey: 'description_ar' },
  { code: 'DE',    nameKey: 'name_de', descKey: 'description_de' },
  { code: 'FR',    nameKey: 'name_fr', descKey: 'description_fr' },
]

async function translateTexts(texts: string[], targetLang: string, apiKey: string): Promise<string[]> {
  const params = new URLSearchParams()
  params.append('source_lang', 'TR')
  params.append('target_lang', targetLang)
  for (const t of texts) params.append('text', t || '')
  const res = await fetch(DEEPL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `DeepL-Auth-Key ${apiKey}`,
    },
    body: params.toString(),
  })
  if (!res.ok) return texts.map(() => '')
  const data = await res.json()
  return data.translations.map((t: { text: string }) => t.text)
}

async function translateName(name: string, apiKey: string): Promise<Record<string, string | null>> {
  const results = await Promise.all(
    LANGS.map(async ({ code, nameKey }) => {
      const [translated] = await translateTexts([name], code, apiKey)
      return { nameKey, value: translated || null }
    })
  )
  const updates: Record<string, string | null> = {}
  for (const r of results) updates[r.nameKey] = r.value
  return updates
}

// POST /api/translate-bulk
// Body: { itemId: string }  — tek ürün çevir
// Body: { branchId: string } — tüm ürünler + kategoriler çevir
// Body: { restaurantId: string } — sadece kategoriler çevir
export async function POST(req: NextRequest) {
  const apiKey = process.env.DEEPL_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'DEEPL_API_KEY tanımlı değil' }, { status: 500 })

  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId, branchId, restaurantId } = await req.json()

  let itemsTranslated = 0
  let categoriesTranslated = 0

  // --- Ürünleri çevir ---
  if (itemId || branchId) {
    let query = supabase.from('menu_items').select('id, name, description')
    if (itemId) query = query.eq('id', itemId)
    else query = query.eq('branch_id', branchId)

    const { data: items, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    for (const item of (items || [])) {
      try {
        const texts = [item.name || '', item.description || '']
        const results = await Promise.all(
          LANGS.map(async ({ code, nameKey, descKey }) => {
            const [name, desc] = await translateTexts(texts, code, apiKey)
            return { nameKey, descKey, name, desc }
          })
        )
        const updates: Record<string, string | null> = {}
        for (const r of results) {
          updates[r.nameKey] = r.name || null
          updates[r.descKey] = r.desc || null
        }
        const { error: updateError } = await supabase.from('menu_items').update(updates).eq('id', item.id)
        if (!updateError) itemsTranslated++
      } catch {}
    }
  }

  // --- Kategorileri çevir ---
  if (branchId || restaurantId) {
    // Kategoriler restaurant_id'ye bağlı
    let restId = restaurantId
    if (!restId && branchId) {
      const { data: branch } = await supabase.from('branches').select('restaurant_id').eq('id', branchId).single()
      restId = branch?.restaurant_id
    }

    if (restId) {
      const { data: cats } = await supabase.from('menu_categories').select('id, name').eq('restaurant_id', restId)
      for (const cat of (cats || [])) {
        try {
          const updates = await translateName(cat.name, apiKey)
          const { error } = await supabase.from('menu_categories').update(updates).eq('id', cat.id)
          if (!error) categoriesTranslated++
        } catch {}
      }
    }
  }

  return NextResponse.json({ itemsTranslated, categoriesTranslated })
}
