"use client";

import { useState } from "react";

/**
 * Confirmación de borrado escribiendo el nombre exacto (issue "agrega
 * para eliminar ese desarrollo") — se lleva en cascada el catálogo y
 * las cotizaciones ya recibidas, así que pedimos más fricción que un
 * simple botón, mismo patrón que borrar un repo en GitHub.
 */
export function DeleteDevelopmentForm({
  developmentName,
  action,
}: {
  developmentName: string;
  action: (formData: FormData) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Escribe <span className="font-medium text-foreground">{developmentName}</span> para confirmar
        <input
          name="confirmName"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-destructive"
        />
      </label>
      <button
        type="submit"
        disabled={value !== developmentName}
        className="self-start rounded-full border border-destructive/50 px-5 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Eliminar desarrollo
      </button>
    </form>
  );
}
