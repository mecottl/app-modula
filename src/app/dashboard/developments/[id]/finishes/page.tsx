import { ImageIcon, Pencil, Plus } from "lucide-react";
import { requireDevelopmentForSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import {
  createFinishCategory,
  updateFinishCategory,
  deleteFinishCategory,
  createFinishLevel,
  updateFinishLevel,
  deleteFinishLevel,
  addFinishLevelImage,
  removeFinishLevelImage,
  createExtra,
  updateExtra,
  deleteExtra,
  addExtraImage,
  removeExtraImage,
} from "@/lib/actions/finishes";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { EmptyState } from "@/components/ui/empty-state";
import { FormDialog } from "@/components/ui/form-dialog";
import { Button } from "@/components/ui/button";
import { ValidatedInput, ValidatedTextarea } from "@/components/ui/validated-input";
import { Select } from "@/components/ui/select";
import { MoneyInput } from "@/components/ui/money-input";
import { ModelChipPicker } from "@/components/dashboard/model-chip-picker";
import { ImageGallery } from "@/components/dashboard/image-gallery";
import { formatMoney } from "@/lib/money";

const selectionModeOptions = [
  { value: "UNICA", label: "Única: el comprador elige como máximo una opción" },
  { value: "MULTIPLE", label: "Múltiple: el comprador puede elegir varias" },
];

export const dynamic = "force-dynamic";

const SELECTION_MODE_LABELS = {
  UNICA: "Selección única",
  MULTIPLE: "Selección múltiple",
} as const;

export default async function FinishesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const development = await requireDevelopmentForSession(id);

  const [finishCategories, extras, models] = await Promise.all([
    prisma.finishCategory.findMany({
      where: { developmentId: id },
      include: { options: { orderBy: { createdAt: "asc" } } },
      orderBy: { order: "asc" },
    }),
    prisma.extra.findMany({
      where: { developmentId: id },
      include: { modelLinks: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.model.findMany({ where: { developmentId: id }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <ToastFromParams error={error} />

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium">Categorías de acabado</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cada categoría (ej. fachada principal, carpintería) tiene sus propias opciones, y tú
              decides si el comprador elige solo una o varias.
            </p>
          </div>
          <FormDialog
            title="Agregar categoría de acabado"
            trigger={
              <Button size="sm" className="gap-2 rounded-full">
                <Plus className="h-4 w-4" />
                Nueva categoría
              </Button>
            }
          >
            <form action={createFinishCategory.bind(null, id)} className="flex flex-col gap-4">
              <ValidatedInput label="Nombre" name="name" required maxLength={120} autoFocus />
              <Select label="Selección" name="selectionMode" defaultValue="UNICA" options={selectionModeOptions} />
              <button
                type="submit"
                className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Crear
              </button>
            </form>
          </FormDialog>
        </div>

        <ul className="flex flex-col gap-6">
          {finishCategories.map((category) => (
            <li key={category.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {SELECTION_MODE_LABELS[category.selectionMode]}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <FormDialog
                    title="Agregar opción"
                    description="Podrás agregar imágenes después de crearla, desde Editar."
                    trigger={
                      <Button size="sm" variant="outline" className="gap-2 rounded-full">
                        <Plus className="h-4 w-4" />
                        Opción
                      </Button>
                    }
                  >
                    <form
                      action={createFinishLevel.bind(null, id, category.id)}
                      className="flex flex-col gap-4"
                    >
                      <ValidatedInput label="Nombre" name="name" required maxLength={120} autoFocus />
                      <ValidatedTextarea label="Descripción" name="description" maxLength={2000} rows={2} />
                      <MoneyInput label="Delta de precio" name="priceDelta" required defaultValue={0} />
                      <button
                        type="submit"
                        className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        Crear
                      </button>
                    </form>
                  </FormDialog>
                  <FormDialog
                    title="Editar categoría"
                    trigger={
                      <button
                        type="button"
                        aria-label="Editar categoría"
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    }
                  >
                    <form
                      action={updateFinishCategory.bind(null, id, category.id)}
                      className="flex flex-col gap-4"
                    >
                      <ValidatedInput
                        label="Nombre"
                        name="name"
                        required
                        maxLength={120}
                        defaultValue={category.name}
                      />
                      <Select
                        label="Selección"
                        name="selectionMode"
                        defaultValue={category.selectionMode}
                        options={selectionModeOptions}
                      />
                      <button
                        type="submit"
                        className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        Guardar
                      </button>
                    </form>
                    <form
                      action={deleteFinishCategory.bind(null, id, category.id)}
                      className="mt-4 border-t border-border pt-4"
                    >
                      <button type="submit" className="text-sm text-red-400 underline underline-offset-4">
                        Eliminar categoría
                      </button>
                    </form>
                  </FormDialog>
                </div>
              </div>

              <ul className="mt-4 flex flex-col gap-3">
                {category.options.map((option) => (
                  <li
                    key={option.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                        {option.imageUrls[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={option.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{option.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          +{formatMoney(option.priceDelta.toString(), development.currency)}
                        </p>
                      </div>
                    </div>
                    <FormDialog
                      title="Editar opción"
                      trigger={
                        <button
                          type="button"
                          aria-label="Editar opción"
                          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      }
                    >
                      <ImageGallery
                        images={option.imageUrls}
                        addAction={addFinishLevelImage.bind(null, id, option.id)}
                        removeAction={removeFinishLevelImage.bind(null, id, option.id)}
                      />
                      <form
                        action={updateFinishLevel.bind(null, id, option.id)}
                        className="mt-4 flex flex-col gap-4"
                      >
                        <ValidatedInput
                          label="Nombre"
                          name="name"
                          required
                          maxLength={120}
                          defaultValue={option.name}
                        />
                        <ValidatedTextarea
                          label="Descripción"
                          name="description"
                          maxLength={2000}
                          defaultValue={option.description ?? ""}
                          rows={2}
                        />
                        <MoneyInput
                          label="Delta de precio"
                          name="priceDelta"
                          required
                          defaultValue={option.priceDelta.toString()}
                        />
                        <button
                          type="submit"
                          className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                        >
                          Guardar
                        </button>
                      </form>
                      <form
                        action={deleteFinishLevel.bind(null, id, option.id)}
                        className="mt-1 border-t border-border pt-4"
                      >
                        <button type="submit" className="text-sm text-red-400 underline underline-offset-4">
                          Eliminar
                        </button>
                      </form>
                    </FormDialog>
                  </li>
                ))}
                {category.options.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin opciones aún en esta categoría.</p>
                )}
              </ul>
            </li>
          ))}
          {finishCategories.length === 0 && (
            <EmptyState
              title="Sin categorías de acabado aún"
              description="Son opcionales: si no agregas ninguna, el comprador solo ve el precio base. Crea una para empezar (ej. Fachada principal)."
            />
          )}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium">Extras</h2>
          <FormDialog
            title="Agregar extra"
            description="Podrás agregar imágenes después de crearlo, desde Editar."
            size="lg"
            trigger={
              <Button size="sm" className="gap-2 rounded-full">
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            }
          >
            <form action={createExtra.bind(null, id)} className="flex flex-col gap-4">
              <ValidatedInput label="Nombre" name="name" required maxLength={120} autoFocus />
              <ValidatedTextarea label="Descripción" name="description" maxLength={2000} rows={2} />
              <MoneyInput label="Delta de precio" name="priceDelta" required defaultValue={0} />
              <ModelChipPicker models={models} selectedIds={new Set()} />
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
          {extras.map((extra) => {
            const linkedModelIds = new Set(extra.modelLinks.map((l) => l.modelId));
            return (
              <li
                key={extra.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                    {extra.imageUrls[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={extra.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </span>
                  <div>
                    <p className="font-medium">{extra.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      +{formatMoney(extra.priceDelta.toString(), development.currency)}
                    </p>
                  </div>
                </div>
                <FormDialog
                  title="Editar extra"
                  size="lg"
                  trigger={
                    <button
                      type="button"
                      aria-label="Editar extra"
                      className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  }
                >
                  <ImageGallery
                    images={extra.imageUrls}
                    addAction={addExtraImage.bind(null, id, extra.id)}
                    removeAction={removeExtraImage.bind(null, id, extra.id)}
                  />
                  <form action={updateExtra.bind(null, id, extra.id)} className="mt-4 flex flex-col gap-4">
                    <ValidatedInput
                      label="Nombre"
                      name="name"
                      required
                      maxLength={120}
                      defaultValue={extra.name}
                    />
                    <ValidatedTextarea
                      label="Descripción"
                      name="description"
                      maxLength={2000}
                      defaultValue={extra.description ?? ""}
                      rows={2}
                    />
                    <MoneyInput
                      label="Delta de precio"
                      name="priceDelta"
                      required
                      defaultValue={extra.priceDelta.toString()}
                    />
                    <ModelChipPicker models={models} selectedIds={linkedModelIds} />
                    <button
                      type="submit"
                      className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      Guardar
                    </button>
                  </form>
                  <form action={deleteExtra.bind(null, id, extra.id)} className="mt-1 border-t border-border pt-4">
                    <button type="submit" className="text-sm text-red-400 underline underline-offset-4">
                      Eliminar
                    </button>
                  </form>
                </FormDialog>
              </li>
            );
          })}
          {extras.length === 0 && (
            <EmptyState
              title="Sin extras aún"
              description="Son opcionales, agrégalos con el botón de arriba si quieres ofrecer mejoras adicionales por modelo."
            />
          )}
        </ul>
      </section>
    </div>
  );
}
