import Link from "next/link";
import { requireSessionAccount } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { changePlan } from "@/lib/actions/billing";
import { getPendingDowngrade } from "@/lib/billingHelpers";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { SubmitButton } from "@/components/ui/submit-button";

const invoiceStatusLabels: Record<string, string> = {
  paid: "Pagada",
  open: "Pendiente",
  void: "Anulada",
  uncollectible: "Incobrable",
  draft: "Borrador",
};

async function getRecentInvoices(customerId: string, subscriptionId: string) {
  // Filtrado por la suscripción actual, no por todo el cliente de
  // Stripe: si en algún momento se creó y abandonó otra suscripción
  // (ej. cambiando de plan antes de terminar de pagar, ver
  // startSubscriptionForAccount), sus facturas huérfanas no deben
  // aparecer aquí como si fueran cobros reales de esta cuenta.
  const invoices = await stripe.invoices.list({ customer: customerId, subscription: subscriptionId, limit: 5 });
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
  const hasActiveSubscription = Boolean(account.stripeSubscriptionId) && account.billingStatus === "ACTIVO";
  const invoices =
    account.stripeCustomerId && account.stripeSubscriptionId
      ? await getRecentInvoices(account.stripeCustomerId, account.stripeSubscriptionId)
      : [];
  const pendingDowngrade =
    account.stripeSubscriptionId && account.billingStatus === "ACTIVO"
      ? await getPendingDowngrade(account.stripeSubscriptionId)
      : null;

  const checkoutOk = checkout === "success" ? "Pago recibido, tu plan ya está actualizado." : undefined;
  const checkoutInfo = checkout === "cancelled" ? "Pago cancelado, no se cambió nada." : undefined;

  return (
    <div className="flex flex-col gap-8">
      <ToastFromParams ok={ok ?? checkoutOk} error={error} info={checkoutInfo} />
      <h1 className="text-xl font-semibold tracking-tight">Facturación</h1>

      <section className="rounded-xl border border-border p-6">
        <h2 className="font-medium">Plan contratado</h2>
        <p className="mt-2 text-sm">
          Plan actual: <strong>{planLabels[account.plan] ?? account.plan}</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          Estado: {billingStatusLabels[account.billingStatus] ?? account.billingStatus}
        </p>
        {pendingDowngrade && (
          <p className="mt-2 text-sm text-amber-400">
            Baja a {planLabels[pendingDowngrade.plan] ?? pendingDowngrade.plan} programada para el{" "}
            {pendingDowngrade.date}. Sin cargos ni reembolsos mientras tanto.
          </p>
        )}

        {role === "ADMINISTRADOR" && hasActiveSubscription && (
          <div className="mt-5 flex flex-wrap gap-3">
            {pendingDowngrade ? (
              <form action={changePlan}>
                <input type="hidden" name="plan" value="PROFESIONAL" />
                <SubmitButton className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                  Cancelar baja programada
                </SubmitButton>
              </form>
            ) : (
              account.plan !== "PROFESIONAL" && (
                <Link
                  href="/dashboard/billing/upgrade"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Subir a Profesional ({planPrices.PROFESIONAL})
                </Link>
              )
            )}
            {account.plan !== "BASICO" && !pendingDowngrade && (
              <Link
                href="/dashboard/billing/downgrade"
                className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-foreground"
              >
                Bajar a Básico ({planPrices.BASICO})
              </Link>
            )}
          </div>
        )}
        {role !== "ADMINISTRADOR" && (
          <p className="mt-3 text-xs text-muted-foreground">Solo un administrador puede cambiar el plan.</p>
        )}
      </section>

      <section className="rounded-xl border border-border p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">Método de pago y suscripción</h2>
          <Link
            href="/dashboard/billing/cards"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Gestionar →
          </Link>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Agrega o quita tarjetas, cambia la predeterminada, o cancela tu suscripción.
        </p>
      </section>

      <section className="rounded-xl border border-border p-6">
        <h2 className="font-medium">Historial de facturas</h2>
        {invoices.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {account.stripeCustomerId
              ? "Todavía no hay facturas."
              : "Aparecerán aquí en cuanto tengas una suscripción activa."}
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {invoices.map((invoice) => (
              <li key={invoice.id} className="rounded-lg border border-border p-4 text-sm">
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
      </section>
    </div>
  );
}
