"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ModelDTO = {
  id: string;
  name: string;
  description: string | null;
  areaM2: number;
  bedrooms: number;
  basePrice: number;
};

type FinishLevelDTO = {
  id: string;
  name: string;
  description: string | null;
  priceDelta: number;
};

type ExtraDTO = {
  id: string;
  name: string;
  description: string | null;
  priceDelta: number;
  modelIds: string[];
};

type Breakdown = {
  basePrice: string;
  finishLevelDelta: string;
  extrasDelta: string;
  promotionsDiscount: string;
  total: string;
  appliedPromotions: { id: string; name: string; discount: string }[];
};

function formatMoney(value: string | number, currency: string) {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(num);
}

const STEPS = ["Modelo", "Acabado", "Extras", "Contacto", "Listo"] as const;

export function ConfiguratorWizard({
  slug,
  preview,
  originPlan,
  currency,
  ctaText,
  accentColor,
  models,
  finishLevels,
  extras,
}: {
  slug: string;
  preview: boolean;
  originPlan: "A" | "B";
  currency: string;
  ctaText: string;
  accentColor: string | null;
  models: ModelDTO[];
  finishLevels: FinishLevelDTO[];
  extras: ExtraDTO[];
}) {
  const [step, setStep] = useState<number>(0);
  const [modelId, setModelId] = useState<string>(models[0]?.id ?? "");
  const [finishLevelId, setFinishLevelId] = useState<string>("");
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [website, setWebsite] = useState(""); // honeypot anti-bot, ver route.ts
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState<string | null>(null);

  const applicableExtras = useMemo(
    () => extras.filter((e) => e.modelIds.includes(modelId)),
    [extras, modelId],
  );

  const previewQs = preview ? "?preview=1" : "";

  function trackEvent(type: "VISITA" | "CONFIGURACION_COMPLETADA") {
    fetch(`/api/developments/${slug}/events${previewQs}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, originPlan, modelId: modelId || undefined }),
      keepalive: true,
    }).catch(() => {});
  }

  const trackedVisit = useRef(false);
  useEffect(() => {
    if (trackedVisit.current) return;
    trackedVisit.current = true;
    trackEvent("VISITA");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trackedConfigCompleted = useRef(false);
  useEffect(() => {
    if (step !== 3 || trackedConfigCompleted.current) return;
    trackedConfigCompleted.current = true;
    trackEvent("CONFIGURACION_COMPLETADA");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (!modelId) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el precio con la selección actual, no con el montaje
    setLoadingPrice(true);
    setPriceError(null);

    fetch(`/api/developments/${slug}/pricing${previewQs}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId,
        finishLevelId: finishLevelId || undefined,
        extraIds: extraIds.filter((id) => applicableExtras.some((e) => e.id === id)),
        promoCode: appliedPromoCode || undefined,
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "No se pudo calcular el precio");
        return data;
      })
      .then((data: Breakdown) => setBreakdown(data))
      .catch((err) => {
        if (err.name !== "AbortError") {
          setPriceError(err.message);
          // Un código de promoción inválido no debe tumbar todo el
          // cálculo del precio — se limpia y se recalcula sin él.
          if (appliedPromoCode) setAppliedPromoCode(null);
        }
      })
      .finally(() => setLoadingPrice(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, modelId, finishLevelId, extraIds, applicableExtras.length, appliedPromoCode]);

  async function submitQuote() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/developments/${slug}/quotes${previewQs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId,
          finishLevelId: finishLevelId || undefined,
          extraIds: extraIds.filter((id) => applicableExtras.some((e) => e.id === id)),
          promoCode: appliedPromoCode || undefined,
          customerName,
          customerEmail,
          customerPhone: customerPhone || undefined,
          originPlan,
          website,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo enviar la cotización");
      }
      const data = await res.json();
      setConfirmedTotal(data.total);
      setStep(4);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  const accent = accentColor || "#3d3d3d";

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-wrap items-center gap-2 text-xs" aria-label="Progreso">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined} className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium transition-colors"
              style={
                i <= step
                  ? { backgroundColor: accent, color: "#fff" }
                  : { backgroundColor: "var(--color-muted)", color: "var(--color-muted-foreground)" }
              }
            >
              {i + 1}
            </span>
            <span className={i === step ? "font-medium text-foreground" : "text-muted-foreground"}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-4 bg-border" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 font-medium">Elige un modelo</legend>
          {models.map((model) => (
            <label
              key={model.id}
              className="flex cursor-pointer flex-col gap-1 rounded-xl border border-border p-4 transition-colors has-[:checked]:border-foreground"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="model"
                  value={model.id}
                  checked={modelId === model.id}
                  onChange={() => {
                    setModelId(model.id);
                    setExtraIds([]);
                  }}
                />
                <span className="font-medium">{model.name}</span>
              </span>
              <span className="text-sm text-muted-foreground">
                {model.areaM2} m² · {model.bedrooms} recámaras · desde{" "}
                {formatMoney(model.basePrice, currency)}
              </span>
            </label>
          ))}
          {models.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay modelos disponibles.</p>}
          <button
            type="button"
            disabled={!modelId}
            onClick={() => setStep(1)}
            style={{ backgroundColor: accent }}
            className="mt-2 self-start rounded-full px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Continuar
          </button>
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 font-medium">Elige un nivel de acabado</legend>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border p-4 has-[:checked]:border-foreground">
            <input
              type="radio"
              name="finish"
              checked={finishLevelId === ""}
              onChange={() => setFinishLevelId("")}
            />
            Estándar (sin costo adicional)
          </label>
          {finishLevels.map((fl) => (
            <label
              key={fl.id}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-border p-4 has-[:checked]:border-foreground"
            >
              <input
                type="radio"
                name="finish"
                checked={finishLevelId === fl.id}
                onChange={() => setFinishLevelId(fl.id)}
              />
              {fl.name} (+{formatMoney(fl.priceDelta, currency)})
            </label>
          ))}
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="rounded-full border border-border px-5 py-2.5 text-sm transition-colors hover:border-foreground"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{ backgroundColor: accent }}
              className="rounded-full px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Continuar
            </button>
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 font-medium">Elige extras</legend>
          {applicableExtras.map((extra) => (
            <label
              key={extra.id}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-border p-4 has-[:checked]:border-foreground"
            >
              <input
                type="checkbox"
                checked={extraIds.includes(extra.id)}
                onChange={(e) =>
                  setExtraIds((prev) =>
                    e.target.checked ? [...prev, extra.id] : prev.filter((id) => id !== extra.id),
                  )
                }
              />
              {extra.name} (+{formatMoney(extra.priceDelta, currency)})
            </label>
          ))}
          {applicableExtras.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin extras disponibles para este modelo.</p>
          )}
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-full border border-border px-5 py-2.5 text-sm transition-colors hover:border-foreground"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              style={{ backgroundColor: accent }}
              className="rounded-full px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Continuar
            </button>
          </div>
        </fieldset>
      )}

      {step === 3 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitQuote();
          }}
          className="flex flex-col gap-4"
        >
          <h2 className="font-medium">Tus datos de contacto</h2>
          {/* Honeypot: oculto para personas, visible para bots que rellenan todo el formulario */}
          <label className="absolute -left-[9999px]" aria-hidden="true">
            No llenar este campo
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Nombre
            <input
              required
              minLength={2}
              maxLength={160}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Correo
            <input
              type="email"
              required
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Teléfono (opcional)
            <input
              type="tel"
              maxLength={40}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
            />
          </label>
          {submitError && (
            <p role="alert" className="text-sm text-red-400">
              {submitError}
            </p>
          )}
          <div className="mt-1 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-full border border-border px-5 py-2.5 text-sm transition-colors hover:border-foreground"
            >
              Atrás
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ backgroundColor: accent }}
              className="rounded-full px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Enviando…" : ctaText}
            </button>
          </div>
        </form>
      )}

      {step === 4 && (
        <div role="status" className="rounded-xl border border-green-800 bg-green-950 p-5">
          <p className="font-medium text-green-400">¡Listo! Recibimos tu cotización.</p>
          {confirmedTotal && (
            <p className="mt-1 text-sm text-green-400">
              Total cotizado: {formatMoney(confirmedTotal, currency)}
            </p>
          )}
          <p className="mt-2 text-sm text-green-400">Nos pondremos en contacto contigo pronto.</p>
        </div>
      )}

      {step < 4 && (
        <aside aria-live="polite" className="rounded-xl border border-border bg-muted/40 p-5">
          <h3 className="text-sm font-medium text-muted-foreground">Precio estimado</h3>
          {loadingPrice && <p className="mt-2 text-sm text-muted-foreground">Calculando…</p>}
          {!loadingPrice && breakdown && (
            <div className="mt-1">
              <p className="text-2xl font-semibold">{formatMoney(breakdown.total, currency)}</p>
              <ul className="mt-2 flex flex-col gap-0.5 text-xs text-muted-foreground">
                <li>Base: {formatMoney(breakdown.basePrice, currency)}</li>
                {Number(breakdown.finishLevelDelta) !== 0 && (
                  <li>Acabado: +{formatMoney(breakdown.finishLevelDelta, currency)}</li>
                )}
                {Number(breakdown.extrasDelta) !== 0 && (
                  <li>Extras: +{formatMoney(breakdown.extrasDelta, currency)}</li>
                )}
                {breakdown.appliedPromotions.map((p) => (
                  <li key={p.id} className="text-green-500">
                    {p.name}: -{formatMoney(p.discount, currency)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 border-t border-border pt-4">
            {appliedPromoCode ? (
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-green-500">
                  Código <span className="font-mono">{appliedPromoCode}</span> aplicado
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedPromoCode(null);
                    setPromoCodeInput("");
                    setPriceError(null);
                  }}
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label htmlFor="promo-code" className="text-xs text-muted-foreground">
                  ¿Tienes un código de promoción?
                </label>
                <div className="flex gap-2">
                  <input
                    id="promo-code"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    placeholder="CÓDIGO"
                    maxLength={40}
                    className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-foreground"
                  />
                  <button
                    type="button"
                    disabled={!promoCodeInput.trim()}
                    onClick={() => setAppliedPromoCode(promoCodeInput.trim())}
                    className="shrink-0 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-foreground disabled:opacity-50"
                  >
                    Aplicar
                  </button>
                </div>
                {priceError && (
                  <p role="alert" className="text-xs text-red-400">
                    {priceError}
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
