/**
 * Conecta un dominio personalizado directo al proyecto de Vercel vía
 * su API (issue #29 — automatizar el paso que antes había que hacer
 * a mano en Vercel → Settings → Domains). Requiere VERCEL_API_TOKEN
 * (Account Settings → Tokens, sin expiración) y VERCEL_PROJECT_ID
 * (Project Settings → General); si no están configurados, se omite
 * en silencio y el admin sigue pudiendo conectarlo a mano como antes.
 */
export async function addDomainToVercelProject(
  domain: string,
): Promise<{ ok: true; skipped?: boolean } | { ok: false; error: string }> {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    return { ok: true, skipped: true };
  }

  const teamId = process.env.VERCEL_TEAM_ID;
  const qs = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";

  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains${qs}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: domain }),
  });

  if (res.ok) return { ok: true };

  const data = await res.json().catch(() => null);
  // La API de Vercel anida el error bajo `error` (código HTTP real:
  // 409, no 400 como sugiere la doc genérica) — probado contra la API
  // real con un dominio ya conectado.
  const code: string | undefined = data?.error?.code;
  const errorProjectId: string | undefined = data?.error?.projectId;
  const message: string = data?.error?.message ?? `Vercel respondió con el estado ${res.status}`;

  // Ya está conectado a ESTE MISMO proyecto (ej. se guardó dos veces,
  // o se reintenta tras un fallo parcial) — no es un error real. Si
  // está en uso por OTRO proyecto, sí se reporta como error.
  if (code === "domain_already_in_use" && errorProjectId === projectId) {
    return { ok: true };
  }

  return { ok: false, error: message };
}
