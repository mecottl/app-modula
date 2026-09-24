import { prisma } from "@/lib/prisma";
import { loadCatalogTree } from "@/lib/catalog";
import type { Development } from "@prisma/client";
import { ConfiguratorWizard } from "./ConfiguratorWizard";

/**
 * Cuerpo del configurador público (Plan A), compartido entre la ruta
 * por slug (/[slug]/cotizacion-cliente) y la resolución por dominio
 * personalizado (issue #29, src/app/page.tsx) — ambas ya resuelven el
 * `development` a mostrar por su cuenta (por slug o por host) y solo
 * necesitan el mismo fetch de catálogo + render del wizard.
 */
export async function ConfiguratorPage({
  development,
  preview,
}: {
  development: Development;
  preview: boolean;
}) {
  const [models, catalog] = await Promise.all([
    prisma.model.findMany({
      where: { developmentId: development.id, active: true },
      orderBy: { basePrice: "asc" },
    }),
    loadCatalogTree(development.id),
  ]);

  return (
    <main className="flex min-h-screen flex-col">
      {preview && development.status !== "PUBLICADO" && (
        <p className="border-b border-amber-700 bg-amber-950 px-6 py-2 text-center text-sm text-amber-400">
          Vista previa: este desarrollo aún está en borrador y no es visible públicamente.
        </p>
      )}

      <ConfiguratorWizard
        slug={development.slug}
        preview={preview}
        originPlan="A"
        developmentName={development.name}
        logoUrl={development.logoUrl}
        currency={development.currency}
        ctaText={development.ctaText ?? "Cotiza tu casa"}
        primaryColor={development.primaryColor}
        accentColor={development.accentColor}
        models={models.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          areaM2: m.areaM2.toNumber(),
          bedrooms: m.bedrooms,
          basePrice: m.basePrice.toNumber(),
          imageUrls: m.imageUrls,
        }))}
        catalog={catalog}
      />
    </main>
  );
}
