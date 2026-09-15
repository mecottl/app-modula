"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireDevelopmentForSession } from "@/lib/tenant";
import { uploadCatalogImage } from "@/lib/supabaseStorage";
import { MAX_CATALOG_IMAGES } from "@/lib/planLimits";

const modelSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  areaM2: z.coerce.number().positive(),
  bedrooms: z.coerce.number().int().min(0).max(50),
  basePrice: z.coerce.number().nonnegative(),
  active: z.coerce.boolean().default(true),
});

function backToModels(developmentId: string, error?: string) {
  const qs = error ? `?error=${encodeURIComponent(error)}` : "";
  redirect(`/dashboard/developments/${developmentId}/models${qs}`);
}

export async function createModel(developmentId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId);

  const parsed = modelSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    areaM2: formData.get("areaM2"),
    bedrooms: formData.get("bedrooms"),
    basePrice: formData.get("basePrice"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) backToModels(developmentId, "Revisa los campos del modelo");

  await prisma.model.create({
    data: {
      developmentId,
      name: parsed.data!.name,
      description: parsed.data!.description || null,
      areaM2: new Prisma.Decimal(parsed.data!.areaM2),
      bedrooms: parsed.data!.bedrooms,
      basePrice: new Prisma.Decimal(parsed.data!.basePrice),
      active: parsed.data!.active,
    },
  });

  revalidatePath(`/dashboard/developments/${developmentId}/models`);
  backToModels(developmentId);
}

export async function updateModel(developmentId: string, modelId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId);

  const parsed = modelSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    areaM2: formData.get("areaM2"),
    bedrooms: formData.get("bedrooms"),
    basePrice: formData.get("basePrice"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) backToModels(developmentId, "Revisa los campos del modelo");

  await prisma.model.update({
    where: { id: modelId, developmentId },
    data: {
      name: parsed.data!.name,
      description: parsed.data!.description || null,
      areaM2: new Prisma.Decimal(parsed.data!.areaM2),
      bedrooms: parsed.data!.bedrooms,
      basePrice: new Prisma.Decimal(parsed.data!.basePrice),
      active: parsed.data!.active,
    },
  });

  revalidatePath(`/dashboard/developments/${developmentId}/models`);
  backToModels(developmentId);
}

/**
 * Imágenes del modelo (issue #47) — se suben a Supabase Storage y se
 * agregan al arreglo `imageUrls`, en vez de reemplazar como el logo del
 * desarrollo (un modelo puede mostrar varias fotos/renders).
 */
export async function addModelImage(developmentId: string, modelId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId);

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona una imagen");
  }

  const existing = await prisma.model.findUniqueOrThrow({ where: { id: modelId, developmentId } });
  if (existing.imageUrls.length >= MAX_CATALOG_IMAGES) {
    throw new Error(`Máximo ${MAX_CATALOG_IMAGES} imágenes por modelo`);
  }

  const url = await uploadCatalogImage(developmentId, "models", modelId, file);
  const model = await prisma.model.update({
    where: { id: modelId, developmentId },
    data: { imageUrls: { push: url } },
  });

  revalidatePath(`/dashboard/developments/${developmentId}/models`);
  return model.imageUrls;
}

export async function removeModelImage(developmentId: string, modelId: string, url: string) {
  await requireDevelopmentForSession(developmentId);

  const model = await prisma.model.findUniqueOrThrow({ where: { id: modelId, developmentId } });
  const imageUrls = model.imageUrls.filter((u) => u !== url);
  await prisma.model.update({ where: { id: modelId, developmentId }, data: { imageUrls } });

  revalidatePath(`/dashboard/developments/${developmentId}/models`);
  return imageUrls;
}

export async function deleteModel(developmentId: string, modelId: string) {
  await requireDevelopmentForSession(developmentId);

  try {
    await prisma.model.delete({ where: { id: modelId, developmentId } });
  } catch {
    backToModels(
      developmentId,
      "No se puede eliminar: el modelo tiene cotizaciones asociadas. Desactívalo en su lugar.",
    );
  }

  revalidatePath(`/dashboard/developments/${developmentId}/models`);
  backToModels(developmentId);
}
