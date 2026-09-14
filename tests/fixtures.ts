import { prisma } from "@/lib/prisma";
import { generateProjectToken } from "@/lib/tokens";

/**
 * Crea un tenant de prueba completo y aislado (cuenta + desarrollo +
 * modelo + acabado + promoción + cotización) para las pruebas de
 * aislamiento multi-tenant. Cada llamada usa nombres únicos (`label`)
 * para poder correr varios archivos de prueba en paralelo sin chocar.
 */
export async function createTestTenant(label: string) {
  const account = await prisma.account.create({
    data: { name: `[test] Cuenta ${label}` },
  });

  const member = await prisma.member.create({
    data: {
      accountId: account.id,
      name: `[test] Admin ${label}`,
      email: `test-${label}-${account.id}@example.com`,
      passwordHash: "not-used-in-tests",
      role: "ADMINISTRADOR",
    },
  });

  const development = await prisma.development.create({
    data: {
      accountId: account.id,
      name: `[test] Desarrollo ${label}`,
      slug: `test-${label}-${account.id}`,
      status: "PUBLICADO",
      integrationSettings: {
        create: { token: generateProjectToken() },
      },
    },
  });

  const model = await prisma.model.create({
    data: {
      developmentId: development.id,
      name: `[test] Modelo ${label}`,
      areaM2: 100,
      bedrooms: 2,
      basePrice: 1_000_000,
    },
  });

  const finishLevel = await prisma.finishLevel.create({
    data: { developmentId: development.id, name: `[test] Acabado ${label}`, priceDelta: 10_000 },
  });

  const promotion = await prisma.promotion.create({
    data: {
      developmentId: development.id,
      name: `[test] Promo ${label}`,
      code: `TEST-${label}`.toUpperCase().replace(/[^A-Z0-9-]/g, "-"),
      type: "PORCENTAJE",
      value: 5,
      startDate: new Date(Date.now() - 86_400_000),
      endDate: new Date(Date.now() + 86_400_000),
    },
  });

  const quote = await prisma.quote.create({
    data: {
      developmentId: development.id,
      modelId: model.id,
      total: 1_000_000,
      customerName: `[test] Cliente ${label}`,
      customerEmail: `cliente-${label}@example.com`,
      customerPhone: "5555555555",
      originPlan: "A",
    },
  });

  return { account, member, development, model, finishLevel, promotion, quote };
}

export async function deleteTestTenant(accountId: string) {
  // onDelete: Cascade en Account -> developments/members y en
  // Development -> models/finishLevels/promotions/quotes/etc. se
  // encarga del resto.
  await prisma.account.delete({ where: { id: accountId } }).catch(() => {
    // ya pudo haber sido borrado por otra prueba del mismo archivo
  });
}
