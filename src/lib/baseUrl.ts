import { headers } from "next/headers";

/**
 * Resuelve la URL base pública de la app para generar snippets de
 * instalación. Usa NEXT_PUBLIC_APP_URL si está configurado (recomendado
 * en producción); si no, la infiere de los encabezados de la solicitud
 * (suficiente en desarrollo local).
 */
export async function getBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
