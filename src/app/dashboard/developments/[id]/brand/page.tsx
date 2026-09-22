import { requireDevelopmentForSession } from "@/lib/tenant";
import { updateDevelopmentBrand, uploadDevelopmentLogo } from "@/lib/actions/developments";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { LogoUploader } from "@/components/dashboard/logo-uploader";
import { ColorInput } from "@/components/ui/color-input";
import { ValidatedInput } from "@/components/ui/validated-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export const dynamic = "force-dynamic";

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { error, ok } = await searchParams;
  const development = await requireDevelopmentForSession(id);
  const action = updateDevelopmentBrand.bind(null, id);
  const uploadLogoAction = uploadDevelopmentLogo.bind(null, id);

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <ToastFromParams ok={ok ? "Guardado." : undefined} error={error} />

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="flex items-center gap-1.5 font-medium">
            Marca
            <InfoTooltip text="Lo que ve el comprador en la página pública y el widget." />
          </h2>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Logo
          <LogoUploader currentLogoUrl={development.logoUrl} uploadAction={uploadLogoAction} />
        </label>

        <form action={action} className="flex flex-col gap-4">
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
          <SubmitButton className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
            Guardar
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
