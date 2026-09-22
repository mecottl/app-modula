import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import type { PriceBreakdown } from "@/lib/pricing";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/errorReporting";
import { renderEmailHtml } from "@/lib/emailTemplate";
import { formatMoney } from "@/lib/money";

const PLAN_LABELS: Record<string, string> = { BASICO: "Básico", PROFESIONAL: "Profesional" };

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

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
    include: { members: { where: { role: { permissions: { has: "quotes.manage" } } } } },
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
  const html = renderEmailHtml({
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:16px;font-weight:600;">Nueva cotización en ${params.developmentName}</p>
      <p style="margin:0 0 4px;">Modelo: ${params.modelName}</p>
      ${params.finishNames?.length ? `<p style="margin:0 0 4px;">Acabados: ${params.finishNames.join(", ")}</p>` : ""}
      ${params.extraNames.length ? `<p style="margin:0 0 4px;">Extras: ${params.extraNames.join(", ")}</p>` : ""}
      <p style="margin:0 0 4px;">Total: ${params.breakdown.total}</p>
      <p style="margin:12px 0 0;">Cliente: ${params.customerName}, ${params.customerEmail}${
        params.customerPhone ? `, ${params.customerPhone}` : ""
      }</p>
    `,
  });

  if (!recipients.length) {
    logger.warn("notifyNewQuote: sin administradores a quién notificar", {
      developmentId: params.developmentId,
    });
    return;
  }

  const resend = getResend();
  if (!resend) {
    logger.warn("notifyNewQuote: RESEND_API_KEY no configurado, se omite el envío", {
      developmentId: params.developmentId,
      subject,
    });
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.NOTIFICATIONS_FROM_EMAIL ?? "notificaciones@modula.app",
      to: recipients,
      subject,
      text,
      html,
    });
  } catch (error) {
    captureException(error, { where: "notifyNewQuote", developmentId: params.developmentId });
  }
}

/**
 * Confirma por correo al comprador que su cotización se recibió (issue
 * #65) — hasta ahora solo lo veía en pantalla, y si cerraba la pestaña
 * sin descargar el PDF no le quedaba nada. Incluye el enlace a la
 * página de vista de su cotización (/[slug]/cotizacion-cliente/[quoteId]).
 */
export async function notifyQuoteConfirmation(params: {
  developmentName: string;
  developmentSlug: string;
  quoteId: string;
  modelName: string;
  total: string;
  currency: string;
  customerName: string;
  customerEmail: string;
  baseUrl: string;
}) {
  const resend = getResend();
  if (!resend) {
    logger.warn("notifyQuoteConfirmation: RESEND_API_KEY no configurado, se omite el envío", {
      quoteId: params.quoteId,
    });
    return;
  }

  const url = `${params.baseUrl}/${params.developmentSlug}/cotizacion-cliente/${params.quoteId}`;
  const totalFormatted = formatMoney(params.total, params.currency);

  const html = renderEmailHtml({
    preheader: `Tu cotización de ${params.developmentName} por ${totalFormatted}`,
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:16px;font-weight:600;">¡Gracias, ${params.customerName}!</p>
      <p style="margin:0 0 12px;">Recibimos tu cotización de <strong>${params.modelName}</strong> en ${params.developmentName}, por un total de <strong>${totalFormatted}</strong>.</p>
      <p style="margin:0;">Nos pondremos en contacto contigo pronto. Puedes revisar el detalle completo de tu cotización cuando quieras:</p>
    `,
    ctaLabel: "Ver mi cotización",
    ctaUrl: url,
  });

  try {
    await resend.emails.send({
      from: process.env.NOTIFICATIONS_FROM_EMAIL ?? "notificaciones@modula.app",
      to: params.customerEmail,
      subject: `Tu cotización de ${params.developmentName}`,
      text: `Gracias, ${params.customerName}. Recibimos tu cotización de ${params.modelName} por ${totalFormatted}. Puedes verla aquí: ${url}`,
      html,
    });
  } catch (error) {
    captureException(error, { where: "notifyQuoteConfirmation", quoteId: params.quoteId });
  }
}

/**
 * Bienvenida a la desarrolladora cuando su cuenta pasa a ACTIVO por
 * primera vez (issue #65) — se manda solo en la transición, no cada
 * vez que se confirma la suscripción, para no repetirla en cada
 * recarga de /checkout/success.
 */
export async function notifyAccountWelcome(params: {
  memberEmail: string;
  memberName: string;
  accountName: string;
  plan: string;
  baseUrl: string;
}) {
  const resend = getResend();
  if (!resend) {
    logger.warn("notifyAccountWelcome: RESEND_API_KEY no configurado, se omite el envío", {
      email: params.memberEmail,
    });
    return;
  }

  const planLabel = PLAN_LABELS[params.plan] ?? params.plan;
  const html = renderEmailHtml({
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:16px;font-weight:600;">¡Bienvenido a MODULA, ${params.memberName}!</p>
      <p style="margin:0 0 12px;">Tu cuenta ${params.accountName} ya está activa en Plan ${planLabel}. Puedes empezar a configurar tu catálogo cuando quieras.</p>
    `,
    ctaLabel: "Ir al dashboard",
    ctaUrl: `${params.baseUrl}/dashboard`,
  });

  try {
    await resend.emails.send({
      from: process.env.NOTIFICATIONS_FROM_EMAIL ?? "notificaciones@modula.app",
      to: params.memberEmail,
      subject: "Bienvenido a MODULA",
      text: `¡Bienvenido a MODULA, ${params.memberName}! Tu cuenta ${params.accountName} ya está activa en Plan ${planLabel}. Entra al dashboard: ${params.baseUrl}/dashboard`,
      html,
    });
  } catch (error) {
    captureException(error, { where: "notifyAccountWelcome", email: params.memberEmail });
  }
}
