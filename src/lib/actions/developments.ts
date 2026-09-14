"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSessionAccount, requireDevelopmentForSession } from "@/lib/tenant";
import { slugify } from "@/lib/slug";
import { generateProjectToken } from "@/lib/tokens";
import { uploadDevelopmentImage } from "@/lib/supabaseStorage";

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
