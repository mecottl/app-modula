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
  type: z.enum(["PORCENTAJE", "FIJO"]),
  value: z.coerce.number().nonnegative(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  active: z.coerce.boolean().default(true),
});

async function warnIfOverlapping(
  developmentId: string,
  startDate: Date,
  endDate: Date,
  excludeId?: string,
) {
  const overlapping = await prisma.promotion.findFirst({
    where: {
      developmentId,
      active: true,
      id: excludeId ? { not: excludeId } : undefined,
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });
  return overlapping
    ? `Ojo: esta promoción se traslapa con "${overlapping.name}" en fechas. El motor de precio aplicará ambas.`
    : undefined;
}

export async function createPromotion(developmentId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId);
  const parsed = promotionSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    value: formData.get("value"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) back(developmentId, "Revisa los campos de la promoción");

  const { name, type, value, startDate, endDate, active } = parsed.data!;
  if (endDate < startDate) back(developmentId, "La fecha de fin no puede ser antes que la de inicio");

  await prisma.promotion.create({
    data: { developmentId, name, type, value: new Prisma.Decimal(value), startDate, endDate, active },
  });

  const warning = active ? await warnIfOverlapping(developmentId, startDate, endDate) : undefined;
  revalidatePath(`/dashboard/developments/${developmentId}/promotions`);
  back(developmentId, warning, "warning");
}

export async function updatePromotion(
  developmentId: string,
  promotionId: string,
  formData: FormData,
) {
  await requireDevelopmentForSession(developmentId);
  const parsed = promotionSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    value: formData.get("value"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) back(developmentId, "Revisa los campos de la promoción");

  const { name, type, value, startDate, endDate, active } = parsed.data!;
  if (endDate < startDate) back(developmentId, "La fecha de fin no puede ser antes que la de inicio");

  await prisma.promotion.update({
    where: { id: promotionId, developmentId },
    data: { name, type, value: new Prisma.Decimal(value), startDate, endDate, active },
  });

  const warning = active
    ? await warnIfOverlapping(developmentId, startDate, endDate, promotionId)
    : undefined;
  revalidatePath(`/dashboard/developments/${developmentId}/promotions`);
  back(developmentId, warning, "warning");
}

export async function deletePromotion(developmentId: string, promotionId: string) {
  await requireDevelopmentForSession(developmentId);
  await prisma.promotion.delete({ where: { id: promotionId, developmentId } });
  revalidatePath(`/dashboard/developments/${developmentId}/promotions`);
  back(developmentId);
}
