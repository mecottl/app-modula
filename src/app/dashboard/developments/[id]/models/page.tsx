import { requireDevelopmentForSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { createModel, updateModel, deleteModel } from "@/lib/actions/models";

export const dynamic = "force-dynamic";

export default async function ModelsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  await requireDevelopmentForSession(id);
  const models = await prisma.model.findMany({
    where: { developmentId: id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-medium">Catálogo de modelos</h2>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>

      <ul className="flex flex-col gap-3">
        {models.map((model) => {
          const updateAction = updateModel.bind(null, id, model.id);
          const deleteAction = deleteModel.bind(null, id, model.id);
          return (
            <li key={model.id} className="rounded border p-4">
              <details>
                <summary className="cursor-pointer font-medium">
                  {model.name} — ${model.basePrice.toString()} {!model.active && "(inactivo)"}
                </summary>
                <form action={updateAction} className="mt-4 flex flex-col gap-3 sm:max-w-sm">
                  <label className="flex flex-col gap-1 text-sm">
                    Nombre
                    <input
                      name="name"
                      required
                      maxLength={120}
                      defaultValue={model.name}
                      className="rounded border px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    Descripción
                    <textarea
                      name="description"
                      maxLength={2000}
                      defaultValue={model.description ?? ""}
                      className="rounded border px-3 py-2"
                      rows={2}
                    />
                  </label>
                  <div className="flex gap-4">
                    <label className="flex flex-1 flex-col gap-1 text-sm">
                      m²
                      <input
                        name="areaM2"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        defaultValue={model.areaM2.toString()}
                        className="rounded border px-3 py-2"
                      />
                    </label>
                    <label className="flex flex-1 flex-col gap-1 text-sm">
                      Recámaras
                      <input
                        name="bedrooms"
                        type="number"
                        min="0"
                        required
                        defaultValue={model.bedrooms}
                        className="rounded border px-3 py-2"
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-sm">
                    Precio base
                    <input
                      name="basePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      defaultValue={model.basePrice.toString()}
                      className="rounded border px-3 py-2"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input name="active" type="checkbox" defaultChecked={model.active} />
                    Activo (visible en el configurador)
                  </label>
                  <div className="flex gap-3">
                    <button type="submit" className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
                      Guardar
                    </button>
                  </div>
                </form>
                <form action={deleteAction} className="mt-2">
                  <button type="submit" className="text-sm text-red-400 underline">
                    Eliminar modelo
                  </button>
                </form>
              </details>
            </li>
          );
        })}
        {models.length === 0 && <li className="text-sm text-muted-foreground">Sin modelos aún.</li>}
      </ul>

      <section className="rounded border p-4">
        <h3 className="font-medium">Agregar modelo</h3>
        <form action={createModel.bind(null, id)} className="mt-3 flex flex-col gap-3 sm:max-w-sm">
          <label className="flex flex-col gap-1 text-sm">
            Nombre
            <input name="name" required maxLength={120} className="rounded border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Descripción
            <textarea name="description" maxLength={2000} className="rounded border px-3 py-2" rows={2} />
          </label>
          <div className="flex gap-4">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              m²
              <input
                name="areaM2"
                type="number"
                step="0.01"
                min="0"
                required
                className="rounded border px-3 py-2"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm">
              Recámaras
              <input name="bedrooms" type="number" min="0" required className="rounded border px-3 py-2" />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            Precio base
            <input
              name="basePrice"
              type="number"
              step="0.01"
              min="0"
              required
              className="rounded border px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="active" type="checkbox" defaultChecked />
            Activo (visible en el configurador)
          </label>
          <button type="submit" className="self-start rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
            Crear
          </button>
        </form>
      </section>
    </div>
  );
}
