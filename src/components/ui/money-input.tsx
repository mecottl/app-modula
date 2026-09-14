"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

const inputBase =
  "rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground";

function toDisplay(raw: string) {
  if (!raw || raw === "-") return raw;
  const negative = raw.startsWith("-");
  const [intPart, decPart] = (negative ? raw.slice(1) : raw).split(".");
  const grouped = new Intl.NumberFormat("es-MX").format(BigInt(intPart || "0"));
  const sign = negative ? "-" : "";
  return decPart !== undefined ? `${sign}${grouped}.${decPart}` : `${sign}${grouped}`;
}

function toRaw(display: string) {
  const negative = display.trim().startsWith("-");
  const digits = display.replace(/[^\d.]/g, "");
  return negative ? `-${digits}` : digits;
}

/**
 * Input de dinero (issue "formateo del dinero... automaticamente se le
 * vaya poniendo formato"): muestra separadores de miles mientras se
 * escribe, pero envía el valor numérico plano vía un input oculto para
 * que las server actions (que esperan basePrice/priceDelta/value como
 * número) no cambien.
 */
export function MoneyInput({
  label,
  name,
  defaultValue,
  required,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  required?: boolean;
  className?: string;
}) {
  const id = useId();
  const [raw, setRaw] = useState(defaultValue !== undefined ? String(defaultValue) : "");

  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-sm">
      {label}
      <input type="hidden" name={name} value={raw} />
      <input
        id={id}
        type="text"
        inputMode="decimal"
        required={required}
        value={toDisplay(raw)}
        onChange={(e) => setRaw(toRaw(e.target.value))}
        className={cn(inputBase, className)}
      />
    </label>
  );
}
