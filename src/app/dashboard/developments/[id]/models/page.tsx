import { ImageIcon, Pencil, Plus } from "lucide-react";
import { requireDevelopmentForSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { createModel, updateModel, deleteModel, addModelImage, removeModelImage } from "@/lib/actions/models";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { EmptyState } from "@/components/ui/empty-state";
import { FormDialog } from "@/components/ui/form-dialog";
import { Button } from "@/components/ui/button";
import { ValidatedInput, ValidatedTextarea } from "@/components/ui/validated-input";
import { ImageGallery } from "@/components/dashboard/image-gallery";

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
      <ToastFromParams error={error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-medium">Catálogo de modelos</h2>
        <FormDialog
          title="Agregar modelo"
          description="Podrás agregar imágenes después de crearlo, desde Editar."
          size="lg"
          trigger={
            <Button size="sm" className="gap-2 rounded-full">
              <Plus className="h-4 w-4" />
              Agregar modelo
            </Button>
          }
        >
          <form action={createModel.bind(null, id)} className="flex flex-col gap-4">
            <ValidatedInput label="Nombre" name="name" required maxLength={120} autoFocus />
            <ValidatedTextarea label="Descripción" name="description" maxLength={2000} rows={2} />
            <div className="grid grid-cols-2 gap-4">
              <ValidatedInput
                label="m²"
                name="areaM2"
                type="number"
                step="0.01"
                min="1"
                required
                errorMessage="Ingresa un número mayor a 0"
              />
              <ValidatedInput
                label="Recámaras"
                name="bedrooms"
                type="number"
                min="0"
                max="20"
                required
                errorMessage="Ingresa un número entre 0 y 20"
              />
            </div>
            <ValidatedInput
              label="Precio base"
              name="basePrice"
              type="number"
              step="0.01"
              min="1"
              required
              errorMessage="Ingresa un precio mayor a 0"
            />
            <label className="flex items-center gap-2 text-sm">
              <input name="active" type="checkbox" defaultChecked />
              Activo (visible en el configurador)
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
        {models.map((model) => {
          const updateAction = updateModel.bind(null, id, model.id);
          const deleteAction = deleteModel.bind(null, id, model.id);
          return (
            <li
              key={model.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                  {model.imageUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={model.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </span>
                <div>
                  <p className="font-medium">{model.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    ${model.basePrice.toString()} {!model.active && "· Inactivo"}
                  </p>
                </div>
              </div>
              <FormDialog
                title="Editar modelo"
                size="lg"
                trigger={
                  <button
                    type="button"
                    aria-label="Editar modelo"
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                }
              >
                <ImageGallery
                  images={model.imageUrls}
                  addAction={addModelImage.bind(null, id, model.id)}
                  removeAction={removeModelImage.bind(null, id, model.id)}
                />
                <form action={updateAction} className="mt-4 flex flex-col gap-4">
                  <ValidatedInput
                    label="Nombre"
                    name="name"
                    required
                    maxLength={120}
                    defaultValue={model.name}
                  />
                  <ValidatedTextarea
                    label="Descripción"
                    name="description"
                    maxLength={2000}
                    defaultValue={model.description ?? ""}
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <ValidatedInput
                      label="m²"
                      name="areaM2"
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      defaultValue={model.areaM2.toString()}
                      errorMessage="Ingresa un número mayor a 0"
                    />
                    <ValidatedInput
                      label="Recámaras"
                      name="bedrooms"
                      type="number"
                      min="0"
                      max="20"
                      required
                      defaultValue={model.bedrooms}
                      errorMessage="Ingresa un número entre 0 y 20"
                    />
                  </div>
                  <ValidatedInput
                    label="Precio base"
                    name="basePrice"
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    defaultValue={model.basePrice.toString()}
                    errorMessage="Ingresa un precio mayor a 0"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input name="active" type="checkbox" defaultChecked={model.active} />
                    Activo (visible en el configurador)
                  </label>
                  <div className="mt-1 flex items-center justify-between">
                    <button
                      type="submit"
                      className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      Guardar
                    </button>
                  </div>
                </form>
                <form action={deleteAction} className="mt-1 border-t border-border pt-4">
                  <button type="submit" className="text-sm text-red-400 underline underline-offset-4">
                    Eliminar modelo
                  </button>
                </form>
              </FormDialog>
            </li>
          );
        })}
        {models.length === 0 && (
          <EmptyState
            title="Sin modelos aún"
            description="Agrega tu primer modelo con el botón de arriba — sin al menos uno, el configurador no tiene nada que mostrar."
          />
        )}
      </ul>
    </div>
  );
}
