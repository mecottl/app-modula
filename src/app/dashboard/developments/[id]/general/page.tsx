import { requireDevelopmentForSession } from "@/lib/tenant";
import { updateDevelopmentGeneral } from "@/lib/actions/developments";
import { ToastFromParams } from "@/components/ui/toast-from-params";

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

  return (
    <div className="max-w-lg">
      <ToastFromParams ok={ok ? "Guardado." : undefined} error={error} />
      <h2 className="font-medium">General y marca</h2>

      <form action={action} className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input
            name="name"
            required
            maxLength={120}
            defaultValue={development.name}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Descripción
          <textarea
            name="description"
            maxLength={2000}
            defaultValue={development.description ?? ""}
            className="rounded border px-3 py-2"
            rows={3}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Moneda
          <input
            name="currency"
            required
            maxLength={6}
            defaultValue={development.currency}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Texto del CTA
          <input
            name="ctaText"
            maxLength={80}
            defaultValue={development.ctaText ?? ""}
            placeholder="Cotiza tu casa"
            className="rounded border px-3 py-2"
          />
        </label>
        <div className="flex gap-4">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Color primario
            <input
              name="primaryColor"
              type="text"
              defaultValue={development.primaryColor ?? ""}
              placeholder="#262626"
              className="rounded border px-3 py-2"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Color de acento
            <input
              name="accentColor"
              type="text"
              defaultValue={development.accentColor ?? ""}
              placeholder="#2563eb"
              className="rounded border px-3 py-2"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          URL del logo
          <input
            name="logoUrl"
            type="url"
            defaultValue={development.logoUrl ?? ""}
            placeholder="https://…"
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Webhook de cotizaciones (opcional)
          <input
            name="webhookUrl"
            type="url"
            defaultValue={development.webhookUrl ?? ""}
            placeholder="https://tu-crm.com/webhooks/modula"
            className="rounded border px-3 py-2"
          />
          <span className="text-xs text-muted-foreground">
            Cada cotización nueva se enviará también como POST a esta URL.
          </span>
        </label>
        <button type="submit" className="self-start rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
          Guardar
        </button>
      </form>
    </div>
  );
}
