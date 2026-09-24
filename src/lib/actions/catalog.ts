"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireDevelopmentForSession } from "@/lib/tenant";
import { uploadCatalogImage } from "@/lib/supabaseStorage";
import { MAX_CATALOG_DEPTH, MAX_CATALOG_IMAGES } from "@/lib/planLimits";

function back(developmentId: string, error?: string) {
  const qs = error ? `?error=${encodeURIComponent(error)}` : "";
  redirect(`/dashboard/developments/${developmentId}/categories${qs}`);
}

const nodeSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  priceDelta: z.coerce.number().default(0),
  selectionMode: z.enum(["UNICA", "MULTIPLE"]).default("UNICA"),
});

function parseNode(formData: FormData) {
  return nodeSchema.safeParse({
    name: formData.get("name"),
    // Las categorías raíz no envían descripción ni precio (el formulario no los muestra).
    description: formData.get("description") ?? undefined,
    priceDelta: formData.get("priceDelta") ?? 0,
    selectionMode: formData.get("selectionMode") ?? "UNICA",
  });
}

/** Modelos elegidos en el formulario, solo los que de verdad son de este desarrollo. */
async function parseModelScope(developmentId: string, formData: FormData) {
  const restrictToModels = formData.get("restrictToModels") === "on";
  if (!restrictToModels) return { restrictToModels: false, modelIds: [] as string[] };
  const requested = formData.getAll("modelIds").map(String).filter(Boolean);
  const valid = await prisma.model.findMany({
    where: { id: { in: requested }, developmentId },
    select: { id: true },
  });
  return { restrictToModels: true, modelIds: valid.map((m) => m.id) };
}

/** id -> parentId de todo el árbol del desarrollo (para profundidad y pertenencia). */
async function loadParentMap(developmentId: string) {
  const rows = await prisma.catalogNode.findMany({
    where: { developmentId },
    select: { id: true, parentId: true },
  });
  return new Map(rows.map((r) => [r.id, r.parentId]));
}

function depthOf(parents: Map<string, string | null>, id: string) {
  let depth = 0;
  for (let cursor: string | null | undefined = id; cursor; cursor = parents.get(cursor)) depth++;
  return depth;
}

/** Crea una categoría raíz (`parentId` null) o una subcategoría/opción bajo `parentId`. */
export async function createCatalogNode(developmentId: string, parentId: string | null, formData: FormData) {
  await requireDevelopmentForSession(developmentId, "catalog.write");
  const parsed = parseNode(formData);
  if (!parsed.success) back(developmentId, "Revisa los campos");

  const parents = await loadParentMap(developmentId);
  if (parentId) {
    if (!parents.has(parentId)) back(developmentId, "La categoría padre no existe");
    if (depthOf(parents, parentId) >= MAX_CATALOG_DEPTH) {
      back(developmentId, `El árbol admite hasta ${MAX_CATALOG_DEPTH} niveles`);
    }
  }

  const scope = await parseModelScope(developmentId, formData);
  if (scope.restrictToModels && scope.modelIds.length === 0) {
    back(developmentId, "Elige al menos un modelo o quita la restricción por modelo");
  }

  const lastSibling = await prisma.catalogNode.aggregate({
    where: { developmentId, parentId },
    _max: { order: true },
  });
  const isRoot = parentId === null;

  await prisma.catalogNode.create({
    data: {
      developmentId,
      parentId,
      name: parsed.data!.name,
      description: parsed.data!.description || null,
      // La raíz es solo una sección: nunca cobra por sí misma.
      priceDelta: new Prisma.Decimal(isRoot ? 0 : parsed.data!.priceDelta),
      selectionMode: parsed.data!.selectionMode,
      order: (lastSibling._max.order ?? -1) + 1,
      restrictToModels: scope.restrictToModels,
      modelLinks: { create: scope.modelIds.map((modelId) => ({ modelId })) },
    },
  });
  revalidatePath(`/dashboard/developments/${developmentId}/categories`);
  back(developmentId);
}

export async function updateCatalogNode(developmentId: string, nodeId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId, "catalog.write");
  const parsed = parseNode(formData);
  if (!parsed.success) back(developmentId, "Revisa los campos");

  const node = await prisma.catalogNode.findFirst({ where: { id: nodeId, developmentId } });
  if (!node) back(developmentId, "Nodo no encontrado");

  const scope = await parseModelScope(developmentId, formData);
  if (scope.restrictToModels && scope.modelIds.length === 0) {
    back(developmentId, "Elige al menos un modelo o quita la restricción por modelo");
  }

  await prisma.$transaction([
    prisma.catalogNode.update({
      where: { id: nodeId },
      data: {
        name: parsed.data!.name,
        description: parsed.data!.description || null,
        priceDelta: new Prisma.Decimal(node!.parentId === null ? 0 : parsed.data!.priceDelta),
        selectionMode: parsed.data!.selectionMode,
        restrictToModels: scope.restrictToModels,
      },
    }),
    prisma.catalogNodeModel.deleteMany({ where: { nodeId } }),
    ...(scope.modelIds.length
      ? [prisma.catalogNodeModel.createMany({ data: scope.modelIds.map((modelId) => ({ nodeId, modelId })) })]
      : []),
  ]);
  revalidatePath(`/dashboard/developments/${developmentId}/categories`);
  back(developmentId);
}

/**
 * Elimina el nodo y todo lo que cuelga de él (cascada). Las cotizaciones
 * guardan ids sin relación referencial, así que no bloquean el borrado:
 * la opción solo deja de aparecer en las cotizaciones nuevas.
 */
export async function deleteCatalogNode(developmentId: string, nodeId: string) {
  await requireDevelopmentForSession(developmentId, "catalog.write");
  await prisma.catalogNode.deleteMany({ where: { id: nodeId, developmentId } });
  revalidatePath(`/dashboard/developments/${developmentId}/categories`);
  back(developmentId);
}

export async function addCatalogNodeImage(developmentId: string, nodeId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId, "catalog.write");

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona una imagen");
  }

  const existing = await prisma.catalogNode.findFirstOrThrow({ where: { id: nodeId, developmentId } });
  if (existing.imageUrls.length >= MAX_CATALOG_IMAGES) {
    throw new Error(`Máximo ${MAX_CATALOG_IMAGES} imágenes por opción`);
  }

  const url = await uploadCatalogImage(developmentId, "nodes", nodeId, file);
  const node = await prisma.catalogNode.update({
    where: { id: nodeId },
    data: { imageUrls: { push: url } },
  });

  revalidatePath(`/dashboard/developments/${developmentId}/categories`);
  return node.imageUrls;
}

export async function removeCatalogNodeImage(developmentId: string, nodeId: string, url: string) {
  await requireDevelopmentForSession(developmentId, "catalog.write");

  const node = await prisma.catalogNode.findFirstOrThrow({ where: { id: nodeId, developmentId } });
  const imageUrls = node.imageUrls.filter((u) => u !== url);
  await prisma.catalogNode.update({ where: { id: nodeId }, data: { imageUrls } });

  revalidatePath(`/dashboard/developments/${developmentId}/categories`);
  return imageUrls;
}
