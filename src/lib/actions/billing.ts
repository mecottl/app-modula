"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSessionAccount } from "@/lib/tenant";
import { stripe, STRIPE_PRICE_IDS, planFromPriceId } from "@/lib/stripe";

const planSchema = z.enum(["BASICO", "PROFESIONAL"]);

/**
 * Cambia el plan de una cuenta que YA tiene una suscripción activa
 * (upgrade, downgrade, o cancelar una baja programada). Para el alta
 * inicial (sin suscripción activa todavía) se usa
 * startSubscriptionForAccount, con la ventana de pago propia.
 */
export async function changePlan(formData: FormData) {
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

  // Sin suscripción activa todavía: no debería llegarse aquí — el
  // dashboard usa startSubscriptionForAccount (ventana de pago propia)
  // para el alta inicial. Se deja como resguardo por si el formulario
  // se envía en un estado inesperado.
  redirect(
    `/dashboard/billing?error=${encodeURIComponent("Usa el formulario de arriba para contratar tu primer plan")}`,
  );
}

/**
 * Arranca (o retoma) una suscripción nueva para la cuenta autenticada,
 * en estado `incomplete` (payment_behavior: "default_incomplete"): el
 * pago se confirma en la propia página del dashboard con Stripe
 * Elements (src/components/billing/checkout-form.tsx), en vez de
 * redirigir a una página hospedada por Stripe (README.md issue
 * "Pasarela de pago propia"). Devuelve el `client_secret` del
 * PaymentIntent del primer invoice, que el cliente usa para montar el
 * formulario de tarjeta.
 */
export async function startSubscriptionForAccount(plan: "BASICO" | "PROFESIONAL") {
  const { accountId, role } = await requireSessionAccount();
  if (role !== "ADMINISTRADOR") {
    throw new Error("Solo un administrador puede contratar un plan");
  }

  const priceId = STRIPE_PRICE_IDS[plan];
  if (!priceId) {
    throw new Error("Stripe no está configurado (falta el Price ID)");
  }

  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  if (account.stripeSubscriptionId && account.billingStatus === "ACTIVO") {
    throw new Error("Ya tienes una suscripción activa; usa el cambio de plan en su lugar");
  }

  // Idempotencia: si ya existe un intento sin terminar de pagar (el
  // usuario recargó la página a medio pago, cambió de plan antes de
  // pagar en el paso 2 del registro, o el componente se montó dos veces
  // por Strict Mode en desarrollo), se reutiliza esa MISMA suscripción
  // en vez de crear una nueva — evita dejar suscripciones "incomplete"
  // duplicadas y huérfanas (con su propia factura "open" fantasma) en
  // Stripe cada vez que se cambia la selección de plan.
  if (account.stripeSubscriptionId) {
    const existing = await stripe.subscriptions.retrieve(account.stripeSubscriptionId, {
      expand: ["latest_invoice.confirmation_secret"],
    });
    if (existing.status === "incomplete") {
      const currentItem = existing.items.data[0];
      const updated =
        currentItem.price.id === priceId
          ? existing
          : await stripe.subscriptions.update(account.stripeSubscriptionId, {
              items: [{ id: currentItem.id, price: priceId }],
              payment_behavior: "default_incomplete",
              expand: ["latest_invoice.confirmation_secret"],
            });
      const existingInvoice = updated.latest_invoice;
      const existingSecret =
        existingInvoice && typeof existingInvoice === "object"
          ? existingInvoice.confirmation_secret?.client_secret
          : null;
      if (existingSecret) return existingSecret;
    }
  }

  // Reutiliza el cliente de Stripe si ya existe (ej. una suscripción
  // anterior cancelada); si no, lo crea con el correo del administrador
  // para que Stripe no tenga que volver a pedirlo.
  let customerId = account.stripeCustomerId;
  if (!customerId) {
    const admin = await prisma.member.findFirst({ where: { accountId, role: "ADMINISTRADOR" } });
    const customer = await stripe.customers.create({ email: admin?.email, metadata: { accountId } });
    customerId = customer.id;
  }

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
      payment_method_types: ["card"],
    },
    expand: ["latest_invoice.confirmation_secret"],
    metadata: { accountId },
  });

  await prisma.account.update({
    where: { id: accountId },
    data: { stripeCustomerId: customerId, stripeSubscriptionId: subscription.id },
  });

  const invoice = subscription.latest_invoice;
  const clientSecret =
    invoice && typeof invoice === "object" ? invoice.confirmation_secret?.client_secret : null;

  if (!clientSecret) {
    throw new Error("No se pudo iniciar el pago");
  }

  return clientSecret;
}

