"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/tenant";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/errorReporting";
import { escapeHtml, renderEmailHtml } from "@/lib/emailTemplate";

class MembersAccessError extends Error {}

function back(message?: string, kind: "error" | "ok" = "error") {
  const qs = message ? `?${kind}=${encodeURIComponent(message)}` : "";
  redirect(`/dashboard/members${qs}`);
}

async function requireManageMembers() {
  try {
    return await requirePermission("members.manage");
  } catch {
    throw new MembersAccessError("Tu rol no tiene permiso para gestionar miembros");
  }
}

/**
 * "Último administrador" ya no es un valor de enum fijo (issue #72) —
 * es cualquier miembro cuyo rol incluya members.manage, el permiso que
 * deja invitar/quitar gente y crear/editar roles. Sin al menos uno, la
 * cuenta queda sin nadie que pueda arreglar los permisos después.
 */
async function countMembersManageHolders(accountId: string) {
  return prisma.member.count({
    where: { accountId, role: { permissions: { has: "members.manage" } } },
  });
}

function generateTempPassword(): string {
  return crypto.randomBytes(9).toString("base64url");
}

async function sendInviteEmail(email: string, name: string, tempPassword: string) {
  const subject = "Te invitaron a MODULA";
  const text = `Hola ${name},\n\nYa tienes acceso al dashboard de MODULA.\n\nCorreo: ${email}\nContraseña temporal: ${tempPassword}\n\nInicia sesión y cámbiala en cuanto puedas.`;

  if (!process.env.RESEND_API_KEY) {
    logger.warn("sendInviteEmail: RESEND_API_KEY no configurado, se omite el envío", { email });
    return;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.NOTIFICATIONS_FROM_EMAIL ?? "notificaciones@modula.app",
      to: email,
      subject,
      text,
      html: renderEmailHtml({
        bodyHtml: `
          <p style="margin:0 0 12px;font-size:16px;font-weight:600;">Hola ${escapeHtml(name)},</p>
          <p style="margin:0 0 12px;">Ya tienes acceso al dashboard de MODULA.</p>
          <p style="margin:0 0 4px;">Correo: ${escapeHtml(email)}</p>
          <p style="margin:0 0 12px;">Contraseña temporal: <strong>${escapeHtml(tempPassword)}</strong></p>
          <p style="margin:0;">Inicia sesión y cámbiala en cuanto puedas.</p>
        `,
        ctaLabel: "Iniciar sesión",
        ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://modula.app"}/login`,
      }),
    });
  } catch (error) {
    captureException(error, { where: "sendInviteEmail", email });
  }
}

const inviteSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  roleId: z.string().min(1),
});

export async function inviteMember(formData: FormData) {
  let accountId: string;
  try {
    ({ accountId } = await requireManageMembers());
  } catch (error) {
    if (error instanceof MembersAccessError) back(error.message);
    throw error;
  }

  const parsed = inviteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    roleId: formData.get("roleId"),
  });
  if (!parsed.success) back("Revisa los campos del formulario");

  const role = await prisma.role.findFirst({ where: { id: parsed.data!.roleId, accountId } });
  if (!role) back("Rol inválido");

  const existing = await prisma.member.findUnique({ where: { email: parsed.data!.email } });
  if (existing) back("Ese correo ya tiene una cuenta");

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.member.create({
    data: {
      accountId,
      name: parsed.data!.name,
      email: parsed.data!.email,
      roleId: parsed.data!.roleId,
      passwordHash,
    },
  });

  await sendInviteEmail(parsed.data!.email, parsed.data!.name, tempPassword);

  revalidatePath("/dashboard/members");
  back("Miembro invitado. Se le envió su contraseña temporal por correo.", "ok");
}

export async function removeMember(memberId: string) {
  let accountId: string;
  let requesterId: string;
  try {
    ({ accountId, memberId: requesterId } = await requireManageMembers());
  } catch (error) {
    if (error instanceof MembersAccessError) back(error.message);
    throw error;
  }

  if (memberId === requesterId) back("No puedes quitarte a ti mismo");

  const target = await prisma.member.findFirst({
    where: { id: memberId, accountId },
    include: { role: { select: { permissions: true } } },
  });
  if (!target) back("Miembro no encontrado");

  if (target!.role.permissions.includes("members.manage")) {
    const holders = await countMembersManageHolders(accountId);
    if (holders <= 1) back("Debe quedar al menos un miembro que pueda gestionar miembros y roles");
  }

  await prisma.member.delete({ where: { id: memberId, accountId } });
  revalidatePath("/dashboard/members");
  back("Miembro eliminado.", "ok");
}
