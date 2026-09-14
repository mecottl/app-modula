import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDevelopmentForSession, TenantAccessError } from "@/lib/tenant";
import { publishDevelopment, unpublishDevelopment } from "@/lib/actions/developments";
import { DevelopmentNavAnnouncer } from "@/components/dashboard/development-nav-announcer";

const tabs = [
  { href: "general", label: "General y marca" },
  { href: "models", label: "Catálogo" },
  { href: "finishes", label: "Acabados y extras" },
  { href: "promotions", label: "Reglas de precio" },
  { href: "quotes", label: "Cotizaciones" },
  { href: "analytics", label: "Analítica" },
  { href: "integration", label: "Integración" },
];

export default async function DevelopmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let development;
  try {
    development = await requireDevelopmentForSession(id);
  } catch (error) {
    if (error instanceof TenantAccessError) notFound();
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <DevelopmentNavAnnouncer id={development.id} name={development.name} tabs={tabs} />

      <div className="flex flex-col gap-3 rounded-xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard/developments" className="text-xs text-muted-foreground hover:text-foreground">
            ← Todos los desarrollos
          </Link>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">{development.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            /{development.slug}{" "}
            <span className={development.status === "PUBLICADO" ? "text-green-400" : "text-amber-400"}>
              · {development.status === "PUBLICADO" ? "Publicado" : "Borrador"}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/${development.slug}/cotizacion-cliente?preview=1`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Ver vista previa
          </a>
          {development.status === "PUBLICADO" ? (
            <form action={unpublishDevelopment.bind(null, development.id)}>
              <button
                type="submit"
                className="rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:border-foreground"
              >
                Volver a borrador
              </button>
            </form>
          ) : (
            <form action={publishDevelopment.bind(null, development.id)}>
              <button
                type="submit"
                className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Publicar
              </button>
            </form>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
