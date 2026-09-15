"use client";

import { useId, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const inputBase =
  "rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground";

/**
 * Input con validación en tiempo real (issue "validaciones en tiempo
 * real de todos los inputs"): reusa las reglas nativas de HTML5
 * (required/min/max/pattern/type) que los forms ya tenían, y solo
 * agrega el mensaje de error visible — no cambia qué se considera
 * válido. Valida en cada cambio una vez que el campo perdió el foco por
 * primera vez, para no marcar error mientras el usuario todavía escribe
 * el primer carácter.
 */
export function ValidatedInput({
  label,
  hint,
  errorMessage,
  className,
  onBlur,
  onChange,
  maxLength,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  errorMessage?: string;
}) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [length, setLength] = useState(() => String(props.defaultValue ?? props.value ?? "").length);

  function validate(el: HTMLInputElement) {
    setError(el.validity.valid ? null : errorMessage || el.validationMessage);
  }

  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-sm">
      {label}
      <input
        id={id}
        maxLength={maxLength}
        {...props}
        onBlur={(e) => {
          setTouched(true);
          validate(e.currentTarget);
          onBlur?.(e);
        }}
        onChange={(e) => {
          if (touched) validate(e.currentTarget);
          if (maxLength) setLength(e.currentTarget.value.length);
          onChange?.(e);
        }}
        aria-invalid={Boolean(error)}
        className={cn(inputBase, error && "border-red-500 focus:border-red-500", className)}
      />
      <div className="flex items-center justify-between gap-2">
        {error ? (
          <span role="alert" className="text-xs text-red-400">
            {error}
          </span>
        ) : (
          hint && <span className="text-xs text-muted-foreground">{hint}</span>
        )}
        {maxLength && (
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {length}/{maxLength}
          </span>
        )}
      </div>
    </label>
  );
}

export function ValidatedTextarea({
  label,
  hint,
  errorMessage,
  className,
  onBlur,
  onChange,
  maxLength,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  errorMessage?: string;
}) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [length, setLength] = useState(() => String(props.defaultValue ?? props.value ?? "").length);

  function validate(el: HTMLTextAreaElement) {
    setError(el.validity.valid ? null : errorMessage || el.validationMessage);
  }

  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-sm">
      {label}
      <textarea
        id={id}
        maxLength={maxLength}
        {...props}
        onBlur={(e) => {
          setTouched(true);
          validate(e.currentTarget);
          onBlur?.(e);
        }}
        onChange={(e) => {
          if (touched) validate(e.currentTarget);
          if (maxLength) setLength(e.currentTarget.value.length);
          onChange?.(e);
        }}
        aria-invalid={Boolean(error)}
        className={cn(inputBase, error && "border-red-500 focus:border-red-500", className)}
      />
      <div className="flex items-center justify-between gap-2">
        {error ? (
          <span role="alert" className="text-xs text-red-400">
            {error}
          </span>
        ) : (
          hint && <span className="text-xs text-muted-foreground">{hint}</span>
        )}
        {maxLength && (
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {length}/{maxLength}
          </span>
        )}
      </div>
    </label>
  );
}
