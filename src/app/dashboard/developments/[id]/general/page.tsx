import { requireDevelopmentForSession } from "@/lib/tenant";
import { updateDevelopmentGeneral } from "@/lib/actions/developments";

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
      <h2 className="font-medium">General y marca</h2>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {ok && <p className="mt-2 text-sm text-green-700">Guardado.</p>}

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
              placeholder="#111111"
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
        <button type="submit" className="self-start rounded bg-black px-4 py-2 text-sm text-white">
          Guardar
        </button>
      </form>
    </div>
  );
}
