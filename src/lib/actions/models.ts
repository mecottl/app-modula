"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireDevelopmentForSession } from "@/lib/tenant";

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
