/**
 * Rule-based recommendation engine for "Yanında İyi Gider" (Recommended Sides)
 * Generates automatic recommendations based on product name, category, and ingredients
 */

interface RecommendationInput {
  name: string
  categoryName: string | null
  ingredients: string[] | null
  tags?: string[] | null
}

/**
 * Builds automatic recommendation for "Yanında İyi Gider"
 * Priority: Keyword > Category > Default
 */
export function buildRecommendedSidesAuto(input: RecommendationInput): string {
  const { name, categoryName, ingredients, tags } = input
  
  // Normalize inputs for matching
  const nameLower = name.toLowerCase().trim()
  const categoryLower = categoryName?.toLowerCase().trim() || ''
  const allIngredients = [
    ...(ingredients || []),
    ...(tags || []),
  ].map(i => i.toLowerCase().trim())
  const allText = [nameLower, categoryLower, ...allIngredients].join(' ')

  // Keyword-based rules (highest priority)
  if (allText.includes('acı') || allText.includes('spicy') || allText.includes('hot')) {
    return 'Ayran'
  }

  if (allText.includes('vegan')) {
    return 'Soda'
  }

  if (allText.includes('tavuk') || allText.includes('chicken')) {
    return 'Sos + Patates'
  }

  if (allText.includes('et') || allText.includes('meat') || allText.includes('beef')) {
    return 'Patates + Kola'
  }

  // Category-based rules
  if (categoryLower.includes('burger') || categoryLower.includes('wrap') || categoryLower.includes('sandwich')) {
    return 'Patates + Kola'
  }

  if (categoryLower.includes('pizza')) {
    return 'Ayran veya Kola + Sos'
  }

  if (categoryLower.includes('makarna') || categoryLower.includes('pasta')) {
    return 'Sarımsaklı ekmek + Soda'
  }

  if (categoryLower.includes('tatlı') || categoryLower.includes('dessert') || categoryLower.includes('sweet')) {
    return 'Kahve'
  }

  if (categoryLower.includes('kahvaltı') || categoryLower.includes('breakfast')) {
    return 'Çay'
  }

  if (categoryLower.includes('salata') || categoryLower.includes('salad')) {
    return 'Soda veya Ayran'
  }

  if (categoryLower.includes('çorba') || categoryLower.includes('soup')) {
    return 'Ekmek'
  }

  if (categoryLower.includes('kebap') || categoryLower.includes('kebab')) {
    return 'Ayran + Pilav'
  }

  if (categoryLower.includes('balık') || categoryLower.includes('fish')) {
    return 'Limon + Salata'
  }

  // Name-based fallback rules
  if (nameLower.includes('burger')) {
    return 'Patates + Kola'
  }

  if (nameLower.includes('pizza')) {
    return 'Ayran veya Kola + Sos'
  }

  if (nameLower.includes('makarna') || nameLower.includes('pasta')) {
    return 'Sarımsaklı ekmek + Soda'
  }

  if (nameLower.includes('tatlı') || nameLower.includes('dessert')) {
    return 'Kahve'
  }

  // Default fallback
  return 'İçecek ile servis edilir.'
}

/**
 * Get the display text for recommended sides
 * Priority: manual > auto > empty
 */
export function getRecommendedSidesDisplay(
  source: 'auto' | 'manual',
  manual: string | null,
  auto: string | null
): string | null {
  if (source === 'manual' && manual && manual.trim()) {
    return manual.trim()
  }
  if (auto && auto.trim()) {
    return auto.trim()
  }
  return null
}

