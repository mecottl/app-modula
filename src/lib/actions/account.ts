"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { requireSessionAccount } from "@/lib/tenant";
import { signIn } from "@/auth";
import { getBaseUrl } from "@/lib/baseUrl";
import { renderEmailHtml } from "@/lib/emailTemplate";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/errorReporting";

const EMAIL_CHANGE_TTL_MS = 60 * 60 * 1000; // 1 hora

function back(message?: string, kind: "error" | "ok" = "error") {
  const qs = message ? `?${kind}=${encodeURIComponent(message)}` : "";
  redirect(`/dashboard/account${qs}`);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const nameSchema = z.string().min(2).max(120);

export async function updateAccountName(formData: FormData) {
  const { memberId } = await requireSessionAccount();

  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) back("Revisa el nombre");

  await prisma.member.update({ where: { id: memberId }, data: { name: parsed.data! } });

  revalidatePath("/dashboard/account");
  back("Nombre actualizado.", "ok");
}

const emailSchema = z.string().email();

/**
 * Cambiar el correo ya no se aplica al instante (issue #63) — el
 * correo es también el identificador de login, así que aplicar el
 * cambio sin confirmar que la persona controla esa dirección nueva
 * dejaría tomar una cuenta con solo tener una sesión abierta. Se
 * genera un token de un solo uso, se manda a la dirección NUEVA, y
 * también se avisa a la ANTERIOR (alerta de seguridad, sin bloquear
 * el flujo). El correo de login sigue siendo el actual hasta que se
 * confirma desde ese enlace (confirmEmailChange).
 */
export async function requestEmailChange(formData: FormData) {
  const { memberId } = await requireSessionAccount();

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) back("Ingresa un correo válido");

  const member = await prisma.member.findUniqueOrThrow({ where: { id: memberId } });
  if (parsed.data === member.email) back("Ese ya es tu correo actual");

  const existing = await prisma.member.findUnique({ where: { email: parsed.data! } });
  if (existing) back("Ese correo ya lo usa otra cuenta");

  // Un solo cambio pendiente a la vez: el nuevo reemplaza cualquier
  // solicitud anterior sin confirmar.
  await prisma.verificationToken.deleteMany({
    where: { memberId, type: "EMAIL_CHANGE", usedAt: null },
  });

  const rawToken = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      memberId,
      type: "EMAIL_CHANGE",
      tokenHash: hashToken(rawToken),
      payload: parsed.data!,
      expiresAt: new Date(Date.now() + EMAIL_CHANGE_TTL_MS),
    },
  });

  if (process.env.RESEND_API_KEY) {
    const baseUrl = await getBaseUrl();
    const url = `${baseUrl}/confirm-email-change?token=${rawToken}`;
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.NOTIFICATIONS_FROM_EMAIL ?? "notificaciones@modula.app",
        to: parsed.data!,
        subject: "Confirma tu correo nuevo en MODULA",
        text: `Hola ${member.name}, confirma que este es tu correo nuevo para tu cuenta de MODULA (vence en 1 hora): ${url}`,
        html: renderEmailHtml({
          bodyHtml: `
            <p style="margin:0 0 12px;font-size:16px;font-weight:600;">Confirma tu correo nuevo</p>
            <p style="margin:0;">Hola ${member.name}, pediste cambiar el correo de tu cuenta en MODULA a esta dirección. El enlace vence en 1 hora.</p>
          `,
          ctaLabel: "Confirmar correo nuevo",
          ctaUrl: url,
        }),
      });
      await resend.emails.send({
        from: process.env.NOTIFICATIONS_FROM_EMAIL ?? "notificaciones@modula.app",
        to: member.email,
        subject: "Alguien pidió cambiar el correo de tu cuenta MODULA",
        text: `Se pidió cambiar el correo de tu cuenta a ${parsed.data}. Si no fuiste tú, entra a tu cuenta y revisa tu contraseña.`,
        html: renderEmailHtml({
          bodyHtml: `
            <p style="margin:0 0 12px;font-size:16px;font-weight:600;">Aviso de seguridad</p>
            <p style="margin:0;">Se pidió cambiar el correo de tu cuenta en MODULA a <strong>${parsed.data}</strong>. Si no fuiste tú, cambia tu contraseña cuanto antes.</p>
          `,
        }),
      });
    } catch (error) {
      captureException(error, { where: "requestEmailChange", memberId });
    }
  } else {
    logger.warn("requestEmailChange: RESEND_API_KEY no configurado, se omite el envío", { memberId });
  }

  revalidatePath("/dashboard/account");
  back("Te mandamos un correo a la dirección nueva para confirmar.", "ok");
}

export async function cancelEmailChange() {
  const { memberId } = await requireSessionAccount();
  await prisma.verificationToken.deleteMany({
    where: { memberId, type: "EMAIL_CHANGE", usedAt: null },
  });
  revalidatePath("/dashboard/account");
  back("Cambio de correo cancelado.", "ok");
}

/**
 * Confirma el cambio de correo desde el enlace mandado a la dirección
 * nueva — página pública (src/app/confirm-email-change/page.tsx), no
 * requiere sesión activa: quien recibió el correo puede confirmarlo
 * desde cualquier dispositivo.
 */
export async function confirmEmailChange(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const tokenHash = hashToken(token);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.type !== "EMAIL_CHANGE" || record.usedAt || record.expiresAt < new Date() || !record.payload) {
    redirect("/confirm-email-change?error=" + encodeURIComponent("Ese enlace ya no es válido"));
  }

  const stillFree = await prisma.member.findUnique({ where: { email: record.payload! } });
  if (stillFree && stillFree.id !== record.memberId) {
    redirect("/confirm-email-change?error=" + encodeURIComponent("Ese correo ya lo usa otra cuenta"));
  }

  await prisma.$transaction([
    prisma.member.update({ where: { id: record.memberId }, data: { email: record.payload! } }),
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  redirect("/login?ok=" + encodeURIComponent("Correo actualizado. Inicia sesión con tu correo nuevo."));
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas nuevas no coinciden",
  });

export async function updateAccountPassword(formData: FormData) {
  const { memberId } = await requireSessionAccount();

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) back(parsed.error.issues[0]?.message ?? "Revisa los campos del formulario");

  const member = await prisma.member.findUniqueOrThrow({ where: { id: memberId } });
  const valid = await bcrypt.compare(parsed.data!.currentPassword, member.passwordHash);
  if (!valid) back("La contraseña actual no es correcta");

  const passwordHash = await bcrypt.hash(parsed.data!.newPassword, 10);
  // tokenVersion sube (issue #62): invalida cualquier otra sesión JWT
  // ya emitida con la contraseña anterior. Re-emitimos la sesión de
  // este mismo navegador ahora mismo (mismo patrón que register.ts)
  // para que no se cierre también a sí misma en el acto.
  await prisma.member.update({
    where: { id: memberId },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });
  await signIn("credentials", {
    email: member.email,
    password: parsed.data!.newPassword,
    redirect: false,
  });

  back("Contraseña actualizada. Cerramos cualquier otra sesión abierta.", "ok");
}
