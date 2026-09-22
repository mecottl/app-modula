"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDevelopmentForSession } from "@/lib/tenant";

const statusSchema = z.enum(["NUEVA", "CONTACTADA", "CERRADA"]);

export async function updateQuoteStatus(developmentId: string, quoteId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId, "quotes.manage");
  const parsed = statusSchema.safeParse(formData.get("status"));
  if (parsed.success) {
    await prisma.quote.update({
      where: { id: quoteId, developmentId },
      data: { status: parsed.data },
    });
  }
  revalidatePath(`/dashboard/developments/${developmentId}/quotes`);
  redirect(`/dashboard/developments/${developmentId}/quotes`);
}

/**
 * Elimina los datos personales de un lead a solicitud del titular
 * (README.md sección 9.5 / LFPDPPP). Se elimina la cotización completa:
 * conserva de otro modo los datos personales indefinidamente sin base
 * legal para hacerlo.
 */
export async function deleteQuoteData(developmentId: string, quoteId: string) {
  await requireDevelopmentForSession(developmentId, "quotes.manage");
  await prisma.quote.delete({ where: { id: quoteId, developmentId } });
  revalidatePath(`/dashboard/developments/${developmentId}/quotes`);
  redirect(`/dashboard/developments/${developmentId}/quotes`);
}
