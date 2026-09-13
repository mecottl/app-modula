import { requireSessionAccount } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession, createBillingPortalSession } from "@/lib/actions/billing";

export const dynamic = "force-dynamic";

const planLabels: Record<string, string> = { BASICO: "Básico", PROFESIONAL: "Profesional" };
const planPrices: Record<string, string> = { BASICO: "$499 MXN/mes", PROFESIONAL: "$999 MXN/mes" };
const billingStatusLabels: Record<string, string> = {
  TRIAL: "Periodo de prueba",
  ACTIVO: "Activo",
  MOROSO: "Pago pendiente",
  CANCELADO: "Cancelado",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; checkout?: string }>;
}) {
  const { error, checkout } = await searchParams;
  const { accountId, role } = await requireSessionAccount();
  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Facturación</h1>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        {checkout === "success" && (
          <p className="mt-2 text-sm text-green-400">
            Pago recibido. El plan se actualiza en cuanto Stripe confirma la suscripción (unos
            segundos).
          </p>
        )}
        {checkout === "cancelled" && (
          <p className="mt-2 text-sm text-muted-foreground">Pago cancelado, no se cambió nada.</p>
        )}
      </div>

      <section className="rounded border p-4">
        <h2 className="font-medium">Plan contratado</h2>
        <p className="mt-1 text-sm">
          Plan actual: <strong>{planLabels[account.plan] ?? account.plan}</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          Estado: {billingStatusLabels[account.billingStatus] ?? account.billingStatus}
        </p>

        {role === "ADMINISTRADOR" ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {account.plan !== "PROFESIONAL" && (
              <form action={createCheckoutSession}>
                <input type="hidden" name="plan" value="PROFESIONAL" />
                <button type="submit" className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground">
                  Subir a Profesional ({planPrices.PROFESIONAL})
                </button>
              </form>
            )}
            {account.plan !== "BASICO" && (
              <form action={createCheckoutSession}>
                <input type="hidden" name="plan" value="BASICO" />
                <button type="submit" className="rounded border px-3 py-2 text-sm">
                  Bajar a Básico ({planPrices.BASICO})
                </button>
              </form>
            )}
            {account.stripeCustomerId && (
              <form action={createBillingPortalSession}>
                <button type="submit" className="rounded border px-3 py-2 text-sm">
                  Gestionar suscripción
                </button>
              </form>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Solo un administrador puede cambiar el plan.</p>
        )}
      </section>

      <section className="rounded border p-4">
        <h2 className="font-medium">Historial de facturas y método de pago</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {account.stripeCustomerId
            ? "Se gestionan desde el portal de Stripe — botón \"Gestionar suscripción\" arriba."
            : "Aparecerán aquí en cuanto tengas una suscripción activa vía Stripe."}
        </p>
      </section>
    </div>
  );
}
