import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolvePublicDevelopment } from "@/lib/publicAccess";
import { ConfiguratorWizard } from "./ConfiguratorWizard";

export const dynamic = "force-dynamic";

export default async function CotizacionClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "1";

  const development = await resolvePublicDevelopment(slug, isPreview);
  if (!development) notFound();

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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      {isPreview && development.status !== "PUBLICADO" && (
        <p className="rounded border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Vista previa — este desarrollo aún está en borrador y no es visible públicamente.
        </p>
      )}
      <header>
        {development.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={development.logoUrl} alt={development.name} className="mb-3 h-10" />
        )}
        <h1 className="text-2xl font-semibold">{development.name}</h1>
        {development.description && (
          <p className="mt-1 text-sm text-muted-foreground">{development.description}</p>
        )}
      </header>

      <ConfiguratorWizard
        slug={slug}
        preview={isPreview}
        originPlan="A"
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
    </main>
  );
}