/**
 * Confirma, del lado del servidor, que la suscripción de la cuenta
 * autenticada ya se activó, y sincroniza `Account.plan`/`billingStatus`
 * de inmediato — en vez de esperar exclusivamente al webhook, que puede
 * tardar o (en desarrollo, sin `stripe listen` corriendo) no llegar
 * nunca. Se llama justo después de que `stripe.confirmPayment` resuelve
 * en el cliente. Es seguro porque somos nosotros quienes consultamos la
 * suscripción directamente en la API de Stripe usando el
 * `stripeSubscriptionId` ya guardado en la cuenta autenticada — nunca
 * se confía en un estado que el navegador pudiera reportar manipulado.
 * El webhook sigue siendo la fuente de verdad para el resto del ciclo
 * de vida (renovación, cancelación, pagos fallidos).
 */
export async function confirmSubscriptionActivation() {
  const { accountId } = await requireSessionAccount();
  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  if (!account.stripeSubscriptionId) return null;

  const subscription = await stripe.subscriptions.retrieve(account.stripeSubscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  const plan = planFromPriceId(priceId);
  const billingStatus =
    subscription.status === "active" || subscription.status === "trialing" ? "ACTIVO" : undefined;

  await prisma.account.update({
    where: { id: accountId },
    data: { plan: plan ?? undefined, billingStatus },
  });

  return { plan, billingStatus };
}

/**
 * Programa la cancelación de la suscripción para el final del periodo
 * ya pagado (`cancel_at_period_end: true`), en vez de cancelarla de
 * inmediato: la cuenta conserva su plan actual y sigue cobrando normal
 * hasta esa fecha, sin reembolso — mismo principio que bajar de plan
 * (changePlan). El webhook (`customer.subscription.deleted`) es quien
 * marca `billingStatus: CANCELADO` cuando Stripe la cancela de verdad
 * al llegar esa fecha.
 */
export async function cancelSubscriptionAtPeriodEnd() {
  const { accountId, role } = await requireSessionAccount();
  if (role !== "ADMINISTRADOR") {
    throw new Error("Solo un administrador puede cancelar la suscripción");
  }

  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  if (!account.stripeSubscriptionId) {
    throw new Error("No tienes una suscripción activa");
  }

  // Si hay una baja de plan programada (ver changePlan), la suscripción
  // queda "administrada" por esa Subscription Schedule y Stripe rechaza
  // tocar `cancel_at_period_end` directamente. Cancelar de plano no
  // tiene caso mantener una baja de plan pendiente, así que se libera
  // el schedule primero (vuelve a ser una suscripción normal, en el
  // precio actual) y luego sí se agenda la cancelación.
  const subscription = await stripe.subscriptions.retrieve(account.stripeSubscriptionId, {
    expand: ["schedule"],
  });
  if (subscription.schedule && typeof subscription.schedule === "object") {
    await stripe.subscriptionSchedules.release(subscription.schedule.id);
  }

  await stripe.subscriptions.update(account.stripeSubscriptionId, { cancel_at_period_end: true });
}

/**
 * Revierte una cancelación programada (ver cancelSubscriptionAtPeriodEnd)
 * mientras todavía no llega la fecha — la suscripción sigue exactamente
 * igual, nunca se interrumpió.
 */
export async function resumeSubscription() {
  const { accountId, role } = await requireSessionAccount();
  if (role !== "ADMINISTRADOR") {
    throw new Error("Solo un administrador puede reactivar la suscripción");
  }

  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  if (!account.stripeSubscriptionId) {
    throw new Error("No tienes una suscripción activa");
  }

  await stripe.subscriptions.update(account.stripeSubscriptionId, { cancel_at_period_end: false });
}
