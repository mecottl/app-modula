"use client";

/**
 * Reemplaza la lista vertical plana de checkboxes para elegir a qué
 * modelos aplica un extra (issue "mejorar diseño de extras al momento
 * de agregarle a que modelo ponerlo") por chips seleccionables — sigue
 * siendo checkboxes nativos (funciona sin JS, mismo `name="modelIds"`
 * que ya leen las server actions), solo cambia cómo se ven.
 */
export function ModelChipPicker({
  models,
  selectedIds,
}: {
  models: { id: string; name: string }[];
  selectedIds: Set<string>;
}) {
  if (models.length === 0) {
    return <p className="text-sm text-muted-foreground">Crea primero un modelo en Catálogo.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span>Aplica a estos modelos</span>
      <div className="flex flex-wrap gap-2">
        {models.map((model) => (
          <label key={model.id} className="group cursor-pointer">
            <input
              type="checkbox"
              name="modelIds"
              value={model.id}
              defaultChecked={selectedIds.has(model.id)}
              className="peer sr-only"
            />
            <span className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
              {model.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
