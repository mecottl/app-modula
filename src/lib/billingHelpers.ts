import { stripe, planFromPriceId } from "@/lib/stripe";

/**
 * Si la cuenta tiene una baja de plan programada (Profesional → Básico
 * al final del periodo, ver src/lib/actions/billing.ts changePlan),
 * devuelve a qué plan bajará y cuándo. Se usa tanto en Facturación como
 * en la pantalla de confirmación de baja.
 */
export async function getPendingDowngrade(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["schedule"],
  });
  const schedule = subscription.schedule;
  if (!schedule || typeof schedule !== "object" || schedule.status !== "active") return null;

  const nextPhase = schedule.phases[1];
  if (!nextPhase) return null;

  const nextPriceItem = nextPhase.items[0]?.price;
  const nextPriceId = typeof nextPriceItem === "string" ? nextPriceItem : nextPriceItem?.id;
  const plan = planFromPriceId(nextPriceId);
  if (!plan) return null;

  return {
    plan,
    date: new Date(nextPhase.start_date * 1000).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  };
}

/**
 * Estado de cancelación de la suscripción: si `cancelAtPeriodEnd` es
 * true, ya se programó su cancelación (ver cancelSubscriptionAtPeriodEnd
 * en src/lib/actions/billing.ts) — sigue activa y cobrando normal hasta
 * `periodEndDate`, sin reembolso, igual que una baja de plan. Se usa en
 * la pantalla de Tarjetas para mostrar la opción de cancelar/reactivar.
 */
export async function getSubscriptionCancelInfo(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const periodEndTimestamp = subscription.items.data[0]?.current_period_end;
  if (!periodEndTimestamp) return null;

  return {
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    periodEndDate: new Date(periodEndTimestamp * 1000).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  };
}
