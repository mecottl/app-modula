import { requireDevelopmentForSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/baseUrl";
import { updateIntegrationSettings, regenerateIntegrationToken } from "@/lib/actions/integration";

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
      <div>
        <h2 className="font-medium">Integración (Plan Profesional — widget embebible)</h2>
        <p className="mt-1 text-sm text-gray-500">
          Copia este snippet en el sitio de la desarrolladora para embeber el configurador vía{" "}
          <code>iframe</code>.
        </p>
        {ok && <p className="mt-2 text-sm text-green-700">{ok}</p>}
      </div>

      <section>
        <h3 className="font-medium">Snippet de instalación</h3>
        <pre className="mt-2 overflow-x-auto rounded border bg-gray-50 p-3 text-xs">{snippet}</pre>
      </section>

      <section className="rounded border p-4">
        <h3 className="font-medium">Entorno y dominios autorizados</h3>
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
          <button type="submit" className="self-start rounded bg-black px-4 py-2 text-sm text-white">
            Guardar
          </button>
        </form>
      </section>

      <section className="rounded border p-4">
        <h3 className="font-medium">Token del proyecto</h3>
        <p className="mt-1 break-all font-mono text-xs text-gray-500">{settings.token}</p>
        <form action={regenerateIntegrationToken.bind(null, id)} className="mt-3">
          <button type="submit" className="rounded border px-4 py-2 text-sm">
            Regenerar token
          </button>
        </form>
        <p className="mt-1 text-xs text-amber-700">
          Regenerar invalida el token anterior de inmediato — hazlo solo si se filtró.
        </p>
      </section>
    </div>
  );
}
