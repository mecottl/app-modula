import type { Quote } from "@prisma/client";

/**
 * Envía la cotización a un webhook externo configurado por la
 * desarrolladora (README.md sección 6.4), con un reintento simple. Nunca
 * debe bloquear ni romper la creación de la cotización si falla.
 */
export async function sendQuoteWebhook(webhookUrl: string, quote: Quote) {
  const payload = {
    id: quote.id,
    developmentId: quote.developmentId,
    modelId: quote.modelId,
    finishLevelId: quote.finishLevelId,
    extraIds: quote.extraIds,
    total: quote.total.toString(),
    customerName: quote.customerName,
    customerEmail: quote.customerEmail,
    customerPhone: quote.customerPhone,
    status: quote.status,
    originPlan: quote.originPlan,
    createdAt: quote.createdAt.toISOString(),
  };

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return;
      console.error(`[sendQuoteWebhook] intento ${attempt} respondió ${res.status}`);
    } catch (error) {
      console.error(`[sendQuoteWebhook] intento ${attempt} falló:`, error);
    }
  }
}
