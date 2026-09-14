"use client";

import { useState, useTransition } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { CreditCard, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { stripeElementsAppearance } from "@/lib/stripeAppearance";
import {
  createSetupIntent,
  listPaymentMethods,
  removePaymentMethod,
  setDefaultPaymentMethod,
} from "@/lib/actions/paymentMethods";
import { AddCardForm } from "./add-card-form";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

const brandLabels: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unionpay: "UnionPay",
};

type Card = { id: string; brand: string; last4: string; expMonth: number; expYear: number };

export function CardsManager({
  initialCards,
  initialDefaultId,
}: {
  initialCards: Card[];
  initialDefaultId: string | null;
}) {
  const [cards, setCards] = useState(initialCards);
  const [defaultId, setDefaultIdState] = useState(initialDefaultId);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function refresh() {
    const data = await listPaymentMethods();
    setCards(data.cards);
    setDefaultIdState(data.defaultId);
    setClientSecret(null);
  }

  async function handleAddClick() {
    setPreparing(true);
    try {
      const secret = await createSetupIntent();
      setClientSecret(secret);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar el registro de la tarjeta");
    } finally {
      setPreparing(false);
    }
  }

  function handleSetDefault(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await setDefaultPaymentMethod(id);
        setDefaultIdState(id);
        toast.success("Tarjeta predeterminada actualizada.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo actualizar");
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleRemove(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await removePaymentMethod(id);
        setCards((prev) => prev.filter((c) => c.id !== id));
        toast.success("Tarjeta eliminada.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo eliminar");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {cards.map((card) => {
          const isDefault = card.id === defaultId;
          const isPending = pendingId === card.id;
          return (
            <li
              key={card.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {brandLabels[card.brand] ?? card.brand} •••• {card.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vence {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                  </p>
                </div>
                {isDefault && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3" /> Predeterminada
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(card.id)}
                    disabled={isPending}
                    className="text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    Usar como predeterminada
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(card.id)}
                  disabled={isPending}
                  aria-label="Eliminar tarjeta"
                  className={cn(
                    "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
                    isPending && "opacity-50",
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
        {cards.length === 0 && !clientSecret && (
          <EmptyState
            title="Sin tarjetas guardadas"
            description="Agrega una tarjeta para tus próximos cobros."
          />
        )}
      </ul>

      {clientSecret ? (
        <div className="rounded-xl border border-border p-4">
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeElementsAppearance }}>
            <AddCardForm onSuccess={refresh} onCancel={() => setClientSecret(null)} />
          </Elements>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={handleAddClick} disabled={preparing} className="w-fit gap-2">
          <Plus className="h-4 w-4" />
          {preparing ? "Preparando…" : "Agregar tarjeta"}
        </Button>
      )}
    </div>
  );
}
