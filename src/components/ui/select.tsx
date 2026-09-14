"use client";

import { useId, useState } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reemplaza el <select> nativo (issue "combobox se ven bien en modo
 * claro, pero no en modo oscuro"): en Windows, Chromium renderiza el
 * popup de <select> con los colores del sistema operativo sin importar
 * `color-scheme` en CSS — no hay forma de oscurecerlo desde CSS. Este
 * componente dibuja su propio popup (Radix Select) para tener control
 * real del tema, y sigue funcionando con `<form action={serverAction}>`
 * sin JS extra vía un <input type="hidden"> sincronizado.
 */
export function Select({
  label,
  id: idProp,
  name,
  defaultValue,
  options,
  className,
}: {
  label?: string;
  id?: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [value, setValue] = useState(defaultValue ?? options[0]?.value ?? "");

  const trigger = (
    <SelectPrimitive.Root value={value} onValueChange={setValue}>
      <input type="hidden" name={name} value={value} />
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md border border-border bg-transparent px-3 py-2 text-left text-sm outline-none focus:border-foreground",
          className,
        )}
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-lg"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o.value}
                value={o.value}
                className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pr-3 pl-8 text-sm outline-none data-[highlighted]:bg-muted"
              >
                <SelectPrimitive.ItemIndicator className="absolute left-2 flex items-center">
                  <Check className="h-4 w-4" />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );

  if (!label) return trigger;

  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-sm">
      {label}
      {trigger}
    </label>
  );
}
