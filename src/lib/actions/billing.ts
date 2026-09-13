"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSessionAccount } from "@/lib/tenant";
import { stripe, STRIPE_PRICE_IDS, planFromPriceId } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/baseUrl";

const planSchema = z.enum(["BASICO", "PROFESIONAL"]);

/**
 * Crea una sesión de Stripe Checkout para suscribir la cuenta al plan
 * elegido (README.md issue "Integrar Stripe y probar el control de
 * acceso por plan en producción"). El plan/estado real de la cuenta se
 * actualiza únicamente vía webhook (src/app/api/stripe/webhook/route.ts)
 * cuando Stripe confirma el pago — nunca se actualiza aquí de forma
 * optimista.
 */
export async function createCheckoutSession(formData: FormData) {
  const { accountId, role } = await requireSessionAccount();
  if (role !== "ADMINISTRADOR") {
    redirect(`/dashboard/billing?error=${encodeURIComponent("Solo un administrador puede cambiar el plan")}`);
  }

  const parsed = planSchema.safeParse(formData.get("plan"));
  if (!parsed.success) {
    redirect(`/dashboard/billing?error=${encodeURIComponent("Plan inválido")}`);
  }

  const priceId = STRIPE_PRICE_IDS[parsed.data!];
  if (!priceId) {
    redirect(
      `/dashboard/billing?error=${encodeURIComponent("Stripe no está configurado (falta el Price ID)")}`,
    );
  }

  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  const baseUrl = await getBaseUrl();

  // Si ya hay una suscripción activa, esto es un cambio de plan
  // (upgrade o downgrade), no un alta nueva.
  if (account.stripeSubscriptionId && account.billingStatus === "ACTIVO") {
    const subscription = await stripe.subscriptions.retrieve(account.stripeSubscriptionId, {
      expand: ["schedule"],
    });
    const currentItem = subscription.items.data[0];
    const existingSchedule =
      subscription.schedule && typeof subscription.schedule === "object" ? subscription.schedule : null;

    if (currentItem.price.id === priceId && !existingSchedule) {
      redirect(`/dashboard/billing?error=${encodeURIComponent("Ya tienes ese plan activo")}`);
    }

    // Bajar de Profesional a Básico NO debe generar un reembolso del
    // tiempo no usado: en vez de prorratear/facturar la diferencia de
    // inmediato (lo que Stripe resolvería como un crédito a favor del
    // cliente), se agenda el cambio de precio para cuando termine el
    // periodo de facturación actual, vía una Subscription Schedule con
    // dos fases (la actual sin tocar, y la nueva a partir de
    // `current_period_end`). El acceso a Profesional se mantiene hasta
    // entonces — Account.plan solo se actualiza cuando el webhook
    // confirma el cambio de precio en la fecha agendada
    // (customer.subscription.updated).
    if (parsed.data! === "BASICO") {
      const targetPhase = { items: [{ price: priceId, quantity: 1 }] };

      if (existingSchedule) {
        const [currentPhase] = existingSchedule.phases;
        await stripe.subscriptionSchedules.update(existingSchedule.id, {
          phases: [
            {
              items: currentPhase.items.map((item) => ({
                price: typeof item.price === "string" ? item.price : item.price!.id,
                quantity: item.quantity,
              })),
              start_date: currentPhase.start_date,
              end_date: currentPhase.end_date,
            },
            targetPhase,
          ],
        });
      } else {
        const schedule = await stripe.subscriptionSchedules.create({
          from_subscription: account.stripeSubscriptionId,
        });
        const [currentPhase] = schedule.phases;
        await stripe.subscriptionSchedules.update(schedule.id, {
          end_behavior: "release",
          phases: [
            {
              items: currentPhase.items.map((item) => ({
                price: typeof item.price === "string" ? item.price : item.price!.id,
                quantity: item.quantity,
              })),
              start_date: currentPhase.start_date,
              end_date: currentPhase.end_date,
            },
            targetPhase,
          ],
        });
      }

      redirect(
        `/dashboard/billing?ok=${encodeURIComponent(
          "Tu plan bajará a Básico al final del periodo actual. Sigues con Profesional hasta entonces, sin cargos ni reembolsos.",
        )}`,
      );
    }

    // Subir de plan (o volver a Profesional cancelando una baja ya
    // agendada): si había una baja programada, se libera primero para
    // no dejarla pendiente sobre el precio nuevo.
    if (existingSchedule) {
      await stripe.subscriptionSchedules.release(existingSchedule.id);
    }

    if (currentItem.price.id === priceId) {
      redirect(
        `/dashboard/billing?ok=${encodeURIComponent("Se canceló la baja de plan programada. Sigues en Profesional.")}`,
      );
    }

    const updated = await stripe.subscriptions.update(account.stripeSubscriptionId, {
      items: [{ id: currentItem.id, price: priceId }],
      proration_behavior: "always_invoice",
    });

    // A diferencia del Checkout (donde el pago se confirma en la página
    // de Stripe, fuera de nuestro control), aquí somos nosotros quienes
    // llamamos a la API y Stripe ya nos devuelve el resultado
    // confirmado — es seguro reflejarlo de inmediato en vez de esperar
    // a que el webhook llegue (puede tardar o, en desarrollo, depender
    // de que `stripe listen` esté corriendo).
    const newPlan = planFromPriceId(updated.items.data[0]?.price.id);
    await prisma.account.update({
      where: { id: accountId },
      data: { plan: newPlan ?? undefined, billingStatus: "ACTIVO" },
    });

    redirect(`/dashboard/billing?checkout=success`);
  }

  // Sin suscripción activa todavía: se crea desde cero vía Checkout.
  // Si la cuenta todavía no tiene cliente de Stripe, se le pasa el correo
  // del administrador que hace el checkout para que Stripe cree el
  // cliente con ese correo (y no pida capturarlo de nuevo).
  let customerEmail: string | undefined;
  if (!account.stripeCustomerId) {
    const admin = await prisma.member.findFirst({
      where: { accountId, role: "ADMINISTRADOR" },
    });
    customerEmail = admin?.email;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: account.stripeCustomerId ?? undefined,
    customer_email: account.stripeCustomerId ? undefined : customerEmail,
    client_reference_id: accountId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/dashboard/billing?checkout=cancelled`,
    metadata: { accountId },
    subscription_data: { metadata: { accountId } },
  });

  if (!session.url) {
    redirect(`/dashboard/billing?error=${encodeURIComponent("No se pudo iniciar el pago")}`);
  }

  redirect(session.url!);
}

/**
 * Confirma una Checkout Session recién completada y sincroniza
 * `Account.plan`/`billingStatus` de inmediato, en vez de esperar
 * exclusivamente al webhook. El webhook sigue siendo la fuente de
 * verdad para el resto del ciclo de vida de la suscripción (renovación,
 * cancelación, pagos fallidos) — esto solo cubre el instante justo
 * después de pagar, cuando el webhook puede no haber llegado todavía
 * (o, en desarrollo con un túnel, no estar corriendo). Es seguro
 * porque nosotros mismos llamamos a la API de Stripe con el
 * `session_id` y verificamos que la sesión pertenece a la cuenta
 * autenticada (`metadata.accountId`) antes de escribir nada — nunca se
 * confía en datos que el navegador pudiera traer manipulados.
 */
export async function syncAccountFromCheckoutSession(sessionId: string, accountId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  if (session.metadata?.accountId !== accountId) return null;

  const subscription = session.subscription;
  if (!subscription || typeof subscription !== "object") return null;

  const priceId = subscription.items.data[0]?.price.id;
  const plan = planFromPriceId(priceId);
  const billingStatus =
    subscription.status === "active" || subscription.status === "trialing" ? "ACTIVO" : undefined;

  await prisma.account.update({
    where: { id: accountId },
    data: {
      stripeCustomerId: typeof session.customer === "string" ? session.customer : (session.customer?.id ?? undefined),
      stripeSubscriptionId: subscription.id,
      plan: plan ?? undefined,
      billingStatus,
    },
  });

  return { plan, billingStatus };
}

/**
 * Abre el Portal de Facturación de Stripe (gestionado por Stripe: ahí
 * se ve el historial de facturas, se actualiza el método de pago, o se
 * cancela la suscripción) para la cuenta autenticada.
 */
export async function createBillingPortalSession() {
  const { accountId, role } = await requireSessionAccount();
  if (role !== "ADMINISTRADOR") {
    redirect(`/dashboard/billing?error=${encodeURIComponent("Solo un administrador puede gestionar la facturación")}`);
  }

  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  if (!account.stripeCustomerId) {
    redirect(
      `/dashboard/billing?error=${encodeURIComponent("Aún no tienes una suscripción activa con Stripe")}`,
    );
  }

  const baseUrl = await getBaseUrl();
  const session = await stripe.billingPortal.sessions.create({
    customer: account.stripeCustomerId!,
    return_url: `${baseUrl}/dashboard/billing`,
  });

  redirect(session.url);
}
