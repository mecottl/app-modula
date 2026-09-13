"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSessionAccount } from "@/lib/tenant";
import { stripe, STRIPE_PRICE_IDS } from "@/lib/stripe";
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
    success_url: `${baseUrl}/dashboard/billing?checkout=success`,
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
