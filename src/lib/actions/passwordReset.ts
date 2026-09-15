"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { getBaseUrl } from "@/lib/baseUrl";
import { renderEmailHtml } from "@/lib/emailTemplate";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/errorReporting";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function getIp(): Promise<string> {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const emailSchema = z.string().email();

/**
 * Genera y envía un enlace de recuperación de contraseña de un solo
 * uso (issue #61) — hoy no existía ningún flujo para esto, un miembro
 * que olvidaba su contraseña dependía de que un administrador lo
 * volviera a invitar (y para el propio administrador, ni eso).
 *
 * Nunca revela si el correo existe o no en la respuesta (mismo
 * mensaje siempre) para no facilitar enumeración de cuentas.
 */
export async function requestPasswordReset(formData: FormData) {
  const ip = await getIp();
  const rate = checkRateLimit(`forgot-password:${ip}`, 5, 10 * 60_000);
  if (!rate.allowed) redirect("/forgot-password?ok=1");

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) redirect("/forgot-password?ok=1");

  const member = await prisma.member.findUnique({ where: { email: parsed.data } });
  if (!member) redirect("/forgot-password?ok=1");

  const rawToken = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      memberId: member.id,
      type: "PASSWORD_RESET",
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  if (process.env.RESEND_API_KEY) {
    const baseUrl = await getBaseUrl();
    const url = `${baseUrl}/reset-password?token=${rawToken}`;
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.NOTIFICATIONS_FROM_EMAIL ?? "notificaciones@modula.app",
        to: member.email,
        subject: "Recupera tu contraseña de MODULA",
        text: `Hola ${member.name}, entra a este enlace para elegir una contraseña nueva (vence en 1 hora): ${url}. Si no fuiste tú quien lo pidió, ignora este correo.`,
        html: renderEmailHtml({
          bodyHtml: `
            <p style="margin:0 0 12px;font-size:16px;font-weight:600;">Recupera tu contraseña</p>
            <p style="margin:0 0 12px;">Hola ${member.name}, alguien (con suerte tú) pidió cambiar la contraseña de tu cuenta en MODULA. El enlace vence en 1 hora.</p>
            <p style="margin:0;">Si no fuiste tú, ignora este correo, tu contraseña sigue igual.</p>
          `,
          ctaLabel: "Elegir nueva contraseña",
          ctaUrl: url,
        }),
      });
    } catch (error) {
      captureException(error, { where: "requestPasswordReset", memberId: member.id });
    }
  } else {
    logger.warn("requestPasswordReset: RESEND_API_KEY no configurado, se omite el envío", {
      memberId: member.id,
    });
  }

  redirect("/forgot-password?ok=1");
}

const resetSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z.string().min(8).max(72),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
  });

/**
 * Confirma el reseteo: valida el token de un solo uso, actualiza la
 * contraseña, e incrementa `tokenVersion` (issue #62) para que
 * cualquier sesión JWT ya emitida deje de ser válida de inmediato —
 * el mismo flujo que alguien usaría justo después de sospechar que su
 * cuenta fue comprometida no debería dejar viva una sesión robada.
 */
export async function resetPassword(formData: FormData) {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Revisa los campos del formulario";
    redirect(`/reset-password?token=${formData.get("token")}&error=${encodeURIComponent(message)}`);
  }

  const tokenHash = hashToken(parsed.data.token);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.type !== "PASSWORD_RESET" || record.usedAt || record.expiresAt < new Date()) {
    redirect("/forgot-password?error=" + encodeURIComponent("Ese enlace ya no es válido, pide uno nuevo"));
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.$transaction([
    prisma.member.update({
      where: { id: record.memberId },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    }),
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login?ok=" + encodeURIComponent("Contraseña actualizada. Inicia sesión."));
}
