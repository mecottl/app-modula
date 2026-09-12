import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDevelopmentForSession, TenantAccessError } from "@/lib/tenant";
import { publishDevelopment, unpublishDevelopment } from "@/lib/actions/developments";

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard/developments" className="text-sm text-gray-500 underline">
            ← Todos los desarrollos
          </Link>
          <h1 className="text-lg font-semibold">{development.name}</h1>
          <p className="text-sm text-gray-500">
            /{development.slug} —{" "}
            <span className={development.status === "PUBLICADO" ? "text-green-700" : "text-amber-700"}>
              {development.status === "PUBLICADO" ? "Publicado" : "Borrador"}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/${development.slug}/cotizacion-cliente?preview=1`}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline"
          >
            Ver vista previa
          </a>
          {development.status === "PUBLICADO" ? (
            <form action={unpublishDevelopment.bind(null, development.id)}>
              <button type="submit" className="rounded border px-3 py-1.5 text-sm">
                Volver a borrador
              </button>
            </form>
          ) : (
            <form action={publishDevelopment.bind(null, development.id)}>
              <button type="submit" className="rounded bg-black px-3 py-1.5 text-sm text-white">
                Publicar
              </button>
            </form>
          )}
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 border-b pb-2 text-sm" aria-label="Secciones del desarrollo">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={`/dashboard/developments/${development.id}/${tab.href}`}
            className="rounded px-3 py-1.5 hover:bg-gray-100"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
