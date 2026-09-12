/**
 * Valida si un dominio (origen del embed) está en la lista blanca del
 * desarrollo (README.md sección 9.3). Acepta coincidencia exacta o de
 * subdominio: "ejemplo.com" en la lista autoriza también a
 * "www.ejemplo.com" y "app.ejemplo.com".
 */
export function isDomainAuthorized(hostname: string, authorizedDomains: string[]): boolean {
  const host = hostname.toLowerCase();
  return authorizedDomains.some((raw) => {
    const domain = raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!domain) return false;
    return host === domain || host.endsWith(`.${domain}`);
  });
}

export function extractHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
