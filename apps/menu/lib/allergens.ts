// Allergen definitions with icons and labels
export interface Allergen {
  key: string;
  label: string;
  icon: string;
}

export const ALLERGENS: Allergen[] = [
  { key: "gluten", label: "Gluten", icon: "🌾" },
  { key: "milk", label: "Süt", icon: "🥛" },
  { key: "egg", label: "Yumurta", icon: "🥚" },
  { key: "soy", label: "Soya", icon: "🫘" },
  { key: "peanut", label: "Yer fıstığı", icon: "🥜" },
  { key: "treenut", label: "Kuruyemiş", icon: "🌰" },
  { key: "sesame", label: "Susam", icon: "⚪️" },
  { key: "fish", label: "Balık", icon: "🐟" },
  { key: "shellfish", label: "Kabuklu", icon: "🦐" },
  { key: "mustard", label: "Hardal", icon: "🟡" },
  { key: "celery", label: "Kereviz", icon: "🥬" },
  { key: "lupin", label: "Acı bakla", icon: "🌼" },
  { key: "sulfites", label: "Sülfit", icon: "🧪" },
];

const ALLERGEN_LABELS: Record<string, Record<string, string>> = {
  gluten:    { tr: "Gluten",      en: "Gluten",       ar: "غلوتين",       de: "Gluten",       fr: "Gluten" },
  milk:      { tr: "Süt",         en: "Milk",          ar: "حليب",         de: "Milch",        fr: "Lait" },
  egg:       { tr: "Yumurta",     en: "Egg",           ar: "بيض",          de: "Ei",           fr: "Œuf" },
  soy:       { tr: "Soya",        en: "Soy",           ar: "صويا",         de: "Soja",         fr: "Soja" },
  peanut:    { tr: "Yer fıstığı", en: "Peanut",        ar: "فول سوداني",   de: "Erdnuss",      fr: "Arachide" },
  treenut:   { tr: "Kuruyemiş",   en: "Tree Nut",      ar: "مكسرات",       de: "Schalenfrüchte", fr: "Fruits à coque" },
  sesame:    { tr: "Susam",       en: "Sesame",        ar: "سمسم",         de: "Sesam",        fr: "Sésame" },
  fish:      { tr: "Balık",       en: "Fish",          ar: "سمك",          de: "Fisch",        fr: "Poisson" },
  shellfish: { tr: "Kabuklu",     en: "Shellfish",     ar: "محار",         de: "Schalentiere", fr: "Crustacés" },
  mustard:   { tr: "Hardal",      en: "Mustard",       ar: "خردل",         de: "Senf",         fr: "Moutarde" },
  celery:    { tr: "Kereviz",     en: "Celery",        ar: "كرفس",         de: "Sellerie",     fr: "Céleri" },
  lupin:     { tr: "Acı bakla",   en: "Lupin",         ar: "الترمس",       de: "Lupine",       fr: "Lupin" },
  sulfites:  { tr: "Sülfit",      en: "Sulfites",      ar: "كبريتيت",      de: "Sulfite",      fr: "Sulfites" },
};

export function getAllergenLabel(key: string, locale: string): string {
  return ALLERGEN_LABELS[key]?.[locale] ?? ALLERGEN_LABELS[key]?.['tr'] ?? key;
}

// Allowed allergen keys for validation
export const ALLOWED_ALLERGEN_KEYS = ALLERGENS.map(a => a.key);

// Helper to get allergen by key
export function getAllergenByKey(key: string): Allergen | undefined {
  return ALLERGENS.find(a => a.key === key);
}

// Helper to get allergens by keys array
export function getAllergensByKeys(keys: string[]): Allergen[] {
  return keys
    .map(key => getAllergenByKey(key))
    .filter((a): a is Allergen => a !== undefined);
}

