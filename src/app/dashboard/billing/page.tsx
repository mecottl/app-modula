import { requireSessionAccount } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { changeAccountPlan } from "@/lib/actions/billing";

export const dynamic = "force-dynamic";

const planLabels: Record<string, string> = { BASICO: "Básico", PROFESIONAL: "Profesional" };
const billingStatusLabels: Record<string, string> = {
  TRIAL: "Periodo de prueba",
  ACTIVO: "Activo",
  MOROSO: "Pago pendiente",
  CANCELADO: "Cancelado",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const { accountId, role } = await requireSessionAccount();
  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Facturación</h1>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {ok && <p className="mt-2 text-sm text-green-700">{ok}</p>}
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
          <form action={changeAccountPlan} className="mt-4 flex items-center gap-3">
            <select name="plan" defaultValue={account.plan} className="rounded border px-3 py-2 text-sm">
              <option value="BASICO">Básico</option>
              <option value="PROFESIONAL">Profesional</option>
            </select>
            <button type="submit" className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground">
              Cambiar plan
            </button>
          </form>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Solo un administrador puede cambiar el plan.</p>
        )}
      </section>

      <section className="rounded border p-4">
        <h2 className="font-medium">Historial de facturas</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Aún no hay un procesador de pagos integrado (ver README.md sección 10). Esta cuenta se
          gestiona manualmente por ahora — el historial de facturas se activará cuando se integre
          un proveedor real (ej. Stripe).
        </p>
      </section>
    </div>
  );
}
