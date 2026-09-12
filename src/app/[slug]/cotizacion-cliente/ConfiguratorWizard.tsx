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

const STEPS = ["modelo", "acabado", "extras", "contacto", "confirmacion"] as const;

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
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "No se pudo calcular el precio");
        return res.json();
      })
      .then((data: Breakdown) => setBreakdown(data))
      .catch((err) => {
        if (err.name !== "AbortError") setPriceError(err.message);
      })
      .finally(() => setLoadingPrice(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, modelId, finishLevelId, extraIds, applicableExtras.length]);

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

  const accent = accentColor || "#111111";

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-wrap gap-2 text-xs text-gray-500" aria-label="Progreso">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            className={i === step ? "font-semibold text-black" : ""}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-medium">Elige un modelo</legend>
          {models.map((model) => (
            <label
              key={model.id}
              className="flex cursor-pointer flex-col gap-1 rounded border p-3 has-[:checked]:border-black"
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
              <span className="text-sm text-gray-500">
                {model.areaM2} m² · {model.bedrooms} recámaras · desde{" "}
                {formatMoney(model.basePrice, currency)}
              </span>
            </label>
          ))}
          {models.length === 0 && <p className="text-sm text-gray-500">Aún no hay modelos disponibles.</p>}
          <button
            type="button"
            disabled={!modelId}
            onClick={() => setStep(1)}
            style={{ backgroundColor: accent }}
            className="mt-2 self-start rounded px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Continuar
          </button>
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-medium">Elige un nivel de acabado</legend>
          <label className="flex cursor-pointer items-center gap-2 rounded border p-3">
            <input
              type="radio"
              name="finish"
              checked={finishLevelId === ""}
              onChange={() => setFinishLevelId("")}
            />
            Estándar (sin costo adicional)
          </label>
          {finishLevels.map((fl) => (
            <label key={fl.id} className="flex cursor-pointer items-center gap-2 rounded border p-3">
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
            <button type="button" onClick={() => setStep(0)} className="rounded border px-4 py-2 text-sm">
              Atrás
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{ backgroundColor: accent }}
              className="rounded px-4 py-2 text-sm text-white"
            >
              Continuar
            </button>
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-medium">Elige extras</legend>
          {applicableExtras.map((extra) => (
            <label key={extra.id} className="flex cursor-pointer items-center gap-2 rounded border p-3">
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
            <p className="text-sm text-gray-500">Sin extras disponibles para este modelo.</p>
          )}
          <div className="mt-2 flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="rounded border px-4 py-2 text-sm">
              Atrás
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              style={{ backgroundColor: accent }}
              className="rounded px-4 py-2 text-sm text-white"
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
          className="flex flex-col gap-3"
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
              maxLength={160}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="rounded border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Correo
            <input
              type="email"
              required
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="rounded border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Teléfono (opcional)
            <input
              type="tel"
              maxLength={40}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="rounded border px-3 py-2"
            />
          </label>
          {submitError && (
            <p role="alert" className="text-sm text-red-600">
              {submitError}
            </p>
          )}
          <div className="mt-2 flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="rounded border px-4 py-2 text-sm">
              Atrás
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ backgroundColor: accent }}
              className="rounded px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {submitting ? "Enviando…" : ctaText}
            </button>
          </div>
        </form>
      )}

      {step === 4 && (
        <div role="status" className="rounded border border-green-500 bg-green-50 p-4">
          <p className="font-medium text-green-800">¡Listo! Recibimos tu cotización.</p>
          {confirmedTotal && (
            <p className="mt-1 text-sm text-green-700">
              Total cotizado: {formatMoney(confirmedTotal, currency)}
            </p>
          )}
          <p className="mt-2 text-sm text-green-700">Nos pondremos en contacto contigo pronto.</p>
        </div>
      )}

      {step < 4 && (
        <aside aria-live="polite" className="rounded border bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-600">Precio estimado</h3>
          {loadingPrice && <p className="text-sm text-gray-500">Calculando…</p>}
          {priceError && <p className="text-sm text-red-600">{priceError}</p>}
          {breakdown && !loadingPrice && !priceError && (
            <div className="mt-1">
              <p className="text-2xl font-semibold">{formatMoney(breakdown.total, currency)}</p>
              <ul className="mt-1 text-xs text-gray-500">
                <li>Base: {formatMoney(breakdown.basePrice, currency)}</li>
                {Number(breakdown.finishLevelDelta) !== 0 && (
                  <li>Acabado: +{formatMoney(breakdown.finishLevelDelta, currency)}</li>
                )}
                {Number(breakdown.extrasDelta) !== 0 && (
                  <li>Extras: +{formatMoney(breakdown.extrasDelta, currency)}</li>
                )}
                {breakdown.appliedPromotions.map((p) => (
                  <li key={p.id}>
                    {p.name}: -{formatMoney(p.discount, currency)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
