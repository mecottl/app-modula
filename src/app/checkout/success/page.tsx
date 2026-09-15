import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireSessionAccount } from "@/lib/tenant";
import { confirmSubscriptionActivation } from "@/lib/actions/billing";

export const dynamic = "force-dynamic";

const PLAN_LABELS: Record<string, string> = { BASICO: "Plan Básico", PROFESIONAL: "Plan Profesional" };

async function getSubscriptionDetails(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["customer"],
    });
    const price = subscription.items.data[0]?.price;
    const amount = price?.unit_amount != null ? (price.unit_amount / 100).toLocaleString("es-MX") : null;
    const currency = price?.currency?.toUpperCase();
    const interval = price?.recurring?.interval === "month" ? "mes" : price?.recurring?.interval;
    const customer = subscription.customer;
    const customerEmail = typeof customer === "object" && customer && "email" in customer ? customer.email : null;

    return { amount, currency, interval, customerEmail };
  } catch {
    return null;
  }
}

export default async function CheckoutSuccessPage() {
  const { accountId } = await requireSessionAccount();

  // Ya somos nosotros quienes confirmamos la suscripción justo antes de
  // llegar aquí (CheckoutForm), pero se repite por si el usuario
  // recarga esta página directamente.
  await confirmSubscriptionActivation().catch(() => null);

  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  const details = account.stripeSubscriptionId
    ? await getSubscriptionDetails(account.stripeSubscriptionId)
    : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-9 w-9 text-emerald-500" />
        </span>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">¡Pago realizado con éxito!</h1>

        {details?.amount ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Confirmamos tu suscripción a{" "}
            <span className="text-foreground">{PLAN_LABELS[account.plan] ?? account.plan}</span>:{" "}
            <span className="whitespace-nowrap">
              {details.amount} {details.currency}/{details.interval ?? "mes"}
            </span>
            .
            {details.customerEmail && (
              <>
                {" "}
                Te enviamos el recibo a <span className="text-foreground">{details.customerEmail}</span>.
              </>
            )}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Confirmamos tu pago. El plan de tu cuenta ya está activo.
          </p>
        )}

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Ir al dashboard
          </Link>
          <Link
            href="/dashboard/billing"
            className="rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-foreground"
          >
            Ver facturación
          </Link>
        </div>
      </div>
    </main>
  );
}
