import { ImageIcon, Pencil, Plus } from "lucide-react";
import { requireDevelopmentForSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import {
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
import { ModelChipPicker } from "@/components/dashboard/model-chip-picker";
import { ImageGallery } from "@/components/dashboard/image-gallery";

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
      <ToastFromParams error={error} />

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium">Niveles de acabado</h2>
          <FormDialog
            title="Agregar nivel de acabado"
            description="Podrás agregar imágenes después de crearlo, desde Editar."
            trigger={
              <Button size="sm" className="gap-2 rounded-full">
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            }
          >
            <form action={createFinishLevel.bind(null, id)} className="flex flex-col gap-4">
              <ValidatedInput label="Nombre" name="name" required maxLength={120} autoFocus />
              <ValidatedTextarea label="Descripción" name="description" maxLength={2000} rows={2} />
              <ValidatedInput
                label="Delta de precio"
                name="priceDelta"
                type="number"
                step="0.01"
                required
                defaultValue={0}
                errorMessage="Ingresa un número válido"
              />
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
          {finishLevels.map((fl) => (
            <li
              key={fl.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                  {fl.imageUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fl.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </span>
                <div>
                  <p className="font-medium">{fl.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">+${fl.priceDelta.toString()}</p>
                </div>
              </div>
              <FormDialog
                title="Editar nivel de acabado"
                trigger={
                  <button
                    type="button"
                    aria-label="Editar nivel de acabado"
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                }
              >
                <ImageGallery
                  images={fl.imageUrls}
                  addAction={addFinishLevelImage.bind(null, id, fl.id)}
                  removeAction={removeFinishLevelImage.bind(null, id, fl.id)}
                />
                <form action={updateFinishLevel.bind(null, id, fl.id)} className="mt-4 flex flex-col gap-4">
                  <ValidatedInput label="Nombre" name="name" required maxLength={120} defaultValue={fl.name} />
                  <ValidatedTextarea
                    label="Descripción"
                    name="description"
                    maxLength={2000}
                    defaultValue={fl.description ?? ""}
                    rows={2}
                  />
                  <ValidatedInput
                    label="Delta de precio"
                    name="priceDelta"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={fl.priceDelta.toString()}
                    errorMessage="Ingresa un número válido"
                  />
                  <button
                    type="submit"
                    className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Guardar
                  </button>
                </form>
                <form action={deleteFinishLevel.bind(null, id, fl.id)} className="mt-1 border-t border-border pt-4">
                  <button type="submit" className="text-sm text-red-400 underline underline-offset-4">
                    Eliminar
                  </button>
                </form>
              </FormDialog>
            </li>
          ))}
          {finishLevels.length === 0 && (
            <EmptyState
              title="Sin niveles de acabado aún"
              description="Son opcionales: si no agregas ninguno, el comprador solo ve el precio base."
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
              <ValidatedInput
                label="Delta de precio"
                name="priceDelta"
                type="number"
                step="0.01"
                required
                defaultValue={0}
                errorMessage="Ingresa un número válido"
              />
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
                    <p className="mt-0.5 text-sm text-muted-foreground">+${extra.priceDelta.toString()}</p>
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
                    <ValidatedInput
                      label="Delta de precio"
                      name="priceDelta"
                      type="number"
                      step="0.01"
                      required
                      defaultValue={extra.priceDelta.toString()}
                      errorMessage="Ingresa un número válido"
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
              description="Son opcionales — agrégalos con el botón de arriba si quieres ofrecer mejoras adicionales por modelo."
            />
          )}
        </ul>
      </section>
    </div>
  );
}
