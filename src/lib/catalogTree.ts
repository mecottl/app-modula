/**
 * Utilidades puras (sin Prisma, usables también en componentes cliente)
 * para el árbol de catálogo de un desarrollo. Ver el modelo CatalogNode
 * en prisma/schema.prisma para las reglas del árbol.
 */
export type SelectionMode = "UNICA" | "MULTIPLE";

export type CatalogNodeDTO = {
  id: string;
  name: string;
  description: string | null;
  priceDelta: number;
  imageUrls: string[];
  selectionMode: SelectionMode;
  restrictToModels: boolean;
  modelIds: string[];
  children: CatalogNodeDTO[];
};

export type CatalogRow = {
  id: string;
  parentId: string | null;
  name: string;
  description: string | null;
  priceDelta: { toString(): string };
  imageUrls: string[];
  selectionMode: SelectionMode;
  order: number;
  restrictToModels: boolean;
  modelLinks: { modelId: string }[];
};

/** Arma el árbol desde las filas planas; cada nivel queda ordenado por `order`. */
export function buildCatalogTree(rows: CatalogRow[]): CatalogNodeDTO[] {
  const sorted = [...rows].sort((a, b) => a.order - b.order);
  const byId = new Map<string, CatalogNodeDTO>();
  for (const row of sorted) {
    byId.set(row.id, {
      id: row.id,
      name: row.name,
      description: row.description,
      priceDelta: Number(row.priceDelta.toString()),
      imageUrls: row.imageUrls,
      selectionMode: row.selectionMode,
      restrictToModels: row.restrictToModels,
      modelIds: row.modelLinks.map((l) => l.modelId),
      children: [],
    });
  }
  const roots: CatalogNodeDTO[] = [];
  for (const row of sorted) {
    const node = byId.get(row.id)!;
    const parent = row.parentId ? byId.get(row.parentId) : null;
    if (parent) parent.children.push(node);
    else if (!row.parentId) roots.push(node);
  }
  return roots;
}

/** ¿Se ofrece este nodo al modelo? (la restricción de un padre cubre a todos sus descendientes) */
export function isVisibleForModel(node: CatalogNodeDTO, modelId: string): boolean {
  return !node.restrictToModels || node.modelIds.includes(modelId);
}

export function pruneForModel(nodes: CatalogNodeDTO[], modelId: string): CatalogNodeDTO[] {
  return nodes
    .filter((n) => isVisibleForModel(n, modelId))
    .map((n) => ({ ...n, children: pruneForModel(n.children, modelId) }));
}

/** Una opción elegible es un nodo no raíz sin hijos; las raíces son siempre secciones. */
export function isSelectableOption(node: CatalogNodeDTO, isRoot: boolean): boolean {
  return !isRoot && node.children.length === 0;
}

/** Camino de raíz a nodo, o null si no existe. */
export function findPath(nodes: CatalogNodeDTO[], id: string): CatalogNodeDTO[] | null {
  for (const node of nodes) {
    if (node.id === id) return [node];
    const sub = findPath(node.children, id);
    if (sub) return [node, ...sub];
  }
  return null;
}

/** Ids de las opciones elegibles (hojas no raíz) de un conjunto de raíces. */
export function collectOptionIds(roots: CatalogNodeDTO[]): string[] {
  const ids: string[] = [];
  const walk = (node: CatalogNodeDTO) => {
    if (node.children.length === 0) ids.push(node.id);
    else node.children.forEach(walk);
  };
  roots.forEach((root) => root.children.forEach(walk));
  return ids;
}

/** Etiqueta legible con el camino, ej. "Acabados interiores › Puertas › Tzalam". */
export function pathLabel(path: CatalogNodeDTO[]): string {
  return path.map((n) => n.name).join(" › ");
}
