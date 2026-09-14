import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { requireSessionAccount } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { createDevelopment } from "@/lib/actions/developments";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { EmptyState } from "@/components/ui/empty-state";
import { FormDialog } from "@/components/ui/form-dialog";
import { Button } from "@/components/ui/button";

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
      <ToastFromParams error={error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Tus desarrollos</h1>
        <FormDialog
          title="Crear nuevo desarrollo"
          description="Puedes ajustar moneda y otros datos avanzados después, desde General."
          trigger={
            <Button size="sm" className="gap-2 rounded-full">
              <Plus className="h-4 w-4" />
              Nuevo desarrollo
            </Button>
          }
        >
          <form action={createDevelopment} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              Nombre
              <input
                name="name"
                required
                maxLength={120}
                autoFocus
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
        </FormDialog>
      </div>

      <ul className="flex flex-col gap-3">
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
            description="Crea el primero con el botón de arriba para empezar a configurar tu catálogo."
          />
        )}
      </ul>
    </div>
  );
}
