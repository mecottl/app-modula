import { requireDevelopmentForSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { updateIntegrationSettings } from "@/lib/actions/integration";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { Select } from "@/components/ui/select";

export const dynamic = "force-dynamic";

export default async function IntegrationDomainsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { ok, error } = await searchParams;
  await requireDevelopmentForSession(id);
  const settings = await prisma.integrationSettings.findUniqueOrThrow({ where: { developmentId: id } });

  return (
    <section id="dominios-autorizados" className="rounded border p-4">
      <ToastFromParams ok={ok} error={error} />
      <h3 className="font-medium">Entorno y dominios autorizados</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Esto es independiente del estado &quot;Publicado/Borrador&quot; del desarrollo: ese
        controla la página propia (Plan Básico); esto de aquí controla únicamente el widget
        embebido (Plan Profesional). <strong>Vista previa</strong> no valida el dominio de origen,
        para que pruebes el widget libremente. <strong>Producción</strong> solo sirve el widget si
        la solicitud viene de uno de los dominios autorizados de abajo — actívalo cuando ya hayas
        pegado el snippet en tu sitio real.
      </p>
      <form
        action={updateIntegrationSettings.bind(null, id)}
        className="mt-3 flex flex-col gap-4 sm:max-w-md"
      >
        <Select
          label="Entorno"
          name="environment"
          defaultValue={settings.environment}
          options={[
            { value: "VISTA_PREVIA", label: "Vista previa (sin validar dominio)" },
            { value: "PRODUCCION", label: "Producción (valida dominio)" },
          ]}
        />
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
  );
}
