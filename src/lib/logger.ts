/**
 * Logging estructurado (README.md issue "Monitoreo y manejo de errores
 * centralizado"). En producción emite JSON por línea (fácil de indexar
 * por cualquier agregador de logs — Vercel, Datadog, etc.); en
 * desarrollo emite texto legible. No sustituye un servicio de error
 * tracking real (ver src/lib/errorReporting.ts para eso).
 */
type Level = "info" | "warn" | "error";

function emit(level: Level, message: string, context?: Record<string, unknown>) {
  const entry = { level, message, context, timestamp: new Date().toISOString() };

  if (process.env.NODE_ENV === "production") {
    const line = JSON.stringify(entry);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
    return;
  }

  const suffix = context ? ` ${JSON.stringify(context)}` : "";
  if (level === "error") console.error(`[${level}] ${message}${suffix}`);
  else if (level === "warn") console.warn(`[${level}] ${message}${suffix}`);
  else console.log(`[${level}] ${message}${suffix}`);
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => emit("error", message, context),
};
