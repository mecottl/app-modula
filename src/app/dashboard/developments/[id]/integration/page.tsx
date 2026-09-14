import Link from "next/link";
import { requireDevelopmentForSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/baseUrl";
import { updateIntegrationSettings, regenerateIntegrationToken } from "@/lib/actions/integration";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { CopyButton } from "@/components/ui/copy-button";
import { WidgetLivePreview } from "@/components/dashboard/widget-live-preview";

export const dynamic = "force-dynamic";

export default async function IntegrationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id } = await params;
  const { ok } = await searchParams;
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

  const settings = await prisma.integrationSettings.findUniqueOrThrow({
    where: { developmentId: id },
  });
  const baseUrl = await getBaseUrl();
  const widgetUrl = `${baseUrl}/widget/${development.slug}`;

  const snippet = `<iframe
  id="modula-widget-${development.slug}"
  src="${widgetUrl}"
  style="width:100%;border:0;display:block;"
  title="Cotizador ${development.name}"
></iframe>
<script>
  window.addEventListener("message", function (event) {
    if (event.data && event.data.type === "modula:resize" && event.data.slug === "${development.slug}") {
      var frame = document.getElementById("modula-widget-${development.slug}");
      if (frame) frame.style.height = event.data.height + "px";
    }
  });
</script>`;

  return (
    <div className="flex flex-col gap-8">
      <ToastFromParams ok={ok} />
      <div>
        <h2 className="font-medium">Integración (Plan Profesional widget embebible)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Copia este snippet en el sitio de la desarrolladora para embeber el configurador vía{" "}
          <code>iframe</code>.
        </p>
      </div>

      <section>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium">Snippet de instalación</h3>
          <CopyButton value={snippet} label="Copiar snippet" />
        </div>
        <pre className="mt-2 overflow-x-auto rounded border bg-muted p-3 text-xs">{snippet}</pre>
      </section>

      <section>
        <h3 className="font-medium">Vista previa en vivo</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Así se ve el widget embebido, sin copiar nada. Se muestra en modo vista previa aunque el
          entorno de abajo esté en Producción — el snippet público no incluye esta puerta de
          vista previa.
        </p>
        <div className="mt-3 overflow-hidden rounded border">
          <WidgetLivePreview src={`${widgetUrl}?preview_token=${settings.token}`} slug={development.slug} />
        </div>
      </section>

      <section className="rounded border p-4">
        <h3 className="font-medium">Entorno y dominios autorizados</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Esto es independiente del estado &quot;Publicado/Borrador&quot; del desarrollo (arriba):
          ese controla la página propia (Plan Básico); esto de aquí controla únicamente el widget
          embebido (Plan Profesional).{" "}
          <strong>Vista previa</strong> no valida el dominio de origen, para que pruebes el widget
          libremente. <strong>Producción</strong> solo sirve el widget si la solicitud viene de uno
          de los dominios autorizados de abajo — actívalo cuando ya hayas pegado el snippet en tu
          sitio real.
        </p>
        <form
          action={updateIntegrationSettings.bind(null, id)}
          className="mt-3 flex flex-col gap-4 sm:max-w-md"
        >
          <label className="flex flex-col gap-1 text-sm">
            Entorno
            <select
              name="environment"
              defaultValue={settings.environment}
              className="rounded border px-3 py-2"
            >
              <option value="VISTA_PREVIA">Vista previa (sin validar dominio)</option>
              <option value="PRODUCCION">Producción (valida dominio)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Dominios autorizados (uno por línea)
            <textarea
              name="authorizedDomains"
              rows={4}
              defaultValue={settings.authorizedDomains.join("\n")}
              placeholder="ejemplo.com&#10;www.ejemplo.com"
              className="rounded border px-3 py-2 font-mono text-xs"
            />
          </label>
          <button type="submit" className="self-start rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
            Guardar
          </button>
        </form>
      </section>

      <section className="rounded border p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium">Token del proyecto</h3>
          <CopyButton value={settings.token} label="Copiar token" />
        </div>
        <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{settings.token}</p>
        <form action={regenerateIntegrationToken.bind(null, id)} className="mt-3">
          <button type="submit" className="rounded border px-4 py-2 text-sm">
            Regenerar token
          </button>
        </form>
        <p className="mt-1 text-xs text-amber-400">
          Regenerar invalida el token anterior de inmediato. Hazlo solo si se filtró.
        </p>
      </section>
    </div>
  );
}
