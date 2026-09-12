import { prisma } from "@/lib/prisma";
import type { QuoteOrigin } from "@prisma/client";

/**
 * Registra un evento propio de analítica (README.md sección 6.1 y 10).
 * No debe nunca romper el flujo del comprador si falla — se traga
 * cualquier error y solo lo deja en logs.
 */
export async function logAnalyticsEvent(params: {
  developmentId: string;
  type: "VISITA" | "CONFIGURACION_COMPLETADA" | "COTIZACION_ENVIADA";
  originPlan: QuoteOrigin;
  modelId?: string;
}) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        developmentId: params.developmentId,
        type: params.type,
        originPlan: params.originPlan,
        modelId: params.modelId,
      },
    });
  } catch (error) {
    console.error("[logAnalyticsEvent] error:", error);
  }
}
