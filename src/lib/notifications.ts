import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import type { PriceBreakdown } from "@/lib/pricing";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/errorReporting";

/**
 * Notifica por correo a los administradores de la cuenta cuando llega una
 * nueva cotización (README.md sección 6.4). Usa Resend (servicio
 * transaccional gestionado, sección 10) si RESEND_API_KEY está configurado;
 * si no, solo deja constancia en logs para no romper el flujo en desarrollo.
 */
export async function notifyNewQuote(params: {
  developmentId: string;
  developmentName: string;
  modelName: string;
  finishNames?: string[];
  extraNames: string[];
  breakdown: PriceBreakdown;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
}) {
  const account = await prisma.account.findFirst({
    where: { developments: { some: { id: params.developmentId } } },
    include: { members: { where: { role: "ADMINISTRADOR" } } },
  });
  const recipients = account?.members.map((m) => m.email) ?? [];

  const subject = `Nueva cotización: ${params.developmentName}`;
  const lines = [
    `Modelo: ${params.modelName}`,
    params.finishNames?.length ? `Acabados: ${params.finishNames.join(", ")}` : null,
    params.extraNames.length ? `Extras: ${params.extraNames.join(", ")}` : null,
    `Total: ${params.breakdown.total}`,
    `Cliente: ${params.customerName} · ${params.customerEmail}${
      params.customerPhone ? ` · ${params.customerPhone}` : ""
    }`,
  ].filter(Boolean);
  const text = lines.join("\n");

  if (!recipients.length) {
    logger.warn("notifyNewQuote: sin administradores a quién notificar", {
      developmentId: params.developmentId,
    });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    logger.warn("notifyNewQuote: RESEND_API_KEY no configurado, se omite el envío", {
      developmentId: params.developmentId,
      subject,
    });
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.NOTIFICATIONS_FROM_EMAIL ?? "notificaciones@modula.app",
      to: recipients,
      subject,
      text,
    });
  } catch (error) {
    captureException(error, { where: "notifyNewQuote", developmentId: params.developmentId });
  }
}
