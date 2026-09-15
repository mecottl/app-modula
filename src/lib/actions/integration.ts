"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDevelopmentForSession } from "@/lib/tenant";
import { generateProjectToken } from "@/lib/tokens";

function back(developmentId: string, path: string, message?: string) {
  const qs = message ? `?ok=${encodeURIComponent(message)}` : "";
  redirect(`/dashboard/developments/${developmentId}/integration/${path}${qs}`);
}

const settingsSchema = z.object({
  environment: z.enum(["VISTA_PREVIA", "PRODUCCION"]),
  authorizedDomains: z.string().max(4000).optional().or(z.literal("")),
});

export async function updateIntegrationSettings(developmentId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId);

  const parsed = settingsSchema.safeParse({
    environment: formData.get("environment"),
    authorizedDomains: formData.get("authorizedDomains"),
  });
  if (!parsed.success) back(developmentId, "domains");

  const authorizedDomains = (parsed.data!.authorizedDomains ?? "")
    .split("\n")
    .map((d) => d.trim())
    .filter(Boolean);

  await prisma.integrationSettings.update({
    where: { developmentId },
    data: { environment: parsed.data!.environment, authorizedDomains },
  });

  revalidatePath(`/dashboard/developments/${developmentId}/integration/domains`);
  back(developmentId, "domains", "Guardado.");
}

/**
 * Regenera el token del proyecto, invalidando el anterior (sección 9.4).
 */
export async function regenerateIntegrationToken(developmentId: string) {
  await requireDevelopmentForSession(developmentId);
  await prisma.integrationSettings.update({
    where: { developmentId },
    data: { token: generateProjectToken() },
  });
  revalidatePath(`/dashboard/developments/${developmentId}/integration/token`);
  back(developmentId, "token", "Token regenerado. Actualiza el snippet donde esté instalado.");
}
