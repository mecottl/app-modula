import { logger } from "@/lib/logger";

/**
 * Punto único de captura de excepciones (README.md issue "Monitoreo y
 * manejo de errores centralizado"). Hoy solo registra vía `logger`
 * (visible en los logs del hosting, ej. Vercel). Para alertas activas
 * (no solo logs pasivos), instalar `@sentry/nextjs`, correr su wizard de
 * setup, y reemplazar el cuerpo de esta función por
 * `Sentry.captureException(error, { extra: context })` — el resto del
 * código ya llama a `captureException` en todos los puntos relevantes,
 * así que ese sería el único archivo a tocar.
 */
export function captureException(error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  logger.error(message, { ...context, stack });
}
