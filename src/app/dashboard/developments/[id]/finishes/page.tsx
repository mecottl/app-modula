import { requireDevelopmentForSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import {
  createFinishLevel,
  updateFinishLevel,
  deleteFinishLevel,
  createExtra,
  updateExtra,
  deleteExtra,
} from "@/lib/actions/finishes";

export const dynamic = "force-dynamic";

export default async function FinishesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  await requireDevelopmentForSession(id);

  const [finishLevels, extras, models] = await Promise.all([
    prisma.finishLevel.findMany({ where: { developmentId: id }, orderBy: { createdAt: "asc" } }),
    prisma.extra.findMany({
      where: { developmentId: id },
      include: { modelLinks: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.model.findMany({ where: { developmentId: id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="flex flex-col gap-4">
        <h2 className="font-medium">Niveles de acabado</h2>
        <ul className="flex flex-col gap-3">
          {finishLevels.map((fl) => (
            <li key={fl.id} className="rounded border p-4">
              <details>
                <summary className="cursor-pointer font-medium">
                  {fl.name} (+${fl.priceDelta.toString()})
                </summary>
                <form
                  action={updateFinishLevel.bind(null, id, fl.id)}
                  className="mt-4 flex flex-col gap-3 sm:max-w-sm"
                >
                  <label className="flex flex-col gap-1 text-sm">
                    Nombre
                    <input
                      name="name"
                      required
                      maxLength={120}
                      defaultValue={fl.name}
                      className="rounded border px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    Descripción
                    <textarea
                      name="description"
                      maxLength={2000}
                      defaultValue={fl.description ?? ""}
                      className="rounded border px-3 py-2"
                      rows={2}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    Delta de precio
                    <input
                      name="priceDelta"
                      type="number"
                      step="0.01"
                      required
                      defaultValue={fl.priceDelta.toString()}
                      className="rounded border px-3 py-2"
                    />
                  </label>
                  <button type="submit" className="self-start rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
                    Guardar
                  </button>
                </form>
                <form action={deleteFinishLevel.bind(null, id, fl.id)} className="mt-2">
                  <button type="submit" className="text-sm text-red-600 underline">
                    Eliminar
                  </button>
                </form>
              </details>
            </li>
          ))}
          {finishLevels.length === 0 && (
            <li className="text-sm text-muted-foreground">Sin niveles de acabado aún.</li>
          )}
        </ul>

        <div className="rounded border p-4">
          <h3 className="font-medium">Agregar nivel de acabado</h3>
          <form action={createFinishLevel.bind(null, id)} className="mt-3 flex flex-col gap-3 sm:max-w-sm">
            <label className="flex flex-col gap-1 text-sm">
              Nombre
              <input name="name" required maxLength={120} className="rounded border px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Descripción
              <textarea name="description" maxLength={2000} className="rounded border px-3 py-2" rows={2} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Delta de precio
              <input
                name="priceDelta"
                type="number"
                step="0.01"
                required
                defaultValue={0}
                className="rounded border px-3 py-2"
              />
            </label>
            <button type="submit" className="self-start rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
              Crear
            </button>
          </form>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-medium">Extras</h2>
        <ul className="flex flex-col gap-3">
          {extras.map((extra) => {
            const linkedModelIds = new Set(extra.modelLinks.map((l) => l.modelId));
            return (
              <li key={extra.id} className="rounded border p-4">
                <details>
                  <summary className="cursor-pointer font-medium">
                    {extra.name} (+${extra.priceDelta.toString()})
                  </summary>
                  <form
                    action={updateExtra.bind(null, id, extra.id)}
                    className="mt-4 flex flex-col gap-3 sm:max-w-sm"
                  >
                    <label className="flex flex-col gap-1 text-sm">
                      Nombre
                      <input
                        name="name"
                        required
                        maxLength={120}
                        defaultValue={extra.name}
                        className="rounded border px-3 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Descripción
                      <textarea
                        name="description"
                        maxLength={2000}
                        defaultValue={extra.description ?? ""}
                        className="rounded border px-3 py-2"
                        rows={2}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Delta de precio
                      <input
                        name="priceDelta"
                        type="number"
                        step="0.01"
                        required
                        defaultValue={extra.priceDelta.toString()}
                        className="rounded border px-3 py-2"
                      />
                    </label>
                    <fieldset className="flex flex-col gap-1 text-sm">
                      <legend>Aplica a estos modelos</legend>
                      {models.map((model) => (
                        <label key={model.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="modelIds"
                            value={model.id}
                            defaultChecked={linkedModelIds.has(model.id)}
                          />
                          {model.name}
                        </label>
                      ))}
                      {models.length === 0 && (
                        <p className="text-muted-foreground">Crea primero un modelo en Catálogo.</p>
                      )}
                    </fieldset>
                    <button type="submit" className="self-start rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
                      Guardar
                    </button>
                  </form>
                  <form action={deleteExtra.bind(null, id, extra.id)} className="mt-2">
                    <button type="submit" className="text-sm text-red-600 underline">
                      Eliminar
                    </button>
                  </form>
                </details>
              </li>
            );
          })}
          {extras.length === 0 && <li className="text-sm text-muted-foreground">Sin extras aún.</li>}
        </ul>

        <div className="rounded border p-4">
          <h3 className="font-medium">Agregar extra</h3>
          <form action={createExtra.bind(null, id)} className="mt-3 flex flex-col gap-3 sm:max-w-sm">
            <label className="flex flex-col gap-1 text-sm">
              Nombre
              <input name="name" required maxLength={120} className="rounded border px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Descripción
              <textarea name="description" maxLength={2000} className="rounded border px-3 py-2" rows={2} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Delta de precio
              <input
                name="priceDelta"
                type="number"
                step="0.01"
                required
                defaultValue={0}
                className="rounded border px-3 py-2"
              />
            </label>
            <fieldset className="flex flex-col gap-1 text-sm">
              <legend>Aplica a estos modelos</legend>
              {models.map((model) => (
                <label key={model.id} className="flex items-center gap-2">
                  <input type="checkbox" name="modelIds" value={model.id} />
                  {model.name}
                </label>
              ))}
              {models.length === 0 && (
                <p className="text-muted-foreground">Crea primero un modelo en Catálogo.</p>
              )}
            </fieldset>
            <button type="submit" className="self-start rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
              Crear
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
