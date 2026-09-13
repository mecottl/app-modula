import { requireDevelopmentForSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { createPromotion, updatePromotion, deletePromotion } from "@/lib/actions/promotions";

export const dynamic = "force-dynamic";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function PromotionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; warning?: string }>;
}) {
  const { id } = await params;
  const { error, warning } = await searchParams;
  await requireDevelopmentForSession(id);
  const promotions = await prisma.promotion.findMany({
    where: { developmentId: id },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-medium">Reglas de precio (promociones)</h2>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        {warning && <p className="mt-2 text-sm text-amber-400">{warning}</p>}
      </div>

      <ul className="flex flex-col gap-3">
        {promotions.map((promo) => (
          <li key={promo.id} className="rounded border p-4">
            <details>
              <summary className="cursor-pointer font-medium">
                {promo.name} · {promo.type === "PORCENTAJE" ? `${promo.value}%` : `$${promo.value}`}{" "}
                {!promo.active && "(inactiva)"}
              </summary>
              <form
                action={updatePromotion.bind(null, id, promo.id)}
                className="mt-4 flex flex-col gap-3 sm:max-w-sm"
              >
                <label className="flex flex-col gap-1 text-sm">
                  Nombre
                  <input
                    name="name"
                    required
                    maxLength={120}
                    defaultValue={promo.name}
                    className="rounded border px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Tipo
                  <select name="type" defaultValue={promo.type} className="rounded border px-3 py-2">
                    <option value="PORCENTAJE">Porcentaje (%)</option>
                    <option value="FIJO">Monto fijo</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Valor
                  <input
                    name="value"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={promo.value.toString()}
                    className="rounded border px-3 py-2"
                  />
                </label>
                <div className="flex gap-4">
                  <label className="flex flex-1 flex-col gap-1 text-sm">
                    Desde
                    <input
                      name="startDate"
                      type="date"
                      required
                      defaultValue={toDateInputValue(promo.startDate)}
                      className="rounded border px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-1 flex-col gap-1 text-sm">
                    Hasta
                    <input
                      name="endDate"
                      type="date"
                      required
                      defaultValue={toDateInputValue(promo.endDate)}
                      className="rounded border px-3 py-2"
                    />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input name="active" type="checkbox" defaultChecked={promo.active} />
                  Activa
                </label>
                <button type="submit" className="self-start rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
                  Guardar
                </button>
              </form>
              <form action={deletePromotion.bind(null, id, promo.id)} className="mt-2">
                <button type="submit" className="text-sm text-red-400 underline">
                  Eliminar
                </button>
              </form>
            </details>
          </li>
        ))}
        {promotions.length === 0 && <li className="text-sm text-muted-foreground">Sin promociones aún.</li>}
      </ul>

      <section className="rounded border p-4">
        <h3 className="font-medium">Agregar promoción</h3>
        <form action={createPromotion.bind(null, id)} className="mt-3 flex flex-col gap-3 sm:max-w-sm">
          <label className="flex flex-col gap-1 text-sm">
            Nombre
            <input name="name" required maxLength={120} className="rounded border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Tipo
            <select name="type" defaultValue="PORCENTAJE" className="rounded border px-3 py-2">
              <option value="PORCENTAJE">Porcentaje (%)</option>
              <option value="FIJO">Monto fijo</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Valor
            <input name="value" type="number" step="0.01" min="0" required className="rounded border px-3 py-2" />
          </label>
          <div className="flex gap-4">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              Desde
              <input name="startDate" type="date" required className="rounded border px-3 py-2" />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm">
              Hasta
              <input name="endDate" type="date" required className="rounded border px-3 py-2" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input name="active" type="checkbox" defaultChecked />
            Activa
          </label>
          <button type="submit" className="self-start rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
            Crear
          </button>
        </form>
      </section>
    </div>
  );
}
