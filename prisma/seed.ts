import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const account = await prisma.account.create({
    data: {
      name: "Desarrolladora Demo",
      plan: "BASICO",
      billingStatus: "TRIAL",
      members: {
        create: {
          name: "Admin Demo",
          email: "admin@demo.com",
          passwordHash,
          role: "ADMINISTRADOR",
        },
      },
    },
  });

  const development = await prisma.development.create({
    data: {
      accountId: account.id,
      name: "Residencial Los Encinos",
      slug: "los-encinos",
      status: "PUBLICADO",
      currency: "MXN",
      ctaText: "Cotiza tu casa",
      integrationSettings: {
        create: {
          mode: "HOSPEDADA",
          environment: "VISTA_PREVIA",
          token: crypto.randomBytes(24).toString("hex"),
          authorizedDomains: [],
        },
      },
    },
  });

  const model = await prisma.model.create({
    data: {
      developmentId: development.id,
      name: "Modelo Roble",
      areaM2: 120,
      bedrooms: 3,
      basePrice: 1850000,
      active: true,
    },
  });

  const finishLevel = await prisma.finishLevel.create({
    data: {
      developmentId: development.id,
      name: "Acabados Premium",
      priceDelta: 150000,
    },
  });

  const extra = await prisma.extra.create({
    data: {
      developmentId: development.id,
      name: "Cocina integral",
      priceDelta: 60000,
      modelLinks: { create: { modelId: model.id } },
    },
  });

  await prisma.promotion.create({
    data: {
      developmentId: development.id,
      name: "Lanzamiento",
      type: "PORCENTAJE",
      value: 5,
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      active: true,
    },
  });

  console.log("Seed listo:");
  console.log(`  Cuenta:   ${account.name} (${account.id})`);
  console.log("  Login:    admin@demo.com / demo1234");
  console.log(`  Desarrollo: /${development.slug}`);
  console.log(`  Modelo:   ${model.name} (${model.id})`);
  console.log(`  Acabado:  ${finishLevel.name} (${finishLevel.id})`);
  console.log(`  Extra:    ${extra.name} (${extra.id})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
