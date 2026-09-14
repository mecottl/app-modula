"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { startSubscriptionForAccount } from "@/lib/actions/billing";
import { stripeElementsAppearance } from "@/lib/stripeAppearance";
import { CheckoutForm } from "./checkout-form";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

const planLabels: Record<"BASICO" | "PROFESIONAL", string> = {
  BASICO: "Plan Básico",
  PROFESIONAL: "Plan Profesional",
};
const planPrices: Record<"BASICO" | "PROFESIONAL", string> = {
  BASICO: "$499 MXN/mes",
  PROFESIONAL: "$999 MXN/mes",
};

/**
 * Ventana de pago propia (Stripe Elements) para el alta inicial de una
 * suscripción — reemplaza el redirect a Stripe Checkout (README.md
 * issue "Pasarela de pago propia"). Arranca la suscripción en cuanto se
 * monta (obtiene el client_secret) y muestra el formulario de tarjeta
 * de Stripe embebido en la misma pantalla.
 */
export function SubscribeFlow({
  plan,
  onSuccess,
  submitLabel,
}: {
  plan: "BASICO" | "PROFESIONAL";
  onSuccess: () => void;
  submitLabel?: string;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el estado con el plan actual, no con el montaje
    setClientSecret(null);
    setError(null);
    startSubscriptionForAccount(plan)
      .then((secret) => {
        if (!cancelled) setClientSecret(secret);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudo iniciar el pago");
      });
    return () => {
      cancelled = true;
    };
  }, [plan]);

  if (error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (!clientSecret) {
    return <p className="text-sm text-muted-foreground">Preparando el pago…</p>;
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        {planLabels[plan]} — <span className="text-foreground">{planPrices[plan]}</span>
      </p>
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeElementsAppearance }}>
        <CheckoutForm onSuccess={onSuccess} submitLabel={submitLabel} />
      </Elements>
    </div>
  );
}
