import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isDomainAuthorized, extractHostname } from "@/lib/domainValidation";
import { ConfiguratorWizard } from "@/app/[slug]/cotizacion-cliente/ConfiguratorWizard";
import { HeightReporter } from "./HeightReporter";

export const dynamic = "force-dynamic";

/**
 * Widget embebible (Plan B, README.md sección 6.3 y 9.3). En modo
 * producción valida el dominio de origen contra la lista blanca del
 * desarrollo antes de servir contenido; en modo vista previa omite esa
 * validación a propósito para que la desarrolladora pueda probar cambios.
 */
export default async function WidgetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const development = await prisma.development.findUnique({
    where: { slug },
    include: { integrationSettings: true },
  });
  if (!development || !development.integrationSettings) notFound();

  const { environment, authorizedDomains } = development.integrationSettings;

  if (environment === "PRODUCCION") {
    const h = await headers();
    const referer = h.get("referer");
    const hostname = referer ? extractHostname(referer) : null;
    if (!hostname || !isDomainAuthorized(hostname, authorizedDomains)) {
      return (
        <main className="flex min-h-[200px] items-center justify-center p-6 text-center text-sm text-gray-500">
          Este widget no está autorizado para instalarse en este dominio.
        </main>
      );
    }
  }

  const isPreview = environment === "VISTA_PREVIA";

  const [models, finishLevels, extras] = await Promise.all([
    prisma.model.findMany({
      where: { developmentId: development.id, active: true },
      orderBy: { basePrice: "asc" },
    }),
    prisma.finishLevel.findMany({
      where: { developmentId: development.id },
      orderBy: { priceDelta: "asc" },
    }),
    prisma.extra.findMany({
      where: { developmentId: development.id },
      include: { modelLinks: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <main className="px-4 py-4">
      <HeightReporter slug={slug} />
      <ConfiguratorWizard
        slug={slug}
        preview={isPreview}
        currency={development.currency}
        ctaText={development.ctaText ?? "Cotiza tu casa"}
        accentColor={development.accentColor}
        models={models.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          areaM2: m.areaM2.toNumber(),
          bedrooms: m.bedrooms,
          basePrice: m.basePrice.toNumber(),
        }))}
        finishLevels={finishLevels.map((f) => ({
          id: f.id,
          name: f.name,
          description: f.description,
          priceDelta: f.priceDelta.toNumber(),
        }))}
        extras={extras.map((e) => ({
          id: e.id,
          name: e.name,
          description: e.description,
          priceDelta: e.priceDelta.toNumber(),
          modelIds: e.modelLinks.map((l) => l.modelId),
        }))}
      />
      <p className="mt-4 text-center text-xs text-gray-400">
        Cotizador creado con{" "}
        <a href="https://github.com/mecottl/app-modula" target="_blank" rel="noreferrer" className="underline">
          MODULA
        </a>
      </p>
    </main>
  );
}
