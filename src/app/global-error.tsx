"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Los Client Components no pueden importar directo del lado del
    // servidor; se reporta vía la misma API de eventos para mantener un
    // único punto de captura (ver src/lib/errorReporting.ts).
    fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: error.message, digest: error.digest }),
      keepalive: true,
    }).catch(() => {});
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-lg font-semibold">Algo salió mal</h1>
          <p className="mt-2 text-sm text-gray-500">
            Ya quedó registrado. Intenta de nuevo en un momento.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded bg-black px-4 py-2 text-sm text-white"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
