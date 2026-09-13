import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

type FakeSession = { user: { id: string; accountId: string; role: string } } | null;

// Ver tests/tenant.test.ts para por qué se mockea con un tipo propio en
// vez de reutilizar el tipo (sobrecargado) real de `auth`.
const mockedAuth = vi.hoisted(() => vi.fn<() => Promise<FakeSession>>());
vi.mock("@/auth", () => ({ auth: mockedAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT (mock)");
  }),
}));

import { prisma } from "@/lib/prisma";
import { TenantAccessError } from "@/lib/tenant";
import { updateModel, deleteModel } from "@/lib/actions/models";
import { updateFinishLevel } from "@/lib/actions/finishes";
import { updatePromotion } from "@/lib/actions/promotions";
import { updateQuoteStatus, deleteQuoteData } from "@/lib/actions/quotes";
import { updateDevelopmentGeneral } from "@/lib/actions/developments";
import { createTestTenant, deleteTestTenant } from "./fixtures";

function sessionFor(accountId: string, memberId: string): FakeSession {
  return { user: { id: memberId, accountId, role: "ADMINISTRADOR" } };
}

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

/**
 * Pruebas de aislamiento multi-tenant (README.md sección 9.1 / issue
 * "Pruebas automatizadas de aislamiento multi-tenant"): una sesión
 * autenticada de la cuenta A intenta, a través de las mismas server
 * actions que usa el dashboard real, leer o modificar recursos que
 * pertenecen a la cuenta B. Todas deben rechazarse con
 * TenantAccessError SIN que el dato de B cambie.
 */
describe("aislamiento multi-tenant — server actions", () => {
  let tenantA: Awaited<ReturnType<typeof createTestTenant>>;
  let tenantB: Awaited<ReturnType<typeof createTestTenant>>;

  beforeAll(async () => {
    tenantA = await createTestTenant("actions-a");
    tenantB = await createTestTenant("actions-b");
  });

  afterAll(async () => {
    await deleteTestTenant(tenantA.account.id);
    await deleteTestTenant(tenantB.account.id);
  });

  function asTenantA() {
    mockedAuth.mockResolvedValue(sessionFor(tenantA.account.id, tenantA.member.id));
  }

  it("updateModel: la cuenta A no puede editar un modelo de la cuenta B", async () => {
    asTenantA();
    await expect(
      updateModel(
        tenantB.development.id,
        tenantB.model.id,
        formData({
          name: "Hackeado",
          areaM2: "999",
          bedrooms: "9",
          basePrice: "1",
          active: "on",
        }),
      ),
    ).rejects.toBeInstanceOf(TenantAccessError);

    const model = await prisma.model.findUniqueOrThrow({ where: { id: tenantB.model.id } });
    expect(model.name).toBe(tenantB.model.name);
  });

  it("deleteModel: la cuenta A no puede borrar un modelo de la cuenta B", async () => {
    asTenantA();
    await expect(
      deleteModel(tenantB.development.id, tenantB.model.id),
    ).rejects.toBeInstanceOf(TenantAccessError);

    const model = await prisma.model.findUnique({ where: { id: tenantB.model.id } });
    expect(model).not.toBeNull();
  });

  it("updateFinishLevel: la cuenta A no puede editar un acabado de la cuenta B", async () => {
    asTenantA();
    await expect(
      updateFinishLevel(
        tenantB.development.id,
        tenantB.finishLevel.id,
        formData({ name: "Hackeado", priceDelta: "0" }),
      ),
    ).rejects.toBeInstanceOf(TenantAccessError);

    const finishLevel = await prisma.finishLevel.findUniqueOrThrow({
      where: { id: tenantB.finishLevel.id },
    });
    expect(finishLevel.name).toBe(tenantB.finishLevel.name);
  });

  it("updatePromotion: la cuenta A no puede editar una promoción de la cuenta B", async () => {
    asTenantA();
    await expect(
      updatePromotion(
        tenantB.development.id,
        tenantB.promotion.id,
        formData({
          name: "Hackeado",
          type: "FIJO",
          value: "0",
          startDate: "2020-01-01",
          endDate: "2020-01-02",
          active: "on",
        }),
      ),
    ).rejects.toBeInstanceOf(TenantAccessError);

    const promotion = await prisma.promotion.findUniqueOrThrow({
      where: { id: tenantB.promotion.id },
    });
    expect(promotion.name).toBe(tenantB.promotion.name);
  });

  it("updateQuoteStatus: la cuenta A no puede cambiar el estado de un lead de la cuenta B", async () => {
    asTenantA();
    await expect(
      updateQuoteStatus(tenantB.development.id, tenantB.quote.id, formData({ status: "CERRADA" })),
    ).rejects.toBeInstanceOf(TenantAccessError);

    const quote = await prisma.quote.findUniqueOrThrow({ where: { id: tenantB.quote.id } });
    expect(quote.status).toBe("NUEVA");
  });

  it("deleteQuoteData: la cuenta A no puede borrar los datos de un lead de la cuenta B", async () => {
    asTenantA();
    await expect(
      deleteQuoteData(tenantB.development.id, tenantB.quote.id),
    ).rejects.toBeInstanceOf(TenantAccessError);

    const quote = await prisma.quote.findUnique({ where: { id: tenantB.quote.id } });
    expect(quote).not.toBeNull();
  });

  it("updateDevelopmentGeneral: la cuenta A no puede editar el desarrollo de la cuenta B", async () => {
    asTenantA();
    await expect(
      updateDevelopmentGeneral(
        tenantB.development.id,
        formData({ name: "Hackeado", currency: "MXN" }),
      ),
    ).rejects.toBeInstanceOf(TenantAccessError);

    const development = await prisma.development.findUniqueOrThrow({
      where: { id: tenantB.development.id },
    });
    expect(development.name).toBe(tenantB.development.name);
  });

  it("control positivo: la cuenta A SÍ puede editar sus propios recursos", async () => {
    asTenantA();
    await expect(
      updateFinishLevel(
        tenantA.development.id,
        tenantA.finishLevel.id,
        formData({ name: "Acabado editado por su dueño", description: "", priceDelta: "20000" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT (mock)"); // llega hasta el redirect() final = éxito

    const finishLevel = await prisma.finishLevel.findUniqueOrThrow({
      where: { id: tenantA.finishLevel.id },
    });
    expect(finishLevel.name).toBe("Acabado editado por su dueño");
  });
});
