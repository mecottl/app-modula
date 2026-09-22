import Link from "next/link";
import { requireSessionAccount } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { listPaymentMethods } from "@/lib/actions/paymentMethods";
import { getSubscriptionCancelInfo } from "@/lib/billingHelpers";
import { CardsManager } from "@/components/billing/cards-manager";
import { SubscriptionCancellation } from "@/components/billing/subscription-cancellation";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const { accountId, permissions } = await requireSessionAccount();
  const { cards, defaultId } = await listPaymentMethods();

  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  const hasActiveSubscription = Boolean(account.stripeSubscriptionId) && account.billingStatus === "ACTIVO";
  const cancelInfo = hasActiveSubscription
    ? await getSubscriptionCancelInfo(account.stripeSubscriptionId!)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard/billing" className="text-xs text-muted-foreground hover:text-foreground">
          ← Facturación
        </Link>
        <h1 className="mt-1 flex items-center gap-1.5 text-xl font-semibold tracking-tight">
          Tarjetas guardadas
          <InfoTooltip text="Se usan para cobrar tu suscripción cada mes. La predeterminada es la que se intenta primero." />
        </h1>
      </div>

      {permissions.includes("billing.manage") ? (
        <>
          <CardsManager initialCards={cards} initialDefaultId={defaultId} />
          {cancelInfo && (
            <SubscriptionCancellation
              cancelAtPeriodEnd={cancelInfo.cancelAtPeriodEnd}
              periodEndDate={cancelInfo.periodEndDate}
            />
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Tu rol no tiene permiso para gestionar las tarjetas.</p>
      )}
    </div>
  );
}
