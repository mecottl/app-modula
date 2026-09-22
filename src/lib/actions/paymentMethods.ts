"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireSessionAccount } from "@/lib/tenant";
import { stripe } from "@/lib/stripe";

async function requireStripeCustomerId(accountId: string) {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  if (account.stripeCustomerId) return account.stripeCustomerId;

  const billingContact = await prisma.member.findFirst({
    where: { accountId, role: { permissions: { has: "billing.manage" } } },
  });
  const customer = await stripe.customers.create({ email: billingContact?.email, metadata: { accountId } });
  await prisma.account.update({ where: { id: accountId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

/**
 * Arranca el registro de una tarjeta nueva sin cobrar nada (SetupIntent
 * en vez de PaymentIntent): se usa tanto para guardar un método de pago
 * de respaldo como para reemplazar uno vencido, sin pasar por un cobro
 * de suscripción. El cliente monta Stripe Elements con el
 * `client_secret` devuelto (src/components/billing/cards-manager.tsx).
 */
export async function createSetupIntent() {
  const { accountId } = await requirePermission("billing.manage");

  const customerId = await requireStripeCustomerId(accountId);
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
  });

  if (!setupIntent.client_secret) {
    throw new Error("No se pudo iniciar el registro de la tarjeta");
  }
  return setupIntent.client_secret;
}

export async function listPaymentMethods() {
  const { accountId } = await requireSessionAccount();
  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  if (!account.stripeCustomerId) return { cards: [], defaultId: null };

  const [methods, customer, subscription] = await Promise.all([
    stripe.paymentMethods.list({ customer: account.stripeCustomerId, type: "card" }),
    stripe.customers.retrieve(account.stripeCustomerId),
    account.stripeSubscriptionId ? stripe.subscriptions.retrieve(account.stripeSubscriptionId) : null,
  ]);

  // La tarjeta que Stripe realmente cobra es la default de la
  // suscripción (`subscription.default_payment_method`) cuando existe:
  // tiene prioridad sobre la default del cliente
  // (`customer.invoice_settings.default_payment_method`), que solo
  // aplica como resguardo general. `startSubscriptionForAccount` guarda
  // la primera tarjeta ahí (`save_default_payment_method:
  // "on_subscription"`), no a nivel cliente — por eso hay que revisar
  // ambos para saber cuál mostrar como "Predeterminada".
  const subscriptionDefault = subscription?.default_payment_method;
  const customerDefault = customer.deleted ? null : customer.invoice_settings.default_payment_method;
  const defaultPaymentMethod = subscriptionDefault ?? customerDefault;
  const defaultId =
    typeof defaultPaymentMethod === "string" ? defaultPaymentMethod : (defaultPaymentMethod?.id ?? null);

  return {
    cards: methods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand ?? "card",
      last4: pm.card?.last4 ?? "----",
      expMonth: pm.card?.exp_month ?? 0,
      expYear: pm.card?.exp_year ?? 0,
    })),
    defaultId,
  };
}

export async function setDefaultPaymentMethod(paymentMethodId: string) {
  const { accountId } = await requirePermission("billing.manage");

  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  if (!account.stripeCustomerId) {
    throw new Error("No hay tarjetas guardadas todavía");
  }

  await stripe.customers.update(account.stripeCustomerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  // La default del cliente no basta: si hay una suscripción activa, es
  // su propia default_payment_method la que Stripe usa para cobrarla
  // (ver nota en listPaymentMethods) — hay que actualizar las dos para
  // que "Usar como predeterminada" realmente cambie qué tarjeta se
  // cobra el siguiente mes.
  if (account.stripeSubscriptionId) {
    await stripe.subscriptions.update(account.stripeSubscriptionId, {
      default_payment_method: paymentMethodId,
    });
  }
}

/**
 * Quita una tarjeta guardada. Bloquea eliminar la única tarjeta cuando
 * la cuenta tiene una suscripción activa: sin ninguna tarjeta de
 * respaldo, el siguiente cobro automático fallaría y la cuenta pasaría
 * a moroso sin que el administrador lo haya decidido explícitamente.
 */
export async function removePaymentMethod(paymentMethodId: string) {
  const { accountId } = await requirePermission("billing.manage");

  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  if (!account.stripeCustomerId) {
    throw new Error("No hay tarjetas guardadas todavía");
  }

  const methods = await stripe.paymentMethods.list({
    customer: account.stripeCustomerId,
    type: "card",
  });

  if (account.billingStatus === "ACTIVO" && methods.data.length <= 1) {
    throw new Error("No puedes quitar tu única tarjeta mientras tengas una suscripción activa");
  }

  // Si se quita la tarjeta que la suscripción usa para cobrar, se pasa
  // el default a otra tarjeta guardada ANTES de desasociarla — si no,
  // la suscripción se queda apuntando a un método de pago ya
  // desasociado y el siguiente cobro automático fallaría solo.
  if (account.stripeSubscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(account.stripeSubscriptionId);
    if (subscription.default_payment_method === paymentMethodId) {
      const fallback = methods.data.find((pm) => pm.id !== paymentMethodId);
      if (fallback) {
        await stripe.subscriptions.update(account.stripeSubscriptionId, {
          default_payment_method: fallback.id,
        });
      }
    }
  }

  await stripe.paymentMethods.detach(paymentMethodId);
}
