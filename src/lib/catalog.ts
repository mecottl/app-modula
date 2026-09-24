import { prisma } from "@/lib/prisma";
import { buildCatalogTree, type CatalogNodeDTO } from "@/lib/catalogTree";

/** Árbol completo de un desarrollo (serializable, listo para pasar a un componente cliente). */
export async function loadCatalogTree(developmentId: string): Promise<CatalogNodeDTO[]> {
  const rows = await prisma.catalogNode.findMany({
    where: { developmentId },
    include: { modelLinks: { select: { modelId: true } } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return buildCatalogTree(rows);
}

/**
 * Ids de opciones de una cotización. Las cotizaciones anteriores al árbol
 * guardaban acabados en `finishOptionIds` y extras en `extraIds`; los ids
 * se conservaron como ids de nodo, así que ambos siguen resolviendo.
 */
export function quoteOptionIds(quote: { finishOptionIds: string[]; extraIds: string[] }): string[] {
  return [...new Set([...quote.finishOptionIds, ...quote.extraIds])];
}

export type DescribedOption = { id: string; name: string; label: string; priceDelta: string };

/** Resuelve ids a nombre, camino y precio actual; los ids que ya no existen se omiten. */
export async function describeOptions(developmentId: string, ids: string[]): Promise<DescribedOption[]> {
  if (!ids.length) return [];
  const rows = await prisma.catalogNode.findMany({
    where: { developmentId },
    select: { id: true, parentId: true, name: true, priceDelta: true },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const out: DescribedOption[] = [];
  for (const id of ids) {
    const row = byId.get(id);
    if (!row) continue;
    const names: string[] = [];
    for (let cursor: typeof row | undefined = row; cursor; cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined) {
      names.unshift(cursor.name);
    }
    out.push({ id, name: row.name, label: names.join(" › "), priceDelta: row.priceDelta.toFixed(2) });
  }
  return out;
}
