import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { requireSessionAccount } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { getPendingDowngrade } from "@/lib/billingHelpers";
import { changePlan } from "@/lib/actions/billing";

export const dynamic = "force-dynamic";

/**
 * Pantalla de confirmación para subir de Básico a Profesional: a
 * diferencia de bajar de plan (que solo se agenda, sin cargo
 * inmediato), subir sí cobra hoy mismo la diferencia prorrateada — por
 * eso tiene su propia pantalla mostrando el monto exacto antes de
 * confirmar, en vez de un botón de un solo clic.
 */
export default async function UpgradePage() {
  const { accountId, role } = await requireSessionAccount();
  if (role !== "ADMINISTRADOR") {
    redirect("/dashboard/billing");
  }

  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  const hasActiveSubscription = Boolean(account.stripeSubscriptionId) && account.billingStatus === "ACTIVO";
  if (!hasActiveSubscription || account.plan === "PROFESIONAL") {
    redirect("/dashboard/billing");
  }

  const pendingDowngrade = await getPendingDowngrade(account.stripeSubscriptionId!);
  const newPriceId = STRIPE_PRICE_IDS.PROFESIONAL;

  const subscription = await stripe.subscriptions.retrieve(account.stripeSubscriptionId!);
  const currentItem = subscription.items.data[0];

  let amountDue: string | null = null;
  let currency = "MXN";
  try {
    const preview = await stripe.invoices.createPreview({
      subscription: account.stripeSubscriptionId!,
      subscription_details: {
        items: [{ id: currentItem.id, price: newPriceId }],
        // eslint-disable-next-line react-hooks/purity -- server component con dynamic = "force-dynamic": se recalcula en cada solicitud a propósito, no es una regla de render de cliente
        proration_date: Math.floor(Date.now() / 1000),
      },
    });
    // preview_mode por default ("next") incluye también el próximo ciclo
    // completo, no solo el ajuste inmediato — filtramos a solo las
    // líneas de prorrateo (las mismas que genera el cambio real vía
    // proration_behavior: "always_invoice" en changePlan) para mostrar
    // exactamente lo que se cobrará hoy, no una proyección del ciclo
    // siguiente.
    const prorationLines = preview.lines.data.filter(
      (line) => line.description?.includes("Unused time") || line.description?.includes("Remaining time"),
    );
    const amountDueCents = prorationLines.reduce((sum, line) => sum + line.amount, 0);
    amountDue = (amountDueCents / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 });
    currency = preview.currency.toUpperCase();
  } catch {
    amountDue = null;
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <div>
        <Link href="/dashboard/billing" className="text-sm text-muted-foreground underline">
          ← Facturación
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Subir a Plan Profesional</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pendingDowngrade
            ? "Esto cancela la baja programada y te deja en Profesional."
            : "Se cobra hoy mismo solo la diferencia del periodo restante, no el precio completo de nuevo."}
        </p>
      </div>

      <section className="rounded-xl border border-border p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Plan actual</span>
          <span>Básico · $499 MXN/mes</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Nuevo plan</span>
          <span className="font-medium">Profesional · $999 MXN/mes</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Se cobrará hoy</span>
          <span className="text-lg font-semibold">
            {amountDue ? `${amountDue} ${currency}` : "Se calcula al confirmar"}
          </span>
        </div>
      </section>

      <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
        <li className="flex gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
          El widget embebible y la pestaña Integración se desbloquean de inmediato.
        </li>
        <li className="flex gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
          Se usa el método de pago ya guardado; no hace falta capturar la tarjeta de nuevo.
        </li>
      </ul>

      <div className="flex flex-wrap gap-3">
        <form action={changePlan}>
          <input type="hidden" name="plan" value="PROFESIONAL" />
          <button
            type="submit"
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {amountDue ? `Confirmar y pagar ${amountDue} ${currency}` : "Confirmar"}
          </button>
        </form>
        <Link
          href="/dashboard/billing"
          className="rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-foreground"
        >
          Cancelar
        </Link>
      </div>
    </div>
  );
}
