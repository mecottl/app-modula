import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateQuotePrice, PricingError } from "@/lib/pricing";
import { resolvePublicDevelopment } from "@/lib/publicAccess";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rateLimit";

const bodySchema = z.object({
  modelId: z.string().min(1),
  finishOptionIds: z.array(z.string().min(1)).default([]),
  extraIds: z.array(z.string().min(1)).default([]),
  promoCode: z.string().min(1).max(40).optional(),
});

/**
 * Motor de cálculo de precio (README.md sección 5 y issue "API del motor
 * de cálculo de precio"). Consumido tanto por el Plan A (página hospedada)
 * como por el Plan B (widget) — el `slug` en la ruta acota toda la
 * consulta a un único desarrollo, nunca se confía en un `developmentId`
 * enviado directamente por el cliente (sección 9.1).
 *
 * Solo responde si el desarrollo está publicado, salvo en modo vista
 * previa (`?preview=1`) para un usuario autenticado del dashboard de esa
 * misma cuenta (issue "Modo vista previa por defecto").
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const preview = request.nextUrl.searchParams.get("preview") === "1";

  const rate = checkRateLimit(`pricing:${getClientIp(request)}:${slug}`, 30, 60_000);
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

  try {
    const breakdown = await calculateQuotePrice({
      developmentId: development.id,
      modelId: parsed.data.modelId,
      finishOptionIds: parsed.data.finishOptionIds,
      extraIds: parsed.data.extraIds,
      promoCode: parsed.data.promoCode,
    });
    return NextResponse.json(breakdown);
  } catch (error) {
    if (error instanceof PricingError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 422 });
    }
    throw error;
  }
}
