import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe, planFromPriceId } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/errorReporting";

/**
 * Webhook de Stripe (README.md issue "Integrar Stripe y probar el
 * control de acceso por plan en producción"). Es la ÚNICA fuente de
 * verdad para `Account.plan`/`billingStatus` — nunca se actualiza desde
 * el checkout directamente, para no fiarnos de que el navegador del
 * cliente realmente completó el pago.
 *
 * En desarrollo: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
 * imprime el STRIPE_WEBHOOK_SECRET a usar en .env.local.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    logger.warn("stripe webhook: firma inválida", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const accountId = session.metadata?.accountId ?? session.client_reference_id;
        if (!accountId || !session.subscription || !session.customer) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0]?.price.id;
        const plan = planFromPriceId(priceId);

        await prisma.account.update({
          where: { id: accountId },
          data: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription.id,
            plan: plan ?? undefined,
            billingStatus: "ACTIVO",
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const accountId = subscription.metadata?.accountId;
        const priceId = subscription.items.data[0]?.price.id;
        const plan = planFromPriceId(priceId);

        const billingStatus =
          subscription.status === "active" || subscription.status === "trialing"
            ? "ACTIVO"
            : subscription.status === "past_due" || subscription.status === "unpaid"
              ? "MOROSO"
              : subscription.status === "canceled"
                ? "CANCELADO"
                : undefined;

        const where = accountId
          ? { id: accountId }
          : { stripeSubscriptionId: subscription.id };

        await prisma.account.updateMany({
          where,
          data: { plan: plan ?? undefined, billingStatus },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.account.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { billingStatus: "CANCELADO", plan: "BASICO" },
        });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    captureException(error, { where: "stripeWebhook", eventType: event.type });
    return NextResponse.json({ error: "Error procesando el evento" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
