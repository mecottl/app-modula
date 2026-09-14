"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { confirmSubscriptionActivation } from "@/lib/actions/billing";

export function CheckoutForm({
  onSuccess,
  submitLabel = "Confirmar pago",
}: {
  onSuccess: () => void;
  submitLabel?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "No se pudo procesar el pago");
      setSubmitting(false);
      return;
    }

    if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
      try {
        await confirmSubscriptionActivation();
        toast.success("Pago recibido, tu plan ya está actualizado.");
        onSuccess();
      } catch {
        toast.error("Pago recibido, pero no se pudo actualizar el plan automáticamente. Recarga la página.");
      }
      return;
    }

    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="self-start rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {submitting ? "Procesando…" : submitLabel}
      </button>
    </form>
  );
}
