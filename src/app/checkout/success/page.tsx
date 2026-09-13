import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { stripe } from "@/lib/stripe";
import { requireSessionAccount } from "@/lib/tenant";
import { syncAccountFromCheckoutSession } from "@/lib/actions/billing";

export const dynamic = "force-dynamic";

async function getCheckoutDetails(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });
    const item = session.line_items?.data[0];
    const price = item?.price;
    const product = price?.product;
    const productName = typeof product === "object" && product && "name" in product ? product.name : null;
    const amount = price?.unit_amount != null ? (price.unit_amount / 100).toLocaleString("es-MX") : null;
    const currency = price?.currency?.toUpperCase();
    const interval = price?.recurring?.interval === "month" ? "mes" : price?.recurring?.interval;
    const priceId = price?.id;

    return {
      customerEmail: session.customer_details?.email ?? null,
      productName,
      amount,
      currency,
      interval,
      priceId,
    };
  } catch {
    return null;
  }
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const { accountId } = await requireSessionAccount();

  if (session_id) {
    await syncAccountFromCheckoutSession(session_id, accountId).catch(() => null);
  }

  const details = session_id ? await getCheckoutDetails(session_id) : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-9 w-9 text-emerald-500" />
        </span>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">¡Pago realizado con éxito!</h1>

        {details?.productName && details.amount ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Confirmamos tu suscripción a <span className="text-foreground">{details.productName}</span>
            {": "}
            {details.amount} {details.currency}/{details.interval ?? "mes"}.
            {details.customerEmail && (
              <>
                {" "}
                Te enviamos el recibo a <span className="text-foreground">{details.customerEmail}</span>.
              </>
            )}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Confirmamos tu pago. El plan de tu cuenta se activa en cuanto se termine de procesar
            la suscripción.
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
