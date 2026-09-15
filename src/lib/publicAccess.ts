import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * Resuelve un desarrollo para el configurador público (Plan A/B) a partir
 * de su slug. Solo es accesible si está "Publicado" (sección 6.2), salvo
 * en modo vista previa: ahí se omite esa validación, pero únicamente para
 * un usuario autenticado del dashboard que pertenezca a la cuenta dueña
 * del desarrollo (sección 6.3 / issue "Modo vista previa por defecto").
 */
export async function resolvePublicDevelopment(slug: string, preview: boolean) {
  const development = await prisma.development.findUnique({ where: { slug } });
  if (!development) return null;

  if (development.status === "PUBLICADO") return development;

  if (preview) {
    const session = await auth();
    if (session?.user?.accountId === development.accountId) {
      return development;
    }
  }

  return null;
}

/**
 * Resuelve un desarrollo por su dominio personalizado (issue #29,
 * ver setDevelopmentDomain/verifyDevelopmentDomain en
 * actions/developments.ts) — solo dominios ya verificados por TXT, para
 * no servir contenido bajo un dominio que alguien escribió sin
 * demostrar que lo controla.
 */
export async function resolveDevelopmentByHost(host: string | null) {
  if (!host) return null;
  return prisma.development.findFirst({
    where: { customDomain: host.toLowerCase(), customDomainVerifiedAt: { not: null } },
  });
}
