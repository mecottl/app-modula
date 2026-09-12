import { NextRequest, NextResponse } from "next/server";

/**
 * Rate limiting en memoria (README.md issue "Rate limiting en endpoints
 * públicos"). Suficiente mientras el servidor corre como un solo proceso
 * (desarrollo local o un único servidor Node); en un despliegue
 * serverless con múltiples instancias (varias funciones de Vercel
 * corriendo en paralelo) cada una tendría su propio contador, así que
 * el límite real efectivo sería más alto que el configurado — ahí hace
 * falta un store compartido (ej. Upstash Redis) en vez de este Map.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

// Evita que el Map crezca sin límite si nunca se reinicia el proceso.
const MAX_TRACKED_KEYS = 50_000;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Demasiadas solicitudes, intenta de nuevo más tarde." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
