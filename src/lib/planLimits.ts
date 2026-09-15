import type { AccountPlan } from "@prisma/client";

/** Issue #70: topes reales por plan, antes ilimitados. */
export const MAX_DEVELOPMENTS_BY_PLAN: Record<AccountPlan, number> = {
  BASICO: 2,
  PROFESIONAL: 5,
};

export const MAX_CATALOG_IMAGES = 5;
