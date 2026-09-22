import { requireDevelopmentForSession } from "@/lib/tenant";
import {
  setDevelopmentDomain,
  verifyDevelopmentDomain,
  removeDevelopmentDomain,
} from "@/lib/actions/developments";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { SubmitButton } from "@/components/ui/submit-button";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export const dynamic = "force-dynamic";

export default async function IntegrationCustomDomainPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { ok, error } = await searchParams;
  const development = await requireDevelopmentForSession(id);

  return (
    <section className="rounded border p-4">
      <ToastFromParams ok={ok} error={error} />
      <h3 className="flex items-center gap-1.5 font-medium">
        Dominio personalizado
        <InfoTooltip text="Sirve la página propia del configurador (Plan Básico) bajo tu dominio en vez del de MODULA (ej. cotiza.tuempresa.com)." />
      </h3>

      {development.customDomain ? (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm">
            <span className="font-mono">{development.customDomain}</span>{" "}
            {development.customDomainVerifiedAt ? (
              <span className="text-green-400">· Verificado</span>
            ) : (
              <span className="text-amber-400">· Sin verificar</span>
            )}
          </p>

          {!development.customDomainVerifiedAt && development.customDomainToken && (
            <div className="rounded bg-muted p-3 text-xs">
              <p className="text-muted-foreground">
                Agrega este registro TXT en el DNS de tu dominio, y también un CNAME de{" "}
                <span className="font-mono">{development.customDomain}</span> hacia{" "}
                <span className="font-mono">cname.vercel-dns.com</span>:
              </p>
              <p className="mt-2 font-mono">
                TXT _modula-verify.{development.customDomain} → {development.customDomainToken}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {!development.customDomainVerifiedAt && (
              <form action={verifyDevelopmentDomain.bind(null, id)}>
                <SubmitButton className="rounded border px-4 py-2 text-sm">Verificar</SubmitButton>
              </form>
            )}
            <form action={removeDevelopmentDomain.bind(null, id)}>
              <SubmitButton className="text-sm text-red-400 underline underline-offset-4">
                Quitar dominio
              </SubmitButton>
            </form>
          </div>
        </div>
      ) : (
        <form
          action={setDevelopmentDomain.bind(null, id)}
          className="mt-3 flex flex-col gap-3 sm:max-w-md"
        >
          <input
            name="customDomain"
            placeholder="cotiza.tuempresa.com"
            required
            className="rounded border px-3 py-2 text-sm"
          />
          <SubmitButton className="self-start rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
            Guardar dominio
          </SubmitButton>
        </form>
      )}
    </section>
  );
}
