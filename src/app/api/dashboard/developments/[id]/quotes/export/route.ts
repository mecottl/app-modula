import { NextRequest, NextResponse } from "next/server";
import { QuoteStatus } from "@prisma/client";
import { describeOptions, quoteOptionIds } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { requireDevelopmentForSession, TenantAccessError } from "@/lib/tenant";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

const COLUMNS = [
  "fecha",
  "modelo",
  "opciones",
  "total",
  "nombre_cliente",
  "correo",
  "telefono",
  "estado",
  "plan_origen",
] as const;

/**
 * Exporta las cotizaciones de un desarrollo a CSV (README.md sección 6.4).
 * Respeta el filtro de estado activo en la bandeja del dashboard.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await requireDevelopmentForSession(id);
  } catch (error) {
    if (error instanceof TenantAccessError) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    throw error;
  }

  const statusParam = request.nextUrl.searchParams.get("status");
  const status =
    statusParam && statusParam in QuoteStatus ? (statusParam as QuoteStatus) : undefined;

  const quotes = await prisma.quote.findMany({
    where: { developmentId: id, ...(status ? { status } : {}) },
    include: { model: true },
    orderBy: { createdAt: "desc" },
  });

  const described = await describeOptions(id, [...new Set(quotes.flatMap(quoteOptionIds))]);
  const labelById = new Map(described.map((o) => [o.id, o.label]));

  const rows = quotes.map((q) =>
    [
      q.createdAt.toISOString(),
      q.model.name,
      quoteOptionIds(q)
        .flatMap((oid) => labelById.get(oid) ?? [])
        .join("; "),
      q.total.toString(),
      q.customerName,
      q.customerEmail,
      q.customerPhone ?? "",
      q.status,
      q.originPlan,
    ]
      .map((v) => csvEscape(String(v)))
      .join(","),
  );

  const csv = [COLUMNS.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cotizaciones-${id}.csv"`,
    },
  });
}
