import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolvePublicDevelopment } from "@/lib/publicAccess";
import { logAnalyticsEvent } from "@/lib/analytics";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rateLimit";

const bodySchema = z.object({
  type: z.enum(["VISITA", "CONFIGURACION_COMPLETADA"]),
  originPlan: z.enum(["A", "B"]),
  modelId: z.string().min(1).optional(),
});

/**
 * Registra eventos de analítica disparados desde el cliente del
 * configurador público o del widget (README.md sección 6.1). Nunca debe
 * ser un punto de fallo visible para el comprador — errores se ignoran.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const preview = request.nextUrl.searchParams.get("preview") === "1";

  const rate = checkRateLimit(`events:${getClientIp(request)}:${slug}`, 60, 60_000);
  if (!rate.allowed) return tooManyRequests(rate.retryAfterSeconds);

  const development = await resolvePublicDevelopment(slug, preview);
  if (!development) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await logAnalyticsEvent({
    developmentId: development.id,
    type: parsed.data.type,
    originPlan: parsed.data.originPlan,
    modelId: parsed.data.modelId,
  });

  return NextResponse.json({ ok: true });
}
