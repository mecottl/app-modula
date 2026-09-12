import { requireDevelopmentForSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value.toLocaleString("es-MX")}</p>
    </div>
  );
}

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireDevelopmentForSession(id);

  const [visits, configsCompleted, quotesSubmitted, byModel] = await Promise.all([
    prisma.analyticsEvent.count({ where: { developmentId: id, type: "VISITA" } }),
    prisma.analyticsEvent.count({ where: { developmentId: id, type: "CONFIGURACION_COMPLETADA" } }),
    prisma.quote.count({ where: { developmentId: id } }),
    prisma.quote.groupBy({
      by: ["modelId"],
      where: { developmentId: id },
      _count: { modelId: true },
      orderBy: { _count: { modelId: "desc" } },
      take: 10,
    }),
  ]);

  const models = await prisma.model.findMany({
    where: { id: { in: byModel.map((b) => b.modelId) } },
  });
  const modelNameById = new Map(models.map((m) => [m.id, m.name]));

  const visitToQuoteRate = visits > 0 ? ((quotesSubmitted / visits) * 100).toFixed(1) : "0.0";

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-medium">Analítica</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Visitas al configurador" value={visits} />
        <StatCard label="Configuraciones completadas" value={configsCompleted} />
        <StatCard label="Cotizaciones enviadas" value={quotesSubmitted} />
      </div>

      <p className="text-sm text-muted-foreground">
        Tasa de conversión (visita → cotización): <strong>{visitToQuoteRate}%</strong>
      </p>

      <section>
        <h3 className="font-medium">Modelos más cotizados</h3>
        <ol className="mt-2 flex flex-col gap-2">
          {byModel.map((row) => (
            <li key={row.modelId} className="flex items-center justify-between rounded border p-3 text-sm">
              <span>{modelNameById.get(row.modelId) ?? row.modelId}</span>
              <span className="text-muted-foreground">{row._count.modelId} cotizaciones</span>
            </li>
          ))}
          {byModel.length === 0 && (
            <li className="text-sm text-muted-foreground">Aún no hay cotizaciones para rankear modelos.</li>
          )}
        </ol>
      </section>
    </div>
  );
}
