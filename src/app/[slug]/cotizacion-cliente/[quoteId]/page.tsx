import { notFound } from "next/navigation";
import { describeOptions, quoteOptionIds } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { resolvePublicDevelopment } from "@/lib/publicAccess";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

/**
 * Página propia de una cotización ya enviada (issue #50): igual que el
 * comprobante en PDF (route.ts del mismo id), solo accesible con el
 * `id` exacto de la cotización (cuid impredecible) — no lista ni expone
 * las cotizaciones de otros compradores del mismo desarrollo.
 */
export default async function QuoteViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; quoteId: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug, quoteId } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "1";

  const development = await resolvePublicDevelopment(slug, isPreview);
  if (!development) notFound();

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, developmentId: development.id },
  });
  if (!quote) notFound();

  const [model, options] = await Promise.all([
    prisma.model.findUnique({ where: { id: quote.modelId } }),
    describeOptions(development.id, quoteOptionIds(quote)),
  ]);

  const previewQs = isPreview ? "?preview=1" : "";

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-6 py-16">
      {development.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={development.logoUrl} alt="" className="h-7 w-auto" />
      )}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tu cotización</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {development.name} · {quote.createdAt.toLocaleDateString("es-MX")}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border p-5">
        <div className="flex items-center justify-between text-sm">
          <span>{model?.name ?? "Modelo ya no disponible"}</span>
          <span>{model ? formatMoney(model.basePrice.toString(), development.currency) : "—"}</span>
        </div>
        {options.map((o) => (
          <div key={o.id} className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>{o.label}</span>
            <span className="shrink-0">+{formatMoney(o.priceDelta, development.currency)}</span>
          </div>
        ))}
        <div className="mt-2 flex items-center justify-between border-t border-border pt-3 font-medium">
          <span>Total</span>
          <span>{formatMoney(quote.total.toString(), development.currency)}</span>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>{quote.customerName}</p>
        <p>
          {quote.customerEmail}
          {quote.customerPhone ? ` · ${quote.customerPhone}` : ""}
        </p>
      </div>

      <a
        href={`/api/developments/${slug}/quotes/${quote.id}/pdf${previewQs}`}
        className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Descargar en PDF
      </a>
    </main>
  );
}
