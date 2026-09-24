import Link from "next/link";
import { Check } from "lucide-react";
import { requireDevelopmentForSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import {
  updateDevelopmentGeneral,
  updateDevelopmentAdvanced,
  publishDevelopment,
  unpublishDevelopment,
  deleteDevelopment,
} from "@/lib/actions/developments";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { ValidatedInput, ValidatedTextarea } from "@/components/ui/validated-input";
import { DeleteDevelopmentForm } from "@/components/dashboard/delete-development-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

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

  const [activeModels, catalogNodes] = await Promise.all([
    prisma.model.count({ where: { developmentId: id, active: true } }),
    prisma.catalogNode.count({ where: { developmentId: id } }),
  ]);
  const hasModel = activeModels > 0;
  const hasCategories = catalogNodes > 0;
  const isPublished = development.status === "PUBLICADO";

  const steps = [
    {
      label: "Agrega un modelo",
      description: "Al menos uno activo, o el configurador no tiene nada que mostrar.",
      done: hasModel,
      href: `/dashboard/developments/${id}/models`,
    },
    {
      label: "Categorías (opcional)",
      description: "Acabados, extras y lo que quieras ofrecer con variantes de precio; no son obligatorias para publicar.",
      done: hasCategories,
      href: `/dashboard/developments/${id}/categories`,
    },
    {
      label: "Publica",
      description: "Hazlo visible en la página pública y el widget.",
      done: isPublished,
      href: undefined,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <ToastFromParams ok={ok ? "Guardado." : undefined} error={error} />

      <div className="flex flex-col gap-5 rounded-xl border border-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Link href="/dashboard/developments" className="text-xs text-muted-foreground hover:text-foreground">
            ← Todos los desarrollos
          </Link>
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{development.name}</h1>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                isPublished
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-400",
              )}
            >
              {isPublished ? "Publicado" : "Borrador"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <a
            href={`/${development.slug}/cotizacion-cliente?preview=1`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Ver vista previa
          </a>
          {isPublished ? (
            <form action={unpublishDevelopment.bind(null, development.id)}>
              <SubmitButton className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-foreground">
                Volver a borrador
              </SubmitButton>
            </form>
          ) : (
            <form action={publishDevelopment.bind(null, development.id)}>
              <SubmitButton
                disabled={!hasModel}
                title={hasModel ? undefined : "Agrega al menos un modelo activo antes de publicar"}
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Publicar
              </SubmitButton>
            </form>
          )}
        </div>
      </div>

      <div className="flex max-w-lg flex-col gap-8">
        {!isPublished && (
          <section className="flex flex-col gap-3 rounded-xl border border-border p-5">
            <h2 className="font-medium">Antes de publicar</h2>
            <ul className="flex flex-col gap-3">
              {steps.map((step, i) => (
                <li key={step.label} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs",
                      step.done
                        ? "border-green-500 bg-green-500/10 text-green-400"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {step.done ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <div>
                    <p className={cn("text-sm", step.done ? "text-muted-foreground line-through" : "font-medium")}>
                      {step.href ? (
                        <Link href={step.href} className="underline-offset-4 hover:underline">
                          {step.label}
                        </Link>
                      ) : (
                        step.label
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

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
            <SubmitButton className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              Guardar
            </SubmitButton>
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
            <SubmitButton className="self-start rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground">
              Guardar
            </SubmitButton>
          </form>

          <div className="mt-6 flex flex-col gap-3 border-t border-destructive/30 pt-6">
            <div>
              <h3 className="text-sm font-medium text-destructive">Zona de peligro</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Elimina este desarrollo por completo: catálogo, categorías, promociones y
                todas las cotizaciones ya recibidas. No se puede deshacer.
              </p>
            </div>
            <DeleteDevelopmentForm
              developmentName={development.name}
              action={deleteDevelopment.bind(null, development.id)}
            />
          </div>
        </details>
      </div>
    </div>
  );
}
