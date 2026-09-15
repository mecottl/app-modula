"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSessionAccount, requireDevelopmentForSession } from "@/lib/tenant";
import { slugify } from "@/lib/slug";
import { generateProjectToken } from "@/lib/tokens";
import { uploadDevelopmentImage } from "@/lib/supabaseStorage";
import { addDomainToVercelProject } from "@/lib/vercelDomains";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(64).optional(),
  currency: z.string().min(3).max(6).default("MXN"),
});

export async function createDevelopment(formData: FormData) {
  const { accountId } = await requireSessionAccount();

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    currency: formData.get("currency") || "MXN",
  });
  if (!parsed.success) {
    redirect(`/dashboard/developments?error=${encodeURIComponent("Datos inválidos")}`);
  }

  const baseSlug = slugify(parsed.data.slug || parsed.data.name);
  let slug = baseSlug || `desarrollo-${Date.now()}`;
  let suffix = 1;
  while (await prisma.development.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++suffix}`;
  }

  const development = await prisma.development.create({
    data: {
      accountId,
      name: parsed.data.name,
      slug,
      currency: parsed.data.currency,
      status: "BORRADOR",
      integrationSettings: {
        create: {
          mode: "HOSPEDADA",
          environment: "VISTA_PREVIA",
          token: generateProjectToken(),
        },
      },
    },
  });

  revalidatePath("/dashboard/developments");
  redirect(`/dashboard/developments/${development.id}/general`);
}

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/)
  .optional()
  .or(z.literal(""));

const generalSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
});

export async function updateDevelopmentGeneral(developmentId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId);

  const parsed = generalSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    redirect(
      `/dashboard/developments/${developmentId}/general?error=${encodeURIComponent(
        "Revisa los campos del formulario",
      )}`,
    );
  }

  await prisma.development.update({
    where: { id: developmentId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
    },
  });

  revalidatePath(`/dashboard/developments/${developmentId}`);
  redirect(`/dashboard/developments/${developmentId}/general?ok=1`);
}

/**
 * Marca: lo que ve el comprador en la página pública (logo, colores,
 * texto del CTA) — separado de General (nombre/descripción/estado) en
 * su propia pestaña para no mezclar identidad administrativa con
 * identidad visual (issue "separar general y marca en 2").
 */
const brandSchema = z.object({
  ctaText: z.string().max(80).optional().or(z.literal("")),
  primaryColor: hexColor,
  accentColor: hexColor,
});

export async function updateDevelopmentBrand(developmentId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId);

  const parsed = brandSchema.safeParse({
    ctaText: formData.get("ctaText"),
    primaryColor: formData.get("primaryColor"),
    accentColor: formData.get("accentColor"),
  });
  if (!parsed.success) {
    redirect(
      `/dashboard/developments/${developmentId}/brand?error=${encodeURIComponent(
        "Revisa los campos del formulario",
      )}`,
    );
  }

  await prisma.development.update({
    where: { id: developmentId },
    data: {
      ctaText: parsed.data.ctaText || null,
      primaryColor: parsed.data.primaryColor || null,
      accentColor: parsed.data.accentColor || null,
    },
  });

  revalidatePath(`/dashboard/developments/${developmentId}`);
  redirect(`/dashboard/developments/${developmentId}/brand?ok=1`);
}

/**
 * Configuración avanzada: campos que no afectan lo que ve el comprador
 * de inmediato (moneda, webhook de integración con un CRM externo) —
 * separados del formulario principal de General y marca para no
 * abrumar el flujo de creación/edición común (issue "quitar campos
 * innecesarios de la pantalla principal").
 */
const advancedSchema = z.object({
  currency: z.string().min(3).max(6),
  webhookUrl: z.string().url().max(500).optional().or(z.literal("")),
});

export async function updateDevelopmentAdvanced(developmentId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId);

  const parsed = advancedSchema.safeParse({
    currency: formData.get("currency"),
    webhookUrl: formData.get("webhookUrl"),
  });
  if (!parsed.success) {
    redirect(
      `/dashboard/developments/${developmentId}/general?error=${encodeURIComponent(
        "Revisa los campos de configuración avanzada",
      )}`,
    );
  }

  await prisma.development.update({
    where: { id: developmentId },
    data: {
      currency: parsed.data.currency,
      webhookUrl: parsed.data.webhookUrl || null,
    },
  });

  revalidatePath(`/dashboard/developments/${developmentId}`);
  redirect(`/dashboard/developments/${developmentId}/general?ok=1`);
}

/**
 * Sube el logo del desarrollo a Supabase Storage (bucket
 * "development-media") y guarda la URL pública resultante. Reemplaza el
 * campo de texto libre "URL del logo" por un botón de subir imagen real
 * (issue "botón de subir imagen en vez de pegar URL").
 */
export async function uploadDevelopmentLogo(developmentId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId);

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona una imagen");
  }

  const logoUrl = await uploadDevelopmentImage(developmentId, file);

  await prisma.development.update({ where: { id: developmentId }, data: { logoUrl } });
  revalidatePath(`/dashboard/developments/${developmentId}`);
  return logoUrl;
}

export async function publishDevelopment(developmentId: string) {
  await requireDevelopmentForSession(developmentId);

  const activeModels = await prisma.model.count({
    where: { developmentId, active: true },
  });
  if (activeModels === 0) {
    redirect(
      `/dashboard/developments/${developmentId}/general?error=${encodeURIComponent(
        "Agrega al menos un modelo activo antes de publicar",
      )}`,
    );
  }

  await prisma.development.update({
    where: { id: developmentId },
    data: { status: "PUBLICADO" },
  });
  revalidatePath(`/dashboard/developments/${developmentId}`);
}

export async function unpublishDevelopment(developmentId: string) {
  await requireDevelopmentForSession(developmentId);
  await prisma.development.update({
    where: { id: developmentId },
    data: { status: "BORRADOR" },
  });
  revalidatePath(`/dashboard/developments/${developmentId}`);
}

function backToIntegration(
  developmentId: string,
  message?: string,
  kind: "error" | "ok" = "error",
): never {
  const qs = message ? `?${kind}=${encodeURIComponent(message)}` : "";
  redirect(`/dashboard/developments/${developmentId}/integration/custom-domain${qs}`);
}

// Hostname simple: letras/dígitos/guiones por segmento, separados por
// puntos, sin protocolo ni ruta — lo que el usuario pega en su DNS.
const domainSchema = z
  .string()
  .min(3)
  .max(255)
  .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i);

/**
 * Dominio personalizado para servir el configurador público (Plan A)
 * bajo el dominio propio de la desarrolladora en vez del de MODULA
 * (issue #29). Exclusivo de Plan Profesional, mismo gate que
 * Integración. Guardar un dominio nuevo genera un token de
 * verificación y borra cualquier verificación previa — hay que
 * volver a probar que se controla el dominio antes de servir nada ahí
 * (ver verifyDevelopmentDomain).
 */
export async function setDevelopmentDomain(developmentId: string, formData: FormData) {
  const development = await requireDevelopmentForSession(developmentId);
  const account = await prisma.account.findUniqueOrThrow({ where: { id: development.accountId } });
  if (account.plan !== "PROFESIONAL") {
    backToIntegration(developmentId, "Dominio personalizado es exclusivo del Plan Profesional");
  }

  const raw = String(formData.get("customDomain") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const parsed = domainSchema.safeParse(raw);
  if (!parsed.success) {
    backToIntegration(developmentId, "Ingresa un dominio válido, ej. cotiza.tuempresa.com");
  }

  const existing = await prisma.development.findUnique({ where: { customDomain: parsed.data! } });
  if (existing && existing.id !== developmentId) {
    backToIntegration(developmentId, "Ese dominio ya está en uso por otro desarrollo");
  }

  await prisma.development.update({
    where: { id: developmentId },
    data: {
      customDomain: parsed.data!,
      customDomainToken: generateProjectToken(),
      customDomainVerifiedAt: null,
    },
  });

  const vercelResult = await addDomainToVercelProject(parsed.data!);

  revalidatePath(`/dashboard/developments/${developmentId}/integration/custom-domain`);
  if (!vercelResult.ok) {
    // El dominio ya quedó guardado — solo falló conectarlo en Vercel,
    // así que se avisa pero no se bloquea el flujo: el admin puede
    // agregarlo a mano en Settings → Domains como respaldo.
    backToIntegration(
      developmentId,
      `Dominio guardado, pero no se pudo conectar en Vercel automáticamente (${vercelResult.error}). Agrégalo a mano en tu proyecto de Vercel.`,
    );
  }
  backToIntegration(
    developmentId,
    vercelResult.skipped
      ? "Dominio guardado. Agrega el registro TXT, conéctalo en Vercel y verifica."
      : "Dominio guardado y conectado en Vercel. Agrega el registro TXT y verifica.",
    "ok",
  );
}

/**
 * Confirma, vía un registro TXT en el DNS del dominio, que quien lo
 * configuró de verdad lo controla — sin esto, cualquiera podría
 * escribir el dominio de un tercero y MODULA empezaría a servir
 * contenido ahí (resolveDevelopmentByHost en src/lib/publicAccess.ts
 * solo considera dominios con customDomainVerifiedAt).
 */
export async function verifyDevelopmentDomain(developmentId: string) {
  const development = await requireDevelopmentForSession(developmentId);
  if (!development.customDomain || !development.customDomainToken) {
    backToIntegration(developmentId, "Primero guarda un dominio");
  }

  const dns = await import("node:dns/promises");
  let records: string[][] = [];
  try {
    records = await dns.resolveTxt(`_modula-verify.${development.customDomain}`);
  } catch {
    backToIntegration(
      developmentId,
      "No encontramos el registro TXT todavía. Puede tardar unos minutos en propagarse. Intenta de nuevo en un momento.",
    );
  }

  const found = records.some((chunks) => chunks.join("") === development.customDomainToken);
  if (!found) {
    backToIntegration(developmentId, "El registro TXT no coincide con el token esperado");
  }

  await prisma.development.update({
    where: { id: developmentId },
    data: { customDomainVerifiedAt: new Date() },
  });

  revalidatePath(`/dashboard/developments/${developmentId}/integration/custom-domain`);
  backToIntegration(developmentId, "Dominio verificado.", "ok");
}

export async function removeDevelopmentDomain(developmentId: string) {
  await requireDevelopmentForSession(developmentId);
  await prisma.development.update({
    where: { id: developmentId },
    data: { customDomain: null, customDomainToken: null, customDomainVerifiedAt: null },
  });
  revalidatePath(`/dashboard/developments/${developmentId}/integration/custom-domain`);
  backToIntegration(developmentId, "Dominio personalizado eliminado.", "ok");
}

/**
 * Elimina un desarrollo por completo — se lleva en cascada su catálogo
 * (modelos, acabados, extras, promociones), su integración y, sobre
 * todo, sus cotizaciones/leads ya recibidos (ver onDelete: Cascade en
 * schema.prisma). Solo un administrador puede hacerlo, y solo si
 * escribe el nombre exacto del desarrollo — mismo nivel de fricción
 * que borrar un repositorio en GitHub, para un borrado que no tiene
 * vuelta atrás.
 */
export async function deleteDevelopment(developmentId: string, formData: FormData) {
  const { role } = await requireSessionAccount();
  const development = await requireDevelopmentForSession(developmentId);

  if (role !== "ADMINISTRADOR") {
    redirect(
      `/dashboard/developments/${developmentId}/general?error=${encodeURIComponent(
        "Solo un administrador puede eliminar un desarrollo",
      )}`,
    );
  }

  const confirmName = String(formData.get("confirmName") ?? "");
  if (confirmName !== development.name) {
    redirect(
      `/dashboard/developments/${developmentId}/general?error=${encodeURIComponent(
        "El nombre no coincide, no se eliminó nada",
      )}`,
    );
  }

  await prisma.development.delete({ where: { id: developmentId } });

  revalidatePath("/dashboard/developments");
  redirect(`/dashboard/developments?ok=${encodeURIComponent("Desarrollo eliminado.")}`);
}
