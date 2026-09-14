"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireDevelopmentForSession } from "@/lib/tenant";
import { uploadCatalogImage } from "@/lib/supabaseStorage";

function back(developmentId: string, error?: string) {
  const qs = error ? `?error=${encodeURIComponent(error)}` : "";
  redirect(`/dashboard/developments/${developmentId}/finishes${qs}`);
}

const finishLevelSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  priceDelta: z.coerce.number(),
});

export async function createFinishLevel(developmentId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId);
  const parsed = finishLevelSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    priceDelta: formData.get("priceDelta"),
  });
  if (!parsed.success) back(developmentId, "Revisa los campos del nivel de acabado");

  await prisma.finishLevel.create({
    data: {
      developmentId,
      name: parsed.data!.name,
      description: parsed.data!.description || null,
      priceDelta: new Prisma.Decimal(parsed.data!.priceDelta),
    },
  });
  revalidatePath(`/dashboard/developments/${developmentId}/finishes`);
  back(developmentId);
}

export async function updateFinishLevel(
  developmentId: string,
  finishLevelId: string,
  formData: FormData,
) {
  await requireDevelopmentForSession(developmentId);
  const parsed = finishLevelSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    priceDelta: formData.get("priceDelta"),
  });
  if (!parsed.success) back(developmentId, "Revisa los campos del nivel de acabado");

  await prisma.finishLevel.update({
    where: { id: finishLevelId, developmentId },
    data: {
      name: parsed.data!.name,
      description: parsed.data!.description || null,
      priceDelta: new Prisma.Decimal(parsed.data!.priceDelta),
    },
  });
  revalidatePath(`/dashboard/developments/${developmentId}/finishes`);
  back(developmentId);
}

export async function addFinishLevelImage(
  developmentId: string,
  finishLevelId: string,
  formData: FormData,
) {
  await requireDevelopmentForSession(developmentId);

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona una imagen");
  }

  const url = await uploadCatalogImage(developmentId, "finishes", finishLevelId, file);
  const finishLevel = await prisma.finishLevel.update({
    where: { id: finishLevelId, developmentId },
    data: { imageUrls: { push: url } },
  });

  revalidatePath(`/dashboard/developments/${developmentId}/finishes`);
  return finishLevel.imageUrls;
}

export async function removeFinishLevelImage(developmentId: string, finishLevelId: string, url: string) {
  await requireDevelopmentForSession(developmentId);

  const finishLevel = await prisma.finishLevel.findUniqueOrThrow({
    where: { id: finishLevelId, developmentId },
  });
  const imageUrls = finishLevel.imageUrls.filter((u) => u !== url);
  await prisma.finishLevel.update({ where: { id: finishLevelId, developmentId }, data: { imageUrls } });

  revalidatePath(`/dashboard/developments/${developmentId}/finishes`);
  return imageUrls;
}

export async function deleteFinishLevel(developmentId: string, finishLevelId: string) {
  await requireDevelopmentForSession(developmentId);
  try {
    await prisma.finishLevel.delete({ where: { id: finishLevelId, developmentId } });
  } catch {
    back(
      developmentId,
      "No se puede eliminar: el nivel de acabado tiene cotizaciones asociadas.",
    );
  }
  revalidatePath(`/dashboard/developments/${developmentId}/finishes`);
  back(developmentId);
}

const extraSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  priceDelta: z.coerce.number(),
});

function parseModelIds(formData: FormData): string[] {
  return formData.getAll("modelIds").map(String).filter(Boolean);
}

export async function createExtra(developmentId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId);
  const parsed = extraSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    priceDelta: formData.get("priceDelta"),
  });
  if (!parsed.success) back(developmentId, "Revisa los campos del extra");

  const modelIds = parseModelIds(formData);

  await prisma.extra.create({
    data: {
      developmentId,
      name: parsed.data!.name,
      description: parsed.data!.description || null,
      priceDelta: new Prisma.Decimal(parsed.data!.priceDelta),
      modelLinks: { create: modelIds.map((modelId) => ({ modelId })) },
    },
  });
  revalidatePath(`/dashboard/developments/${developmentId}/finishes`);
  back(developmentId);
}

export async function updateExtra(developmentId: string, extraId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId);
  const parsed = extraSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    priceDelta: formData.get("priceDelta"),
  });
  if (!parsed.success) back(developmentId, "Revisa los campos del extra");

  const modelIds = parseModelIds(formData);

  await prisma.$transaction([
    prisma.extra.update({
      where: { id: extraId, developmentId },
      data: {
        name: parsed.data!.name,
        description: parsed.data!.description || null,
        priceDelta: new Prisma.Decimal(parsed.data!.priceDelta),
      },
    }),
    prisma.extraModel.deleteMany({ where: { extraId } }),
    ...(modelIds.length
      ? [
          prisma.extraModel.createMany({
            data: modelIds.map((modelId) => ({ extraId, modelId })),
          }),
        ]
      : []),
  ]);

  revalidatePath(`/dashboard/developments/${developmentId}/finishes`);
  back(developmentId);
}

export async function addExtraImage(developmentId: string, extraId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId);

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona una imagen");
  }

  const url = await uploadCatalogImage(developmentId, "extras", extraId, file);
  const extra = await prisma.extra.update({
    where: { id: extraId, developmentId },
    data: { imageUrls: { push: url } },
  });

  revalidatePath(`/dashboard/developments/${developmentId}/finishes`);
  return extra.imageUrls;
}

export async function removeExtraImage(developmentId: string, extraId: string, url: string) {
  await requireDevelopmentForSession(developmentId);

  const extra = await prisma.extra.findUniqueOrThrow({ where: { id: extraId, developmentId } });
  const imageUrls = extra.imageUrls.filter((u) => u !== url);
  await prisma.extra.update({ where: { id: extraId, developmentId }, data: { imageUrls } });

  revalidatePath(`/dashboard/developments/${developmentId}/finishes`);
  return imageUrls;
}

export async function deleteExtra(developmentId: string, extraId: string) {
  await requireDevelopmentForSession(developmentId);
  await prisma.extra.delete({ where: { id: extraId, developmentId } });
  revalidatePath(`/dashboard/developments/${developmentId}/finishes`);
  back(developmentId);
}
