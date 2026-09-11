import { requireSessionAccount } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/auth";

/**
 * Placeholder del dashboard (Fase 0): solo demuestra que la sesión
 * autenticada resuelve un `accountId` y que las consultas quedan acotadas
 * a esa cuenta. Los módulos reales (Catálogo, Acabados, Cotizaciones,
 * etc.) se construyen en la Fase 1.
 */
export default async function DashboardPage() {
  const { accountId } = await requireSessionAccount();
  const account = await prisma.account.findUniqueOrThrow({
    where: { id: accountId },
    include: { developments: true },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-semibold">{account.name}</h1>
      <p className="text-sm text-gray-500">Plan: {account.plan}</p>
      <h2 className="mt-6 font-medium">Desarrollos</h2>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {account.developments.map((d) => (
          <li key={d.id}>
            {d.name} ({d.slug}) — {d.status}
          </li>
        ))}
        {account.developments.length === 0 && <li>Sin desarrollos aún.</li>}
      </ul>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
        className="mt-8"
      >
        <button type="submit" className="text-sm underline">
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
