// Allergen definitions with icons and labels (shared with menu app)
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

// Allowed allergen keys for validation
export const ALLOWED_ALLERGEN_KEYS = ALLERGENS.map(a => a.key);

// Helper to get allergen by key
export function getAllergenByKey(key: string): Allergen | undefined {
  return ALLERGENS.find(a => a.key === key);
}

