import Link from "next/link";
import { requireDevelopmentForSession } from "@/lib/tenant";
import {
  updateDevelopmentGeneral,
  updateDevelopmentAdvanced,
  publishDevelopment,
  unpublishDevelopment,
} from "@/lib/actions/developments";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { ValidatedInput, ValidatedTextarea } from "@/components/ui/validated-input";

export const dynamic = "force-dynamic";

export default async function GeneralPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { error, ok } = await searchParams;
  const development = await requireDevelopmentForSession(id);
  const action = updateDevelopmentGeneral.bind(null, id);
  const advancedAction = updateDevelopmentAdvanced.bind(null, id);

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <ToastFromParams ok={ok ? "Guardado." : undefined} error={error} />

      <div className="flex flex-col gap-3 rounded-xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard/developments" className="text-xs text-muted-foreground hover:text-foreground">
            ← Todos los desarrollos
          </Link>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">{development.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            /{development.slug}{" "}
            <span className={development.status === "PUBLICADO" ? "text-green-400" : "text-amber-400"}>
              · {development.status === "PUBLICADO" ? "Publicado" : "Borrador"}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/${development.slug}/cotizacion-cliente?preview=1`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Ver vista previa
          </a>
          {development.status === "PUBLICADO" ? (
            <form action={unpublishDevelopment.bind(null, development.id)}>
              <button
                type="submit"
                className="rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:border-foreground"
              >
                Volver a borrador
              </button>
            </form>
          ) : (
            <form action={publishDevelopment.bind(null, development.id)}>
              <button
                type="submit"
                className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Publicar
              </button>
            </form>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-medium">General</h2>
        <form action={action} className="flex flex-col gap-4">
          <ValidatedInput label="Nombre" name="name" required maxLength={120} defaultValue={development.name} />
          <ValidatedTextarea
            label="Descripción"
            name="description"
            maxLength={2000}
            defaultValue={development.description ?? ""}
            rows={3}
          />
          <button
            type="submit"
            className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Guardar
          </button>
        </form>
      </section>

      <details className="group rounded-xl border border-border p-5">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground group-open:text-foreground">
          Configuración avanzada
        </summary>
        <form action={advancedAction} className="mt-4 flex flex-col gap-4">
          <ValidatedInput
            label="Moneda"
            name="currency"
            required
            minLength={3}
            maxLength={6}
            pattern="[A-Za-z]{3,6}"
            defaultValue={development.currency}
            errorMessage="Usa un código de moneda de 3 a 6 letras, ej. MXN"
          />
          <ValidatedInput
            label="Webhook de cotizaciones (opcional)"
            name="webhookUrl"
            type="url"
            defaultValue={development.webhookUrl ?? ""}
            placeholder="https://tu-crm.com/webhooks/modula"
            hint="Cada cotización nueva se enviará también como POST a esta URL."
            errorMessage="Ingresa una URL válida (https://…)"
          />
          <button
            type="submit"
            className="self-start rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground"
          >
            Guardar
          </button>
        </form>
      </details>
    </div>
  );
}
