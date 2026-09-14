import type { Appearance } from "@stripe/stripe-js";

/**
 * Apariencia de Stripe Elements consistente con el fondo casi negro de
 * la app (--background: #121111 en globals.css) — se usa en cualquier
 * lugar donde se monte un formulario de pago embebido.
 */
export const stripeElementsAppearance: Appearance = {
  theme: "night",
  labels: "floating",
  disableAnimations: true,
  variables: {
    colorBackground: "#121111",
  },
};
