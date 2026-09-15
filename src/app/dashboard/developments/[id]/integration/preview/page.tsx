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
        Así se ve el widget embebido, sin copiar nada. Se muestra en modo vista previa aunque el
        entorno de abajo esté en Producción — el snippet público no incluye esta puerta de vista
        previa.
      </p>
      <div className="mt-3 overflow-hidden rounded border">
        <WidgetLivePreview src={`${widgetUrl}?preview_token=${settings.token}`} slug={development.slug} />
      </div>
    </section>
  );
}
