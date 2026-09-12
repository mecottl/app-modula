import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateQuotePrice, PricingError } from "@/lib/pricing";
import { resolvePublicDevelopment } from "@/lib/publicAccess";
import { notifyNewQuote } from "@/lib/notifications";
import { logAnalyticsEvent } from "@/lib/analytics";
import { sendQuoteWebhook } from "@/lib/webhooks";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rateLimit";

const bodySchema = z.object({
  modelId: z.string().min(1),
  finishLevelId: z.string().min(1).optional(),
  extraIds: z.array(z.string().min(1)).default([]),
  customerName: z.string().min(2).max(160),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(40).optional(),
  originPlan: z.enum(["A", "B"]).default("A"),
  // Honeypot: campo oculto en el formulario real (invisible para
  // personas, atractivo para bots que rellenan todo). Si viene con
  // contenido, es casi seguro un envío automatizado.
  website: z.string().max(200).optional(),
});

/**
 * Recibe una cotización enviada desde el configurador público (Plan A o
 * el widget embebido, Plan B — ambos comparten este endpoint). El total
 * SIEMPRE se recalcula en el servidor (calculateQuotePrice) — nunca se
 * confía en un total enviado por el cliente.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const preview = request.nextUrl.searchParams.get("preview") === "1";

  const ip = getClientIp(request);
  const rate = checkRateLimit(`quotes:${ip}:${slug}`, 5, 10 * 60_000);
  if (!rate.allowed) return tooManyRequests(rate.retryAfterSeconds);

  const development = await resolvePublicDevelopment(slug, preview);
  if (!development) {
    return NextResponse.json({ error: "Desarrollo no encontrado" }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Solicitud inválida", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.website) {
    // Bot detectado por el honeypot: respondemos como si hubiera salido
    // bien para no revelar la trampa, pero no creamos nada.
    return NextResponse.json({ id: "ok", total: "0" }, { status: 201 });
  }

  let breakdown;
  try {
    breakdown = await calculateQuotePrice({
      developmentId: development.id,
      modelId: parsed.data.modelId,
      finishLevelId: parsed.data.finishLevelId,
      extraIds: parsed.data.extraIds,
    });
  } catch (error) {
    if (error instanceof PricingError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 422 });
    }
    throw error;
  }

  const [model, finishLevel, extras] = await Promise.all([
    prisma.model.findUnique({ where: { id: parsed.data.modelId } }),
    parsed.data.finishLevelId
      ? prisma.finishLevel.findUnique({ where: { id: parsed.data.finishLevelId } })
      : null,
    parsed.data.extraIds.length
      ? prisma.extra.findMany({ where: { id: { in: parsed.data.extraIds } } })
      : Promise.resolve([]),
  ]);

  const quote = await prisma.quote.create({
    data: {
      developmentId: development.id,
      modelId: parsed.data.modelId,
      finishLevelId: parsed.data.finishLevelId,
      extraIds: parsed.data.extraIds,
      total: breakdown.total,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone,
      originPlan: parsed.data.originPlan,
    },
  });

  await logAnalyticsEvent({
    developmentId: development.id,
    type: "COTIZACION_ENVIADA",
    originPlan: parsed.data.originPlan,
    modelId: parsed.data.modelId,
  });

  await notifyNewQuote({
    developmentId: development.id,
    developmentName: development.name,
    modelName: model?.name ?? parsed.data.modelId,
    finishLevelName: finishLevel?.name,
    extraNames: extras.map((e) => e.name),
    breakdown,
    customerName: parsed.data.customerName,
    customerEmail: parsed.data.customerEmail,
    customerPhone: parsed.data.customerPhone,
  });

  if (development.webhookUrl) {
    await sendQuoteWebhook(development.webhookUrl, quote);
  }

  return NextResponse.json({ id: quote.id, total: breakdown.total }, { status: 201 });
}
