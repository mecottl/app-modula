"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, TenantAccessError } from "@/lib/tenant";
import { isPermissionKey } from "@/lib/permissions";

function back(message?: string, kind: "error" | "ok" = "error") {
  const qs = message ? `?${kind}=${encodeURIComponent(message)}` : "";
  redirect(`/dashboard/members/roles${qs}`);
}

function permissionsFromForm(formData: FormData) {
  return formData.getAll("permissions").map(String).filter(isPermissionKey);
}

export async function createRole(formData: FormData) {
  let accountId: string;
  try {
    ({ accountId } = await requirePermission("members.manage"));
  } catch (error) {
    if (error instanceof TenantAccessError) back(error.message);
    throw error;
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 60) back("Ponle un nombre al rol (máx. 60 caracteres)");

  await prisma.role.create({ data: { accountId, name, permissions: permissionsFromForm(formData) } });

  revalidatePath("/dashboard/members/roles");
  back("Rol creado.", "ok");
}

export async function updateRole(roleId: string, formData: FormData) {
  let accountId: string;
  try {
    ({ accountId } = await requirePermission("members.manage"));
  } catch (error) {
    if (error instanceof TenantAccessError) back(error.message);
    throw error;
  }

  const role = await prisma.role.findFirst({ where: { id: roleId, accountId } });
  if (!role) back("Rol no encontrado");

  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 60) back("Ponle un nombre al rol (máx. 60 caracteres)");
  const permissions = permissionsFromForm(formData);

  // Si este rol pierde members.manage, que quede otro rol con gente
  // asignada que sí lo tenga — si no, nadie podría volver a tocar
  // permisos ni miembros de la cuenta.
  if (role!.permissions.includes("members.manage") && !permissions.includes("members.manage")) {
    const membersInThisRole = await prisma.member.count({ where: { roleId } });
    if (membersInThisRole > 0) {
      const otherHolders = await prisma.member.count({
        where: { accountId, roleId: { not: roleId }, role: { permissions: { has: "members.manage" } } },
      });
      if (otherHolders === 0) {
        back("Debe quedar al menos un miembro con permiso de gestionar miembros y roles");
      }
    }
  }

  await prisma.role.update({ where: { id: roleId }, data: { name, permissions } });

  revalidatePath("/dashboard/members/roles");
  revalidatePath("/dashboard/members");
  back("Rol actualizado.", "ok");
}

export async function deleteRole(roleId: string) {
  let accountId: string;
  try {
    ({ accountId } = await requirePermission("members.manage"));
  } catch (error) {
    if (error instanceof TenantAccessError) back(error.message);
    throw error;
  }

  const role = await prisma.role.findFirst({
    where: { id: roleId, accountId },
    include: { _count: { select: { members: true } } },
  });
  if (!role) back("Rol no encontrado");
  if (role!._count.members > 0) back("Reasigna a los miembros de este rol antes de eliminarlo");

  await prisma.role.delete({ where: { id: roleId } });

  revalidatePath("/dashboard/members/roles");
  back("Rol eliminado.", "ok");
}
