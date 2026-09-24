import { QuoteStatus } from "@prisma/client";
import { requireDevelopmentForSession } from "@/lib/tenant";
import { describeOptions, quoteOptionIds } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { updateQuoteStatus, deleteQuoteData } from "@/lib/actions/quotes";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const statusLabels: Record<QuoteStatus, string> = {
  NUEVA: "Nueva",
  CONTACTADA: "Contactada",
  CERRADA: "Cerrada",
};

function isQuoteStatus(value: string): value is QuoteStatus {
  return value in statusLabels;
}

export default async function QuotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const { status } = await searchParams;
  const development = await requireDevelopmentForSession(id);

  const validStatus = status && isQuoteStatus(status) ? status : undefined;

  const quotes = await prisma.quote.findMany({
    where: { developmentId: id, ...(validStatus ? { status: validStatus } : {}) },
    include: { model: true },
    orderBy: { createdAt: "desc" },
  });
  const described = await describeOptions(id, [...new Set(quotes.flatMap(quoteOptionIds))]);
  const labelById = new Map(described.map((o) => [o.id, o.label]));

  const optionLabels = (q: { finishOptionIds: string[]; extraIds: string[] }) =>
    quoteOptionIds(q).flatMap((oid) => labelById.get(oid) ?? []);

  const exportHref = `/api/dashboard/developments/${id}/quotes/export${
    validStatus ? `?status=${validStatus}` : ""
  }`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">Cotizaciones recibidas</h2>
        <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Filtrar por estado">
          <a href={`/dashboard/developments/${id}/quotes`} className="underline">
            Todas
          </a>
          {Object.entries(statusLabels).map(([value, label]) => (
            <a
              key={value}
              href={`/dashboard/developments/${id}/quotes?status=${value}`}
              className="underline"
            >
              {label}
            </a>
          ))}
          <a href={exportHref} className="rounded border px-2 py-1">
            Exportar CSV
          </a>
        </nav>
      </div>

      <ul className="flex flex-col gap-3">
        {quotes.map((quote) => (
          <li key={quote.id} className="rounded border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {quote.model.name} · {formatMoney(quote.total.toString(), development.currency)}
                </p>
                {optionLabels(quote).length > 0 && (
                  <p className="text-sm text-muted-foreground">{optionLabels(quote).join("; ")}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {quote.customerName} · {quote.customerEmail}
                  {quote.customerPhone ? ` · ${quote.customerPhone}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {quote.createdAt.toLocaleString("es-MX")} · Plan {quote.originPlan}
                </p>
              </div>
              <form action={updateQuoteStatus.bind(null, id, quote.id)} className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`status-${quote.id}`}>
                  Estado de la cotización
                </label>
                <Select
                  id={`status-${quote.id}`}
                  name="status"
                  defaultValue={quote.status}
                  className="py-1"
                  options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
                />
                <SubmitButton className="rounded border px-2 py-1 text-sm">Actualizar</SubmitButton>
              </form>
            </div>
            <form action={deleteQuoteData.bind(null, id, quote.id)} className="mt-2">
              <SubmitButton className="text-xs text-red-400 underline">
                Eliminar datos del lead (solicitud del titular)
              </SubmitButton>
            </form>
          </li>
        ))}
        {quotes.length === 0 && (
          <EmptyState
            title="Sin cotizaciones aún"
            description="Aparecerán aquí en cuanto compartas tu página o widget y alguien envíe una cotización."
          />
        )}
      </ul>
    </div>
  );
}
