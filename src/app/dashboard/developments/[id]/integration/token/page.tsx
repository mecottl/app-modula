import { requireDevelopmentForSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { regenerateIntegrationToken } from "@/lib/actions/integration";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { CopyButton } from "@/components/ui/copy-button";
import { SubmitButton } from "@/components/ui/submit-button";

export const dynamic = "force-dynamic";

export default async function IntegrationTokenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id } = await params;
  const { ok } = await searchParams;
  await requireDevelopmentForSession(id);
  const settings = await prisma.integrationSettings.findUniqueOrThrow({ where: { developmentId: id } });

  return (
    <section className="rounded border p-4">
      <ToastFromParams ok={ok} />
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">Token del proyecto</h3>
        <CopyButton value={settings.token} label="Copiar token" />
      </div>
      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{settings.token}</p>
      <form action={regenerateIntegrationToken.bind(null, id)} className="mt-3">
        <SubmitButton className="rounded border px-4 py-2 text-sm">Regenerar token</SubmitButton>
      </form>
      <p className="mt-1 text-xs text-amber-400">
        Regenerar invalida el token anterior de inmediato. Hazlo solo si se filtró.
      </p>
    </section>
  );
}
