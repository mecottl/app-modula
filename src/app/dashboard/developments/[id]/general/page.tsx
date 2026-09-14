import { requireDevelopmentForSession } from "@/lib/tenant";
import { updateDevelopmentGeneral, updateDevelopmentAdvanced, uploadDevelopmentLogo } from "@/lib/actions/developments";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { LogoUploader } from "@/components/dashboard/logo-uploader";
import { ColorInput } from "@/components/ui/color-input";
import { ValidatedInput, ValidatedTextarea } from "@/components/ui/validated-input";

export const dynamic = "force-dynamic";

export default async function GeneralPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { error, ok } = await searchParams;
  const development = await requireDevelopmentForSession(id);
  const action = updateDevelopmentGeneral.bind(null, id);
  const advancedAction = updateDevelopmentAdvanced.bind(null, id);
  const uploadLogoAction = uploadDevelopmentLogo.bind(null, id);

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <ToastFromParams ok={ok ? "Guardado." : undefined} error={error} />

      <section className="flex flex-col gap-4">
        <h2 className="font-medium">General y marca</h2>

        <label className="flex flex-col gap-1 text-sm">
          Logo
          <LogoUploader currentLogoUrl={development.logoUrl} uploadAction={uploadLogoAction} />
        </label>

        <form action={action} className="flex flex-col gap-4">
          <ValidatedInput label="Nombre" name="name" required maxLength={120} defaultValue={development.name} />
          <ValidatedTextarea
            label="Descripción"
            name="description"
            maxLength={2000}
            defaultValue={development.description ?? ""}
            rows={3}
          />
          <ValidatedInput
            label="Texto del CTA"
            name="ctaText"
            maxLength={80}
            defaultValue={development.ctaText ?? ""}
            placeholder="Cotiza tu casa"
          />
          <div className="flex gap-4">
            <div className="flex-1">
              <ColorInput name="primaryColor" label="Color primario" defaultValue={development.primaryColor} />
            </div>
            <div className="flex-1">
              <ColorInput name="accentColor" label="Color de acento" defaultValue={development.accentColor} />
            </div>
          </div>
          <button
            type="submit"
            className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Guardar
          </button>
        </form>
      </section>

      <details className="group rounded-xl border border-border p-5">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground group-open:text-foreground">
          Configuración avanzada
        </summary>
        <form action={advancedAction} className="mt-4 flex flex-col gap-4">
          <ValidatedInput
            label="Moneda"
            name="currency"
            required
            minLength={3}
            maxLength={6}
            pattern="[A-Za-z]{3,6}"
            defaultValue={development.currency}
            errorMessage="Usa un código de moneda de 3 a 6 letras, ej. MXN"
          />
          <ValidatedInput
            label="Webhook de cotizaciones (opcional)"
            name="webhookUrl"
            type="url"
            defaultValue={development.webhookUrl ?? ""}
            placeholder="https://tu-crm.com/webhooks/modula"
            hint="Cada cotización nueva se enviará también como POST a esta URL."
            errorMessage="Ingresa una URL válida (https://…)"
          />
          <button
            type="submit"
            className="self-start rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground"
          >
            Guardar
          </button>
        </form>
      </details>
    </div>
  );
}
