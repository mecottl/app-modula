import type { Instrumentation } from "next";

/**
 * Hook de Next.js que se dispara con cualquier error no manejado en
 * Server Components, Route Handlers o Server Actions — el
 * complemento automático de captureException para todo lo que no pasa
 * por un try/catch explícito (README.md issue "Monitoreo y manejo de
 * errores centralizado").
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request) => {
  const { captureException } = await import("@/lib/errorReporting");
  captureException(error, { path: request.path, method: request.method });
};
