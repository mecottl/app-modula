import { requireSessionAccount } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { stripe, planFromPriceId } from "@/lib/stripe";
import { createCheckoutSession, createBillingPortalSession } from "@/lib/actions/billing";

async function getPendingDowngrade(subscriptionId: string) {
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

const invoiceStatusLabels: Record<string, string> = {
  paid: "Pagada",
  open: "Pendiente",
  void: "Anulada",
  uncollectible: "Incobrable",
  draft: "Borrador",
};

async function getRecentInvoices(customerId: string) {
  const invoices = await stripe.invoices.list({ customer: customerId, limit: 5 });
  return invoices.data.map((invoice) => ({
    id: invoice.id,
    date: new Date(invoice.created * 1000).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    total: (invoice.total / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 }),
    currency: invoice.currency.toUpperCase(),
    status: invoiceStatusLabels[invoice.status ?? ""] ?? invoice.status,
    hostedUrl: invoice.hosted_invoice_url,
    lines: invoice.lines.data.map((line) => ({
      description: line.description,
      amount: (line.amount / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 }),
    })),
  }));
}

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
  const { error, ok, checkout } = await searchParams;
  const { accountId, role } = await requireSessionAccount();
  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  const invoices = account.stripeCustomerId ? await getRecentInvoices(account.stripeCustomerId) : [];
  const pendingDowngrade =
    account.stripeSubscriptionId && account.billingStatus === "ACTIVO"
      ? await getPendingDowngrade(account.stripeSubscriptionId)
      : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Facturación</h1>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        {ok && <p className="mt-2 text-sm text-green-400">{ok}</p>}
        {checkout === "success" && (
          <p className="mt-2 text-sm text-green-400">Pago recibido, tu plan ya está actualizado.</p>
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
        {pendingDowngrade && (
          <p className="mt-1 text-sm text-amber-400">
            Baja a {planLabels[pendingDowngrade.plan] ?? pendingDowngrade.plan} programada para el{" "}
            {pendingDowngrade.date}. Sin cargos ni reembolsos mientras tanto.
          </p>
        )}

        {role === "ADMINISTRADOR" ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {(account.plan !== "PROFESIONAL" || pendingDowngrade) && (
              <form action={createCheckoutSession}>
                <input type="hidden" name="plan" value="PROFESIONAL" />
                <button type="submit" className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground">
                  {pendingDowngrade
                    ? "Cancelar baja programada"
                    : `Subir a Profesional (${planPrices.PROFESIONAL})`}
                </button>
              </form>
            )}
            {account.plan !== "BASICO" && !pendingDowngrade && (
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
        <h2 className="font-medium">Historial de facturas</h2>
        {invoices.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {account.stripeCustomerId
              ? "Todavía no hay facturas."
              : "Aparecerán aquí en cuanto tengas una suscripción activa."}
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {invoices.map((invoice) => (
              <li key={invoice.id} className="rounded border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">{invoice.date}</span>
                  <span className="font-medium">
                    {invoice.total} {invoice.currency}
                  </span>
                  <span className="text-xs text-muted-foreground">{invoice.status}</span>
                </div>
                <ul className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                  {invoice.lines.map((line, i) => (
                    <li key={i} className="flex justify-between gap-4">
                      <span>{line.description}</span>
                      <span>{line.amount}</span>
                    </li>
                  ))}
                </ul>
                {invoice.hostedUrl && (
                  <a
                    href={invoice.hostedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs underline underline-offset-4"
                  >
                    Ver factura
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          El método de pago y la cancelación se gestionan desde el botón &quot;Gestionar
          suscripción&quot; arriba.
        </p>
      </section>
    </div>
  );
}
