"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Se deshabilita solo mientras el <form> padre está enviando (useFormStatus
 * lee el estado del formulario ancestro más cercano), sin tocar cada Server
 * Action — evita que varios clics seguidos disparen envíos duplicados.
 */
export function SubmitButton({ className, disabled, ...props }: React.ComponentProps<"button">) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={cn(className, "disabled:cursor-not-allowed disabled:opacity-60")}
      {...props}
    />
  );
}
