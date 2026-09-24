import type { AccountPlan } from "@prisma/client";

/** Issue #70: topes reales por plan, antes ilimitados. */
export const MAX_DEVELOPMENTS_BY_PLAN: Record<AccountPlan, number> = {
  BASICO: 2,
  PROFESIONAL: 5,
};

export const MAX_CATALOG_IMAGES = 5;

/** Niveles máximos del árbol de catálogo (categoría = nivel 1). La desarrolladora decide cuántos usa. */
export const MAX_CATALOG_DEPTH = 5;
