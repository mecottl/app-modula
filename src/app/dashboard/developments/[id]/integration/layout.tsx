import Link from "next/link";
import { requireDevelopmentForSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

/**
 * Integración (Plan Profesional) pasó de una sola página con varias
 * secciones a una página por sección (Snippet, Vista previa, Entorno y
 * dominios, Token, Dominio personalizado) — mismo patrón de árbol que
 * el resto del sidebar, ahora también aplicado dentro de Integración.
 * El gate de plan y el encabezado son iguales para las 5, así que
 * viven una sola vez aquí en vez de repetirse en cada page.tsx.
 */
export default async function IntegrationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const development = await requireDevelopmentForSession(id);

  const account = await prisma.account.findUniqueOrThrow({ where: { id: development.accountId } });
  if (account.plan !== "PROFESIONAL") {
    return (
      <div className="flex flex-col gap-4 rounded border p-6 text-center">
        <h2 className="font-medium">Integración es exclusiva del Plan Profesional</h2>
        <p className="text-sm text-muted-foreground">
          El widget embebible (Plan B) solo está disponible para cuentas en Plan Profesional.
          Tu cuenta está en Plan Básico.
        </p>
        <Link
          href="/dashboard/billing"
          className="mx-auto rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Subir a Plan Profesional
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-medium">Integración (Plan Profesional widget embebible)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Copia este snippet en el sitio de la desarrolladora para embeber el configurador vía{" "}
          <code>iframe</code>.
        </p>
      </div>
      {children}
    </div>
  );
}
