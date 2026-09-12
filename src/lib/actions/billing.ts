"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSessionAccount } from "@/lib/tenant";

const planSchema = z.enum(["BASICO", "PROFESIONAL"]);

/**
 * Cambia el plan contratado de la cuenta. No hay integración con un
 * procesador de pagos real todavía (ver README.md sección 10) — este es
 * el control manual/interno mientras tanto. Solo un administrador puede
 * cambiarlo.
 */
export async function changeAccountPlan(formData: FormData) {
  const { accountId, role } = await requireSessionAccount();
  if (role !== "ADMINISTRADOR") {
    redirect(`/dashboard/billing?error=${encodeURIComponent("Solo un administrador puede cambiar el plan")}`);
  }

  const parsed = planSchema.safeParse(formData.get("plan"));
  if (!parsed.success) {
    redirect(`/dashboard/billing?error=${encodeURIComponent("Plan inválido")}`);
  }

  await prisma.account.update({ where: { id: accountId }, data: { plan: parsed.data } });
  revalidatePath("/dashboard/billing");
  redirect(`/dashboard/billing?ok=${encodeURIComponent("Plan actualizado.")}`);
}
