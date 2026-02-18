export const PLAN_LIMITS = {
  starter: 3,      // Başlangıç planı: 3 AR öğesi
  standard: 10,    // Standart plan: 10 AR öğesi
  premium: Infinity, // Premium plan: Sınırsız AR öğesi
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export function getPlanLimit(plan: PlanType | string | null | undefined): number {
  if (!plan || !(plan in PLAN_LIMITS)) {
    return PLAN_LIMITS.starter;
  }
  return PLAN_LIMITS[plan as PlanType];
}

