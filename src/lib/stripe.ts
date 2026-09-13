import Stripe from "stripe";

/**
 * Cliente de Stripe (README.md issue "Integrar Stripe y probar el control
 * de acceso por plan en producción"). Modo de prueba mientras
 * STRIPE_SECRET_KEY sea una llave sk_test_.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export const STRIPE_PRICE_IDS = {
  BASICO: process.env.STRIPE_PRICE_ID_BASICO ?? "",
  PROFESIONAL: process.env.STRIPE_PRICE_ID_PROFESIONAL ?? "",
} as const;

export function planFromPriceId(priceId: string | undefined | null): "BASICO" | "PROFESIONAL" | null {
  if (priceId === STRIPE_PRICE_IDS.PROFESIONAL) return "PROFESIONAL";
  if (priceId === STRIPE_PRICE_IDS.BASICO) return "BASICO";
  return null;
}
