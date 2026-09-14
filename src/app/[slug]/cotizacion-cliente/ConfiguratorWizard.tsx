"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ModelDTO = {
  id: string;
  name: string;
  description: string | null;
  areaM2: number;
  bedrooms: number;
  basePrice: number;
  imageUrls: string[];
};

type FinishLevelDTO = {
  id: string;
  name: string;
  description: string | null;
  priceDelta: number;
  imageUrls: string[];
};

type ExtraDTO = {
  id: string;
  name: string;
  description: string | null;
  priceDelta: number;
  modelIds: string[];
  imageUrls: string[];
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

/**
 * Configurador estilo Tesla (issue "copiarle la distribución a Tesla"):
 * ya no es un asistente por pasos — todas las secciones (modelo,
 * acabado, extras, contacto) están en un solo panel con scroll a la
 * derecha, la imagen grande a la izquierda se queda fija y cambia según
 * lo que se va eligiendo, y una barra inferior fija muestra el resumen
 * + precio + botón de enviar en todo momento.
 */
export function ConfiguratorWizard({
  slug,
  preview,
  originPlan,
  developmentName,
  logoUrl,
  showHeader = true,
  currency,
  ctaText,
  primaryColor,
  accentColor,
  models,
  finishLevels,
  extras,
}: {
  slug: string;
  preview: boolean;
  originPlan: "A" | "B";
  developmentName?: string;
  logoUrl?: string | null;
  showHeader?: boolean;
  currency: string;
  ctaText: string;
  primaryColor?: string | null;
  accentColor: string | null;
  models: ModelDTO[];
  finishLevels: FinishLevelDTO[];
  extras: ExtraDTO[];
}) {
  const [modelId, setModelId] = useState<string>(models[0]?.id ?? "");
  const [finishLevelId, setFinishLevelId] = useState<string>("");
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [website, setWebsite] = useState(""); // honeypot anti-bot, ver route.ts
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState<string | null>(null);
  const [confirmedQuoteId, setConfirmedQuoteId] = useState<string | null>(null);

  const applicableExtras = useMemo(
    () => extras.filter((e) => e.modelIds.includes(modelId)),
    [extras, modelId],
  );

  const selectedModel = useMemo(() => models.find((m) => m.id === modelId) ?? null, [models, modelId]);
  const selectedFinish = useMemo(
    () => finishLevels.find((f) => f.id === finishLevelId) ?? null,
    [finishLevels, finishLevelId],
  );
  const selectedExtras = useMemo(
    () => applicableExtras.filter((e) => extraIds.includes(e.id)),
    [applicableExtras, extraIds],
  );

  // El acabado elegido pisa las fotos del modelo si tiene fotos propias
  // — sin eso, se ven las del modelo base. Varias fotos se navegan como
  // un carrusel, igual que las fotos del vehículo en Tesla.
  const mainImages = selectedFinish?.imageUrls.length ? selectedFinish.imageUrls : selectedModel?.imageUrls ?? [];

  // Reinicia el índice del carrusel al cambiar de modelo/acabado, sin un
  // efecto aparte: se detecta el cambio de clave durante el render
  // (patrón "ajustar estado cuando cambia una prop" de React).
  const imageSetKey = `${modelId}:${finishLevelId}`;
  const [prevImageSetKey, setPrevImageSetKey] = useState(imageSetKey);
  if (prevImageSetKey !== imageSetKey) {
    setPrevImageSetKey(imageSetKey);
    if (imageIndex !== 0) setImageIndex(0);
  }

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

  // Sin pasos ya no hay un "paso de contacto" explícito — se cuenta la
  // configuración como completada quien llega a tocar el formulario de
  // contacto (mismo criterio que antes: llegó al final del recorrido).
  const trackedConfigCompleted = useRef(false);
  function trackConfigCompletedOnce() {
    if (trackedConfigCompleted.current) return;
    trackedConfigCompleted.current = true;
    trackEvent("CONFIGURACION_COMPLETADA");
  }

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
      setConfirmedQuoteId(data.id);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  // Color primario: acentúa la selección actual (bordes, radios, carrusel).
  // Color de acento: reservado al botón de llamada a la acción, para que
  // ambos puedan distinguirse igual que en el panel de marca del dashboard.
  const primary = primaryColor || "#ffffff";
  const accent = accentColor || "#3d3d3d";

  if (confirmedTotal) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-2xl font-semibold">¡Listo! Recibimos tu cotización.</p>
        <p className="text-muted-foreground">Total cotizado: {formatMoney(confirmedTotal, currency)}</p>
        <p className="text-sm text-muted-foreground">Nos pondremos en contacto contigo pronto.</p>
        {confirmedQuoteId && (
          <a
            href={`/api/developments/${slug}/quotes/${confirmedQuoteId}/pdf${previewQs}`}
            style={{ backgroundColor: accent }}
            className="mt-4 rounded-full px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Descargar cotización en PDF
          </a>
        )}
      </div>
    );
  }

  const summaryParts = [
    selectedModel?.name,
    selectedFinish?.name,
    selectedExtras.length > 0 ? `${selectedExtras.length} extra${selectedExtras.length > 1 ? "s" : ""}` : null,
  ].filter(Boolean);

  // El widget embebido (Plan B) no tiene su propio scroll: el iframe se
  // redimensiona a la altura del contenido y es la página anfitriona la
  // que hace scroll (ver HeightReporter). Por eso solo la página propia
  // (Plan A) usa un layout de altura fija estilo Tesla; el widget usa
  // flujo normal de documento, sin barra inferior "flotante".
  const fullHeight = showHeader;

  return (
    <div className={cn("flex flex-col", fullHeight ? "h-screen" : "min-h-[480px]")}>
      {showHeader && (
        <header className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-3">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-7 w-auto" />
          )}
          <span className="font-medium">{developmentName}</span>
        </header>
      )}

      <div className={cn("flex flex-col lg:flex-row", fullHeight ? "flex-1 overflow-hidden" : "flex-1")}>
        {/* Imagen grande — cambia con la selección actual */}
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center bg-muted/20 lg:flex-1",
            fullHeight ? "h-[38vh] lg:h-auto" : "h-[280px] lg:h-auto",
          )}
        >
          {mainImages[imageIndex] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainImages[imageIndex]}
              alt=""
              className="h-full w-full object-contain p-6"
            />
          ) : (
            <ImageIcon className="h-16 w-16 text-muted-foreground" />
          )}
          {mainImages.length > 1 && (
            <div className="absolute bottom-4 flex items-center gap-3">
              <button
                type="button"
                aria-label="Imagen anterior"
                onClick={() => setImageIndex((i) => (i - 1 + mainImages.length) % mainImages.length)}
                className="rounded-full border border-border bg-background/80 p-1.5 text-foreground transition-colors hover:border-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1.5">
                {mainImages.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    aria-label={`Ver imagen ${i + 1}`}
                    onClick={() => setImageIndex(i)}
                    style={i === imageIndex ? { backgroundColor: primary } : undefined}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-colors",
                      i !== imageIndex && "bg-muted-foreground/40",
                    )}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Imagen siguiente"
                onClick={() => setImageIndex((i) => (i + 1) % mainImages.length)}
                className="rounded-full border border-border bg-background/80 p-1.5 text-foreground transition-colors hover:border-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Panel de opciones — scroll continuo, sin pasos */}
        <div
          className={cn(
            "flex flex-col gap-8 border-t border-border p-6 lg:w-[420px] lg:flex-none lg:border-l lg:border-t-0 lg:p-8",
            fullHeight ? "flex-1 overflow-y-auto" : "flex-1",
          )}
        >
          {preview && (
            <p className="rounded-lg border border-amber-700 bg-amber-950 px-3 py-2 text-xs text-amber-400">
              Vista previa: solo tú puedes ver esto mientras el desarrollo esté en borrador.
            </p>
          )}

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">Elige un modelo</h2>
            {models.map((model) => (
              <OptionRow
                key={model.id}
                color={primary}
                image={model.imageUrls[0]}
                title={model.name}
                subtitle={`${model.areaM2} m² · ${model.bedrooms} recámaras`}
                price={formatMoney(model.basePrice, currency)}
                selected={modelId === model.id}
                onSelect={() => {
                  setModelId(model.id);
                  setExtraIds([]);
                }}
              />
            ))}
            {models.length === 0 && (
              <p className="text-sm text-muted-foreground">Aún no hay modelos disponibles.</p>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">Nivel de acabado</h2>
            <OptionRow
              color={primary}
              title="Estándar"
              subtitle="Sin costo adicional"
              selected={finishLevelId === ""}
              onSelect={() => setFinishLevelId("")}
            />
            {finishLevels.map((fl) => (
              <OptionRow
                key={fl.id}
                color={primary}
                image={fl.imageUrls[0]}
                title={fl.name}
                price={`+${formatMoney(fl.priceDelta, currency)}`}
                selected={finishLevelId === fl.id}
                onSelect={() => setFinishLevelId(fl.id)}
              />
            ))}
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">Extras</h2>
            {applicableExtras.map((extra) => (
              <OptionRow
                key={extra.id}
                color={primary}
                image={extra.imageUrls[0]}
                title={extra.name}
                price={`+${formatMoney(extra.priceDelta, currency)}`}
                selected={extraIds.includes(extra.id)}
                multi
                onSelect={() =>
                  setExtraIds((prev) =>
                    prev.includes(extra.id) ? prev.filter((id) => id !== extra.id) : [...prev, extra.id],
                  )
                }
              />
            ))}
            {applicableExtras.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin extras disponibles para este modelo.</p>
            )}
          </section>

          <section aria-live="polite" className="flex flex-col gap-3 rounded-xl border border-border p-4">
            <h2 className="text-sm font-medium text-muted-foreground">Precio estimado</h2>
            {loadingPrice && <p className="text-sm text-muted-foreground">Calculando…</p>}
            {!loadingPrice && breakdown && (
              <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
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
            )}

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
          </section>

          <form
            id="quote-form"
            onSubmit={(e) => {
              e.preventDefault();
              submitQuote();
            }}
            className="flex flex-col gap-3"
          >
            <h2 className="text-sm font-medium text-muted-foreground">Tus datos de contacto</h2>
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
                onFocus={trackConfigCompletedOnce}
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
          </form>
        </div>
      </div>

      {/* Barra inferior fija: resumen + precio + enviar, siempre visible */}
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-background px-6 py-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{selectedModel?.name ?? "Elige un modelo"}</p>
          {summaryParts.length > 0 && (
            <p className="truncate text-xs text-muted-foreground">{summaryParts.join(" · ")}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold">
            {breakdown ? formatMoney(breakdown.total, currency) : "—"}
          </span>
          <button
            type="submit"
            form="quote-form"
            disabled={submitting || !modelId}
            style={{ backgroundColor: accent }}
            className="rounded-full px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Enviando…" : ctaText}
          </button>
        </div>
      </footer>
    </div>
  );
}

function OptionRow({
  image,
  title,
  subtitle,
  price,
  selected,
  multi,
  color,
  onSelect,
}: {
  image?: string;
  title: string;
  subtitle?: string;
  price?: string;
  selected: boolean;
  multi?: boolean;
  color: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={selected ? { borderColor: color } : undefined}
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
        !selected && "border-border hover:border-foreground/50",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
        ) : (
          <span
            style={selected ? { borderColor: color, backgroundColor: color } : undefined}
            className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center border",
              multi ? "rounded" : "rounded-full",
              !selected && "border-muted-foreground",
            )}
          />
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{title}</span>
          {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
        </span>
      </span>
      {price && <span className="shrink-0 text-sm font-medium">{price}</span>}
    </button>
  );
}
