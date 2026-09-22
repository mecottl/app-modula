"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireDevelopmentForSession } from "@/lib/tenant";

function back(developmentId: string, message?: string, kind: "error" | "warning" = "error") {
  const qs = message ? `?${kind}=${encodeURIComponent(message)}` : "";
  redirect(`/dashboard/developments/${developmentId}/promotions${qs}`);
}

const promotionSchema = z.object({
  name: z.string().min(1).max(120),
  code: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, "Solo letras, números y guiones")
    .transform((v) => v.toUpperCase()),
  type: z.enum(["PORCENTAJE", "FIJO"]),
  value: z.coerce.number().nonnegative(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  active: z.coerce.boolean().default(true),
});

export async function createPromotion(developmentId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId, "catalog.write");
  const parsed = promotionSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) back(developmentId, "Revisa los campos de la promoción");

  const { name, code, type, value, startDate, endDate, active } = parsed.data!;
  if (endDate < startDate) back(developmentId, "La fecha de fin no puede ser antes que la de inicio");

  try {
    await prisma.promotion.create({
      data: { developmentId, name, code, type, value: new Prisma.Decimal(value), startDate, endDate, active },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      back(developmentId, `Ya existe una promoción con el código "${code}"`);
    }
    throw error;
  }

  revalidatePath(`/dashboard/developments/${developmentId}/promotions`);
  back(developmentId);
}

export async function updatePromotion(
  developmentId: string,
  promotionId: string,
  formData: FormData,
) {
  await requireDevelopmentForSession(developmentId, "catalog.write");
  const parsed = promotionSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) back(developmentId, "Revisa los campos de la promoción");

  const { name, code, type, value, startDate, endDate, active } = parsed.data!;
  if (endDate < startDate) back(developmentId, "La fecha de fin no puede ser antes que la de inicio");

  try {
    await prisma.promotion.update({
      where: { id: promotionId, developmentId },
      data: { name, code, type, value: new Prisma.Decimal(value), startDate, endDate, active },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      back(developmentId, `Ya existe una promoción con el código "${code}"`);
    }
    throw error;
  }

  revalidatePath(`/dashboard/developments/${developmentId}/promotions`);
  back(developmentId);
}

export async function deletePromotion(developmentId: string, promotionId: string) {
  await requireDevelopmentForSession(developmentId, "catalog.write");
  await prisma.promotion.delete({ where: { id: promotionId, developmentId } });
  revalidatePath(`/dashboard/developments/${developmentId}/promotions`);
  back(developmentId);
}
