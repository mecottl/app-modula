"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/**
 * Antes esto era un <input type="text"> libre — se podía escribir
 * literalmente cualquier cosa y guardarse tal cual (issue "arreglar
 * input para los colores"). Ahora combina un selector de color nativo
 * (siempre produce un hex válido) con el campo de texto para quien
 * prefiera teclear el código exacto, validando en tiempo real que sea
 * un hex de 6 dígitos antes de dejarlo pasar.
 */
export function ColorInput({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
}) {
  const id = useId();
  const initial = defaultValue && HEX_PATTERN.test(defaultValue) ? defaultValue : "#000000";
  const [value, setValue] = useState(defaultValue ?? "");
  const [swatch, setSwatch] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  function validate(next: string, isTouched: boolean) {
    if (next === "") {
      setError(null);
      return;
    }
    if (HEX_PATTERN.test(next)) {
      setSwatch(next);
      setError(null);
    } else if (isTouched) {
      setError("Usa un color hex de 6 dígitos, ej. #2563EB");
    }
  }

  function handleTextChange(next: string) {
    setValue(next);
    validate(next, touched);
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={id}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`Selector de color para ${label}`}
          value={swatch}
          onChange={(e) => {
            setSwatch(e.target.value);
            setValue(e.target.value);
            setError(null);
          }}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1"
        />
        <input
          id={id}
          name={name}
          type="text"
          value={value}
          placeholder="#2563EB"
          maxLength={7}
          onChange={(e) => handleTextChange(e.target.value)}
          onBlur={(e) => {
            setTouched(true);
            validate(e.target.value, true);
          }}
          aria-invalid={Boolean(error)}
          className={cn(
            "flex-1 rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground",
            error && "border-red-500 focus:border-red-500",
          )}
        />
      </div>
      {error && (
        <span role="alert" className="text-xs text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}
