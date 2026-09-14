import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePublicDevelopment } from "@/lib/publicAccess";
import { generateQuotePdf } from "@/lib/quotePdf";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rateLimit";

/**
 * Comprobante en PDF de una cotización ya enviada (issue #46). Público,
 * pero solo accesible con el `id` exacto de la cotización (cuid
 * impredecible) — no expone las cotizaciones de otros compradores del
 * mismo desarrollo, igual que discutido en la issue #50. Funciona igual
 * para Plan A y Plan B, ambos comparten este endpoint.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { slug, id } = await params;
  const preview = request.nextUrl.searchParams.get("preview") === "1";

  const ip = getClientIp(request);
  const rate = checkRateLimit(`quote-pdf:${ip}:${slug}`, 20, 10 * 60_000);
  if (!rate.allowed) return tooManyRequests(rate.retryAfterSeconds);

  const development = await resolvePublicDevelopment(slug, preview);
  if (!development) {
    return NextResponse.json({ error: "Desarrollo no encontrado" }, { status: 404 });
  }

  const quote = await prisma.quote.findFirst({
    where: { id, developmentId: development.id },
  });
  if (!quote) {
    return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });
  }

  const [model, finishOptions, extras] = await Promise.all([
    prisma.model.findUnique({ where: { id: quote.modelId } }),
    quote.finishOptionIds.length
      ? prisma.finishLevel.findMany({ where: { id: { in: quote.finishOptionIds } } })
      : [],
    quote.extraIds.length ? prisma.extra.findMany({ where: { id: { in: quote.extraIds } } }) : [],
  ]);

  if (!model) {
    return NextResponse.json({ error: "El modelo de esta cotización ya no existe" }, { status: 404 });
  }

  const pdfBytes = await generateQuotePdf({
    developmentName: development.name,
    currency: development.currency,
    createdAt: quote.createdAt,
    quoteId: quote.id,
    modelName: model.name,
    modelPrice: model.basePrice.toFixed(2),
    finishOptions: finishOptions.map((f) => ({ name: f.name, price: f.priceDelta.toFixed(2) })),
    extras: extras.map((e) => ({ name: e.name, price: e.priceDelta.toFixed(2) })),
    total: quote.total.toFixed(2),
    customerName: quote.customerName,
    customerEmail: quote.customerEmail,
    customerPhone: quote.customerPhone,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cotizacion-${development.slug}-${quote.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
