import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { captureException } from "@/lib/errorReporting";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rateLimit";

const bodySchema = z.object({
  message: z.string().max(2000),
  digest: z.string().max(200).optional(),
});

/**
 * Recibe errores de renderizado capturados en el cliente por
 * src/app/global-error.tsx y los pasa por el mismo punto de captura que
 * el resto del backend (README.md issue "Monitoreo y manejo de errores
 * centralizado").
 */
export async function POST(request: NextRequest) {
  const rate = checkRateLimit(`client-error:${getClientIp(request)}`, 20, 60_000);
  if (!rate.allowed) return tooManyRequests(rate.retryAfterSeconds);

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  captureException(new Error(parsed.data.message), {
    source: "client",
    digest: parsed.data.digest,
  });

  return NextResponse.json({ ok: true });
}
