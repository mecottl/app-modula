import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireSessionAccount } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { createDevelopment } from "@/lib/actions/developments";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { EmptyState } from "@/components/ui/empty-state";

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
        <ToastFromParams error={error} />
        <h1 className="text-xl font-semibold tracking-tight">Tus desarrollos</h1>
        <ul className="mt-4 flex flex-col gap-3">
          {developments.map((d) => (
            <li key={d.id}>
              <Link
                href={`/dashboard/developments/${d.id}/general`}
                className="group flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:border-foreground"
              >
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    /{d.slug}{" "}
                    <span className={d.status === "PUBLICADO" ? "text-green-400" : "text-amber-400"}>
                      · {d.status === "PUBLICADO" ? "Publicado" : "Borrador"}
                    </span>
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            </li>
          ))}
          {developments.length === 0 && (
            <EmptyState
              title="Aún no tienes desarrollos"
              description="Crea el primero abajo para empezar a configurar tu catálogo."
            />
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-border p-6">
        <h2 className="font-medium">Crear nuevo desarrollo</h2>
        <form action={createDevelopment} className="mt-4 flex flex-col gap-4 sm:max-w-sm">
          <label className="flex flex-col gap-1.5 text-sm">
            Nombre
            <input
              name="name"
              required
              maxLength={120}
              className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Slug (opcional, se genera del nombre)
            <input
              name="slug"
              maxLength={64}
              className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Moneda
            <input
              name="currency"
              defaultValue="MXN"
              maxLength={6}
              className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
            />
          </label>
          <button
            type="submit"
            className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Crear
          </button>
        </form>
      </section>
    </div>
  );
}
