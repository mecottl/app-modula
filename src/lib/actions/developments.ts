"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSessionAccount, requireDevelopmentForSession } from "@/lib/tenant";
import { slugify } from "@/lib/slug";
import { generateProjectToken } from "@/lib/tokens";

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

const generalSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  currency: z.string().min(3).max(6),
  ctaText: z.string().max(80).optional().or(z.literal("")),
  primaryColor: z.string().max(20).optional().or(z.literal("")),
  accentColor: z.string().max(20).optional().or(z.literal("")),
  logoUrl: z.string().url().max(500).optional().or(z.literal("")),
});

export async function updateDevelopmentGeneral(developmentId: string, formData: FormData) {
  await requireDevelopmentForSession(developmentId);

  const parsed = generalSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    currency: formData.get("currency"),
    ctaText: formData.get("ctaText"),
    primaryColor: formData.get("primaryColor"),
    accentColor: formData.get("accentColor"),
    logoUrl: formData.get("logoUrl"),
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
      currency: parsed.data.currency,
      ctaText: parsed.data.ctaText || null,
      primaryColor: parsed.data.primaryColor || null,
      accentColor: parsed.data.accentColor || null,
      logoUrl: parsed.data.logoUrl || null,
    },
  });

  revalidatePath(`/dashboard/developments/${developmentId}`);
  redirect(`/dashboard/developments/${developmentId}/general?ok=1`);
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
