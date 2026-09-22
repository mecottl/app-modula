import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { requireSessionAccount } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getPendingDowngrade } from "@/lib/billingHelpers";
import { changePlan } from "@/lib/actions/billing";
import { SubmitButton } from "@/components/ui/submit-button";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export const dynamic = "force-dynamic";

/**
 * Pantalla de confirmación para bajar de Profesional a Básico. Bajar no
 * cobra ni reembolsa nada de inmediato — se agenda el cambio para el
 * final del periodo ya pagado (ver changePlan en
 * src/lib/actions/billing.ts) — por eso esta pantalla existe para dejar
 * clara la fecha exacta y que se conserva el acceso a Profesional hasta
 * entonces, antes de confirmar.
 */
export default async function DowngradePage() {
  const { accountId, permissions } = await requireSessionAccount();
  if (!permissions.includes("billing.manage")) {
    redirect("/dashboard/billing");
  }

  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  const hasActiveSubscription = Boolean(account.stripeSubscriptionId) && account.billingStatus === "ACTIVO";
  if (!hasActiveSubscription || account.plan !== "PROFESIONAL") {
    redirect("/dashboard/billing");
  }

  const pendingDowngrade = await getPendingDowngrade(account.stripeSubscriptionId!);
  if (pendingDowngrade) {
    // Ya hay una baja programada — no hace falta volver a confirmarla.
    redirect("/dashboard/billing");
  }

  const subscription = await stripe.subscriptions.retrieve(account.stripeSubscriptionId!);
  const periodEnd = new Date(subscription.items.data[0].current_period_end * 1000).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <div>
        <Link href="/dashboard/billing" className="text-sm text-muted-foreground underline">
          ← Facturación
        </Link>
        <h1 className="mt-2 flex items-center gap-1.5 text-xl font-semibold">
          Bajar a Plan Básico
          <InfoTooltip text="No se cobra ni se reembolsa nada ahora. El cambio se agenda para cuando termine tu periodo ya pagado." />
        </h1>
      </div>

      <section className="rounded-xl border border-border p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Sigues en Profesional hasta</span>
          <span className="font-medium">{periodEnd}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">A partir de esa fecha</span>
          <span>Básico · $499 MXN/mes</span>
        </div>
      </section>

      <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
        <li className="flex gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
          El widget embebible y la pestaña Integración dejan de estar disponibles a partir de esa fecha.
        </li>
        <li className="flex gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
          Puedes cancelar esta baja programada en cualquier momento antes de esa fecha, desde Facturación.
        </li>
      </ul>

      <div className="flex flex-wrap gap-3">
        <form action={changePlan}>
          <input type="hidden" name="plan" value="BASICO" />
          <SubmitButton className="rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-foreground">
            Confirmar baja para el {periodEnd}
          </SubmitButton>
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
