import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { PermissionKey } from "@/lib/permissions";

export class TenantAccessError extends Error {
  constructor(message = "No autorizado para este recurso") {
    super(message);
    this.name = "TenantAccessError";
  }
}

export interface SessionAccount {
  accountId: string;
  memberId: string;
  roleId: string;
  roleName: string;
  permissions: PermissionKey[];
}

/**
 * Resuelve la cuenta (tenant) de la sesión autenticada del dashboard.
 * Nunca confía en un `accountId`/`developmentId` enviado por el cliente:
 * siempre deriva del contexto de autenticación (ver README.md sección 9.1).
 *
 * Los permisos (issue #72) se leen frescos de la base en cada request en
 * vez de viajar en el JWT: como los roles son editables por el admin en
 * cualquier momento, hornear permisos en el token los dejaría
 * desactualizados hasta el próximo login — el mismo problema que
 * tokenVersion ya resuelve para la sesión completa, así que se aprovecha
 * la misma consulta.
 */
export async function requireSessionAccount(): Promise<SessionAccount> {
  const session = await auth();
  if (!session?.user?.accountId || !session.user.id) {
    throw new TenantAccessError("Sesión no autenticada");
  }

  // Si la contraseña cambió después de que se emitió este JWT (issue
  // #62), tokenVersion ya no coincide con el valor guardado en el
  // Member — el token sigue siendo válido para NextAuth (no expiró),
  // pero se trata como sesión inválida de todas formas, sin esperar a
  // que expire solo.
  const member = await prisma.member.findUnique({
    where: { id: session.user.id },
    select: { tokenVersion: true, roleId: true, role: { select: { name: true, permissions: true } } },
  });
  if (!member || member.tokenVersion !== session.user.tokenVersion) {
    throw new TenantAccessError("Sesión invalidada, vuelve a iniciar sesión");
  }

  return {
    accountId: session.user.accountId,
    memberId: session.user.id,
    roleId: member.roleId,
    roleName: member.role.name,
    permissions: member.role.permissions as PermissionKey[],
  };
}

/** Igual que `requireSessionAccount`, pero exige además un permiso puntual. */
export async function requirePermission(permission: PermissionKey): Promise<SessionAccount> {
  const session = await requireSessionAccount();
  if (!session.permissions.includes(permission)) {
    throw new TenantAccessError("Tu rol no tiene permiso para esta acción");
  }
  return session;
}

/**
 * Verifica que el `developmentId` solicitado pertenece a la cuenta de la
 * sesión autenticada y devuelve el desarrollo. Lanza `TenantAccessError`
 * si no pertenece, en lugar de dejar que la consulta cruce cuentas.
 */
export async function requireDevelopmentForSession(developmentId: string, permission?: PermissionKey) {
  const session = permission ? await requirePermission(permission) : await requireSessionAccount();
  const development = await prisma.development.findFirst({
    where: { id: developmentId, accountId: session.accountId },
  });
  if (!development) {
    throw new TenantAccessError("El desarrollo no pertenece a la cuenta autenticada");
  }
  return development;
}

/**
 * Resuelve un desarrollo público a partir de su slug y token de proyecto,
 * usado por el configurador público (Plan A) y el widget (Plan B) — nunca
 * autenticado por sesión, sino por el token propio del desarrollo.
 */
export async function requireDevelopmentByToken(slug: string, token: string) {
  const development = await prisma.development.findFirst({
    where: { slug, integrationSettings: { token } },
    include: { integrationSettings: true },
  });
  if (!development) {
    throw new TenantAccessError("Desarrollo o token inválido");
  }
  return development;
}
