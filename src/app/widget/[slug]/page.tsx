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
export default async function WidgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview_token?: string }>;
}) {
  const { slug } = await params;
  const { preview_token } = await searchParams;

  const development = await prisma.development.findUnique({
    where: { slug },
    include: { integrationSettings: true, account: true },
  });
  if (!development || !development.integrationSettings) notFound();

  // El widget (Plan B) es exclusivo del Plan Profesional — se valida
  // aquí, en el servidor, no solo ocultando la pestaña en el dashboard
  // (mismo principio que la validación de dominio de abajo).
  if (development.account.plan !== "PROFESIONAL") {
    return (
      <main className="flex min-h-[200px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Este widget no está disponible: el desarrollo no pertenece a una cuenta con Plan Profesional.
      </main>
    );
  }

  const { environment, authorizedDomains, token } = development.integrationSettings;

  // Vista previa en vivo desde el dashboard (issue #41): el token del
  // proyecto (mismo que se muestra/regenera en Integración) autoriza al
  // iframe embebido ahí a ver el widget aunque el entorno esté en
  // Producción, sin exponer el snippet público a esta puerta trasera —
  // el token nunca forma parte del snippet de instalación.
  const isTokenPreview = Boolean(preview_token) && preview_token === token;

  if (environment === "PRODUCCION" && !isTokenPreview) {
    const h = await headers();
    const referer = h.get("referer");
    const hostname = referer ? extractHostname(referer) : null;
    if (!hostname || !isDomainAuthorized(hostname, authorizedDomains)) {
      return (
        <main className="flex min-h-[200px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Este widget no está autorizado para instalarse en este dominio.
        </main>
      );
    }
  }

  const isPreview = environment === "VISTA_PREVIA" || isTokenPreview;

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
    <main>
      <HeightReporter slug={slug} />
      <ConfiguratorWizard
        slug={slug}
        preview={isPreview}
        originPlan="B"
        showHeader={false}
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
        finishLevels={finishLevels.map((f) => ({
          id: f.id,
          name: f.name,
          description: f.description,
          priceDelta: f.priceDelta.toNumber(),
          imageUrls: f.imageUrls,
        }))}
        extras={extras.map((e) => ({
          id: e.id,
          name: e.name,
          description: e.description,
          priceDelta: e.priceDelta.toNumber(),
          modelIds: e.modelLinks.map((l) => l.modelId),
          imageUrls: e.imageUrls,
        }))}
      />
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Cotizador creado con{" "}
        <a href="https://github.com/mecottl/app-modula" target="_blank" rel="noreferrer" className="underline">
          MODULA
        </a>
      </p>
    </main>
  );
}
