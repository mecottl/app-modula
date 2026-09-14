import { Pencil, Plus } from "lucide-react";
import { requireDevelopmentForSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { createPromotion, updatePromotion, deletePromotion } from "@/lib/actions/promotions";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { EmptyState } from "@/components/ui/empty-state";
import { FormDialog } from "@/components/ui/form-dialog";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";

const selectClass =
  "rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground";

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
      <ToastFromParams error={error} warning={warning} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">Reglas de precio (promociones)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            El comprador debe ingresar el código en el configurador — no se aplican solas.
          </p>
        </div>
        <FormDialog
          title="Agregar promoción"
          description="El comprador debe teclear este código en el configurador para que se aplique."
          trigger={
            <Button size="sm" className="gap-2 rounded-full">
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          }
        >
          <form action={createPromotion.bind(null, id)} className="flex flex-col gap-4">
            <ValidatedInput label="Nombre" name="name" required maxLength={120} autoFocus />
            <ValidatedInput
              label="Código"
              name="code"
              required
              minLength={3}
              maxLength={40}
              pattern="[A-Za-z0-9-]+"
              placeholder="VERANO2026"
              hint="Solo letras, números y guiones. Se guarda en mayúsculas."
              errorMessage="Usa solo letras, números y guiones (mínimo 3 caracteres)"
              className="uppercase placeholder:normal-case"
            />
            <label className="flex flex-col gap-1 text-sm">
              Tipo
              <select name="type" defaultValue="PORCENTAJE" className={selectClass}>
                <option value="PORCENTAJE">Porcentaje (%)</option>
                <option value="FIJO">Monto fijo</option>
              </select>
            </label>
            <ValidatedInput
              label="Valor"
              name="value"
              type="number"
              step="0.01"
              min="0.01"
              required
              errorMessage="Ingresa un valor mayor a 0"
            />
            <div className="flex gap-4">
              <ValidatedInput label="Desde" name="startDate" type="date" required />
              <ValidatedInput label="Hasta" name="endDate" type="date" required />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input name="active" type="checkbox" defaultChecked />
              Activa
            </label>
            <button
              type="submit"
              className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Crear
            </button>
          </form>
        </FormDialog>
      </div>

      <ul className="flex flex-col gap-3">
        {promotions.map((promo) => (
          <li
            key={promo.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
          >
            <div>
              <p className="font-medium">{promo.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                  {promo.code}
                </span>{" "}
                · {promo.type === "PORCENTAJE" ? `${promo.value}%` : `$${promo.value}`}{" "}
                {!promo.active && "· Inactiva"}
              </p>
            </div>
            <FormDialog
              title="Editar promoción"
              trigger={
                <button
                  type="button"
                  aria-label="Editar promoción"
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              }
            >
              <form action={updatePromotion.bind(null, id, promo.id)} className="flex flex-col gap-4">
                <ValidatedInput
                  label="Nombre"
                  name="name"
                  required
                  maxLength={120}
                  defaultValue={promo.name}
                />
                <ValidatedInput
                  label="Código"
                  name="code"
                  required
                  minLength={3}
                  maxLength={40}
                  pattern="[A-Za-z0-9-]+"
                  defaultValue={promo.code}
                  hint="Solo letras, números y guiones. Se guarda en mayúsculas."
                  errorMessage="Usa solo letras, números y guiones (mínimo 3 caracteres)"
                  className="uppercase placeholder:normal-case"
                />
                <label className="flex flex-col gap-1 text-sm">
                  Tipo
                  <select name="type" defaultValue={promo.type} className={selectClass}>
                    <option value="PORCENTAJE">Porcentaje (%)</option>
                    <option value="FIJO">Monto fijo</option>
                  </select>
                </label>
                <ValidatedInput
                  label="Valor"
                  name="value"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={promo.value.toString()}
                  errorMessage="Ingresa un valor mayor a 0"
                />
                <div className="flex gap-4">
                  <ValidatedInput
                    label="Desde"
                    name="startDate"
                    type="date"
                    required
                    defaultValue={toDateInputValue(promo.startDate)}
                  />
                  <ValidatedInput
                    label="Hasta"
                    name="endDate"
                    type="date"
                    required
                    defaultValue={toDateInputValue(promo.endDate)}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input name="active" type="checkbox" defaultChecked={promo.active} />
                  Activa
                </label>
                <button
                  type="submit"
                  className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Guardar
                </button>
              </form>
              <form action={deletePromotion.bind(null, id, promo.id)} className="mt-1 border-t border-border pt-4">
                <button type="submit" className="text-sm text-red-400 underline underline-offset-4">
                  Eliminar
                </button>
              </form>
            </FormDialog>
          </li>
        ))}
        {promotions.length === 0 && (
          <EmptyState
            title="Sin promociones aún"
            description="Son opcionales: crea una con el botón de arriba y comparte el código con tus compradores."
          />
        )}
      </ul>
    </div>
  );
}
