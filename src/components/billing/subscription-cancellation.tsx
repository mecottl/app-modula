"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelSubscriptionAtPeriodEnd, resumeSubscription } from "@/lib/actions/billing";

export function SubscriptionCancellation({
  cancelAtPeriodEnd: initialCancelAtPeriodEnd,
  periodEndDate,
}: {
  cancelAtPeriodEnd: boolean;
  periodEndDate: string;
}) {
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(initialCancelAtPeriodEnd);
  const [pending, startTransition] = useTransition();

  function handleCancel() {
    startTransition(async () => {
      try {
        await cancelSubscriptionAtPeriodEnd();
        setCancelAtPeriodEnd(true);
        toast.success("Suscripción cancelada. Sigue activa hasta el final de tu periodo ya pagado.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cancelar la suscripción");
      }
    });
  }

  function handleResume() {
    startTransition(async () => {
      try {
        await resumeSubscription();
        setCancelAtPeriodEnd(false);
        toast.success("Suscripción reactivada.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo reactivar la suscripción");
      }
    });
  }

  return (
    <div
      className="rounded-xl border border-border p-6"
    >
      <h2 className="font-medium ">Suscripción</h2>
      {cancelAtPeriodEnd ? (
        <>
          <p className="mt-2 text-sm text-amber-400">
            Tu suscripción se cancelará el {periodEndDate}. Conservas acceso completo hasta entonces.
          </p>
          <Button variant="outline" size="sm" onClick={handleResume} disabled={pending} className="mt-4">
            {pending ? "Reactivando…" : "Reactivar suscripción"}
          </Button>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Al cancelar, tu suscripción sigue siendo válida hasta el {periodEndDate} — un mes después de
            tu última facturación. No se te cobrará de nuevo a partir de esa fecha, y no se hace ningún
            reembolso del periodo ya pagado.
          </p>
          <button
            type="button"
            onClick={handleCancel}
            disabled={pending}
            className="mt-4 text-sm text-red-400 underline underline-offset-4 transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {pending ? "Cancelando…" : "Cancelar suscripción"}
          </button>
        </>
      )}
    </div>
  );
}
