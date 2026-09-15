import Link from "next/link";
import { requireDevelopmentForSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/baseUrl";
import { WidgetLivePreview } from "@/components/dashboard/widget-live-preview";

export const dynamic = "force-dynamic";

export default async function IntegrationPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const development = await requireDevelopmentForSession(id);
  const settings = await prisma.integrationSettings.findUniqueOrThrow({ where: { developmentId: id } });
  const baseUrl = await getBaseUrl();
  const widgetUrl = `${baseUrl}/widget/${development.slug}`;

  return (
    <section>
      <h3 className="font-medium">Vista previa en vivo</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Así se ve el widget embebido, sin pegar nada en tu sitio todavía. Esto funciona sin
        importar qué <Link href={`/dashboard/developments/${id}/integration/domains`} className="underline underline-offset-4 hover:text-foreground">entorno</Link> tengas
        configurado — el snippet que copian tus visitantes reales no incluye este acceso especial.
      </p>
      <div className="mt-3 overflow-hidden rounded border">
        <WidgetLivePreview src={`${widgetUrl}?preview_token=${settings.token}`} slug={development.slug} />
      </div>
    </section>
  );
}
