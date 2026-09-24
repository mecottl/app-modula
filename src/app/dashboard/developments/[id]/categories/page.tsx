import { ImageIcon, Pencil, Plus } from "lucide-react";
import { requireDevelopmentForSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { loadCatalogTree } from "@/lib/catalog";
import type { CatalogNodeDTO } from "@/lib/catalogTree";
import {
  createCatalogNode,
  updateCatalogNode,
  deleteCatalogNode,
  addCatalogNodeImage,
  removeCatalogNodeImage,
} from "@/lib/actions/catalog";
import { MAX_CATALOG_DEPTH, MAX_CATALOG_IMAGES } from "@/lib/planLimits";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { EmptyState } from "@/components/ui/empty-state";
import { FormDialog } from "@/components/ui/form-dialog";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { ValidatedInput, ValidatedTextarea } from "@/components/ui/validated-input";
import { Select } from "@/components/ui/select";
import { MoneyInput } from "@/components/ui/money-input";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { ModelChipPicker } from "@/components/dashboard/model-chip-picker";
import { ImageGallery } from "@/components/dashboard/image-gallery";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const selectionModeOptions = [
  { value: "UNICA", label: "Una: el comprador elige como máximo una opción" },
  { value: "MULTIPLE", label: "Varias: el comprador puede elegir varias" },
];

type ModelRow = { id: string; name: string };

function countDescendants(node: CatalogNodeDTO): number {
  return node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
}

/** Campos comunes de crear/editar un nodo del árbol. */
function NodeFields({
  node,
  isRoot,
  hasChildren,
  models,
}: {
  node?: CatalogNodeDTO;
  isRoot: boolean;
  hasChildren: boolean;
  models: ModelRow[];
}) {
  return (
    <>
      <ValidatedInput label="Nombre" name="name" required maxLength={120} defaultValue={node?.name} autoFocus={!node} />
      {!isRoot && (
        <ValidatedTextarea
          label="Descripción (opcional)"
          name="description"
          maxLength={2000}
          rows={2}
          defaultValue={node?.description ?? ""}
        />
      )}
      {!isRoot && !hasChildren && (
        <MoneyInput label="Precio extra" name="priceDelta" required defaultValue={node ? String(node.priceDelta) : 0} />
      )}
      {(isRoot || hasChildren) && (
        <Select
          label="¿Cómo elige el comprador dentro de este nivel?"
          name="selectionMode"
          defaultValue={node?.selectionMode ?? "UNICA"}
          options={selectionModeOptions}
        />
      )}
      {models.length > 0 && (
        <div className="group/scope flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="restrictToModels" defaultChecked={node?.restrictToModels ?? false} />
            Solo para algunos modelos
            <InfoTooltip text="Si lo activas, este nivel y todo lo que tiene dentro solo se ofrece a los modelos que elijas. Si no, aplica a todos." />
          </label>
          <div className="hidden group-has-[input[name=restrictToModels]:checked]/scope:block">
            <ModelChipPicker models={models} selectedIds={new Set(node?.modelIds ?? [])} />
          </div>
        </div>
      )}
    </>
  );
}

function NodeRow({
  node,
  depth,
  developmentId,
  models,
  currency,
}: {
  node: CatalogNodeDTO;
  depth: number;
  developmentId: string;
  models: ModelRow[];
  currency: string;
}) {
  const isRoot = depth === 1;
  const hasChildren = node.children.length > 0;
  const isOption = !isRoot && !hasChildren;
  const descendants = countDescendants(node);
  const kind = isRoot ? "Categoría" : hasChildren ? "Subcategoría" : "Opción";

  return (
    <li>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
        <div className="flex min-w-0 items-center gap-3">
          {isOption && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
              {node.imageUrls[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={node.imageUrls[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{node.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {kind}
              {isOption && ` · ${node.priceDelta === 0 ? "Sin costo extra" : `+${formatMoney(node.priceDelta.toString(), currency)}`}`}
              {hasChildren && ` · ${node.selectionMode === "UNICA" ? "Elige una" : "Elige varias"}`}
              {node.restrictToModels &&
                ` · Solo ${node.modelIds.length} modelo${node.modelIds.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {depth < MAX_CATALOG_DEPTH && (
            <FormDialog
              title={`Agregar dentro de "${node.name}"`}
              description={
                isOption
                  ? `Al agregar algo dentro, "${node.name}" deja de ser una opción: su precio ya no se cobra y el comprador elige entre lo que pongas dentro.`
                  : "Puede ser una opción con precio o una subcategoría (después le agregas opciones)."
              }
              trigger={
                <Button size="sm" variant="outline" className="gap-1.5 rounded-full">
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              }
            >
              <form
                action={createCatalogNode.bind(null, developmentId, node.id)}
                className="flex flex-col gap-4"
              >
                <NodeFields isRoot={false} hasChildren={false} models={models} />
                <SubmitButton className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                  Crear
                </SubmitButton>
              </form>
            </FormDialog>
          )}
          <FormDialog
            title={`Editar ${kind.toLowerCase()}`}
            trigger={
              <button
                type="button"
                aria-label={`Editar ${node.name}`}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-4 w-4" />
              </button>
            }
          >
            {isOption && (
              <ImageGallery
                images={node.imageUrls}
                addAction={addCatalogNodeImage.bind(null, developmentId, node.id)}
                removeAction={removeCatalogNodeImage.bind(null, developmentId, node.id)}
                max={MAX_CATALOG_IMAGES}
              />
            )}
            <form
              action={updateCatalogNode.bind(null, developmentId, node.id)}
              className="mt-4 flex flex-col gap-4"
            >
              <NodeFields node={node} isRoot={isRoot} hasChildren={hasChildren} models={models} />
              <SubmitButton className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                Guardar
              </SubmitButton>
            </form>
            <form
              action={deleteCatalogNode.bind(null, developmentId, node.id)}
              className="mt-4 border-t border-border pt-4"
            >
              <SubmitButton className="text-sm text-red-400 underline underline-offset-4">
                {descendants > 0
                  ? `Eliminar (incluye ${descendants} elemento${descendants === 1 ? "" : "s"} dentro)`
                  : "Eliminar"}
              </SubmitButton>
            </form>
          </FormDialog>
        </div>
      </div>

      {hasChildren && (
        <ul className="ml-4 mt-2 flex flex-col gap-2 border-l border-border pl-3">
          {node.children.map((child) => (
            <NodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              developmentId={developmentId}
              models={models}
              currency={currency}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default async function CategoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const development = await requireDevelopmentForSession(id);

  const [tree, models] = await Promise.all([
    loadCatalogTree(id),
    prisma.model.findMany({ where: { developmentId: id }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <ToastFromParams error={error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 font-medium">
          Categorías
          <InfoTooltip
            text={`Organiza lo que ofreces en un árbol de hasta ${MAX_CATALOG_DEPTH} niveles: categorías, subcategorías y opciones (ej. Acabados > Puertas > Tipo de puerta > Tzalam). Solo las opciones finales tienen precio y son las que elige el comprador; tú decides cuántos niveles usar.`}
          />
        </h2>
        <FormDialog
          title="Agregar categoría"
          description="Una categoría es el primer nivel del árbol (ej. Acabados interiores, Extras). Después le agregas opciones o subcategorías."
          trigger={
            <Button size="sm" className="gap-2 rounded-full">
              <Plus className="h-4 w-4" />
              Nueva categoría
            </Button>
          }
        >
          <form action={createCatalogNode.bind(null, id, null)} className="flex flex-col gap-4">
            <NodeFields isRoot hasChildren={false} models={models} />
            <SubmitButton className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              Crear
            </SubmitButton>
          </form>
        </FormDialog>
      </div>

      {tree.length === 0 ? (
        <ul>
          <EmptyState
            title="Sin categorías aún"
            description="Son opcionales: si no agregas ninguna, el comprador solo ve el precio base. Crea una para empezar (ej. Acabados interiores)."
          />
        </ul>
      ) : (
        <ul className="flex flex-col gap-3">
          {tree.map((root) => (
            <NodeRow
              key={root.id}
              node={root}
              depth={1}
              developmentId={id}
              models={models}
              currency={development.currency}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
