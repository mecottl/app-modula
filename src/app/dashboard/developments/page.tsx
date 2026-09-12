import Link from "next/link";
import { requireSessionAccount } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { createDevelopment } from "@/lib/actions/developments";

export const dynamic = "force-dynamic";

export default async function DevelopmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { accountId } = await requireSessionAccount();
  const developments = await prisma.development.findMany({
    where: { accountId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-xl font-semibold">Tus desarrollos</h1>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <ul className="mt-4 flex flex-col gap-2">
          {developments.map((d) => (
            <li key={d.id} className="rounded border p-3">
              <Link href={`/dashboard/developments/${d.id}/general`} className="font-medium underline">
                {d.name}
              </Link>
              <div className="text-sm text-muted-foreground">
                /{d.slug} — {d.status === "PUBLICADO" ? "Publicado" : "Borrador"}
              </div>
            </li>
          ))}
          {developments.length === 0 && (
            <li className="text-sm text-muted-foreground">Aún no tienes desarrollos.</li>
          )}
        </ul>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-medium">Crear nuevo desarrollo</h2>
        <form action={createDevelopment} className="mt-3 flex flex-col gap-3 sm:max-w-sm">
          <label className="flex flex-col gap-1 text-sm">
            Nombre
            <input name="name" required maxLength={120} className="rounded border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Slug (opcional, se genera del nombre)
            <input name="slug" maxLength={64} className="rounded border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Moneda
            <input
              name="currency"
              defaultValue="MXN"
              maxLength={6}
              className="rounded border px-3 py-2"
            />
          </label>
          <button type="submit" className="rounded bg-primary px-3 py-2 text-primary-foreground">
            Crear
          </button>
        </form>
      </section>
    </div>
  );
}
