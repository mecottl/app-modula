import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { calculateQuotePrice, PricingError } from "@/lib/pricing";
import { createTestTenant, deleteTestTenant } from "./fixtures";

type Tenant = Awaited<ReturnType<typeof createTestTenant>>;

let t: Tenant;
let other: Tenant;

beforeAll(async () => {
  t = await createTestTenant("pricing-a");
  other = await createTestTenant("pricing-b");
});

afterAll(async () => {
  await deleteTestTenant(t.account.id);
  await deleteTestTenant(other.account.id);
});

const node = (
  parentId: string | null,
  name: string,
  data: {
    priceDelta?: number;
    selectionMode?: "UNICA" | "MULTIPLE";
    restrictToModels?: boolean;
    modelIds?: string[];
  } = {},
) =>
  prisma.catalogNode.create({
    data: {
      developmentId: t.development.id,
      parentId,
      name,
      priceDelta: data.priceDelta ?? 0,
      selectionMode: data.selectionMode ?? "UNICA",
      restrictToModels: data.restrictToModels ?? false,
      modelLinks: data.modelIds ? { create: data.modelIds.map((modelId) => ({ modelId })) } : undefined,
    },
  });

const price = (optionIds: string[]) =>
  calculateQuotePrice({ developmentId: t.development.id, modelId: t.model.id, optionIds });

async function codeOf(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    if (e instanceof PricingError) return e.code;
    throw e;
  }
  return null;
}

describe("calculateQuotePrice (árbol de catálogo)", () => {
  it("suma el precio base más las hojas elegidas", async () => {
    const b = await price([t.catalogOption.id]);
    expect(Number(b.basePrice)).toBe(1_000_000);
    expect(Number(b.optionsDelta)).toBe(10_000);
    expect(Number(b.total)).toBe(1_010_000);
  });

  it("rechaza una raíz o un nodo con hijos (OPTION_NOT_FOUND)", async () => {
    expect(await codeOf(price([t.catalogRoot.id]))).toBe("OPTION_NOT_FOUND");
    const sub = await node(t.catalogRoot.id, "Sub no hoja");
    await node(sub.id, "Hija");
    expect(await codeOf(price([sub.id]))).toBe("OPTION_NOT_FOUND");
  });

  it("rechaza ids de otro tenant", async () => {
    expect(await codeOf(price([other.catalogOption.id]))).toBe("OPTION_NOT_FOUND");
  });

  it("UNICA rechaza dos hojas del mismo padre pero permite una en cada padre distinto", async () => {
    const root = await node(null, "Unica");
    const p1 = await node(root.id, "P1", { selectionMode: "UNICA" });
    const p2 = await node(root.id, "P2", { selectionMode: "UNICA" });
    const a = await node(p1.id, "A", { priceDelta: 1 });
    const b = await node(p1.id, "B", { priceDelta: 2 });
    const c = await node(p2.id, "C", { priceDelta: 4 });
    expect(await codeOf(price([a.id, b.id]))).toBe("OPTION_SINGLE_SELECT");
    const ok = await price([a.id, c.id]);
    expect(Number(ok.optionsDelta)).toBe(5);
  });

  it("MULTIPLE permite varias", async () => {
    const root = await node(null, "Multi", { selectionMode: "MULTIPLE" });
    const a = await node(root.id, "A", { priceDelta: 100 });
    const b = await node(root.id, "B", { priceDelta: 200 });
    const r = await price([a.id, b.id]);
    expect(Number(r.optionsDelta)).toBe(300);
  });

  it("cadena raíz > sub > hoja funciona y sections agrupa por nombre de raíz", async () => {
    const root = await node(null, "Interiores");
    const sub = await node(root.id, "Puertas");
    const leaf = await node(sub.id, "Tzalam", { priceDelta: 500 });
    const r = await price([leaf.id, t.catalogOption.id]);
    expect(Number(r.optionsDelta)).toBe(10_500);
    const s = Object.fromEntries(r.sections.map((x) => [x.name, Number(x.delta)]));
    expect(s["Interiores"]).toBe(500);
    expect(s[t.catalogRoot.name]).toBe(10_000);
  });

  it("restrictToModels en un ancestro oculta la hoja a otros modelos", async () => {
    const otherModel = await prisma.model.create({
      data: {
        developmentId: t.development.id,
        name: "[test] Otro modelo",
        areaM2: 80,
        bedrooms: 1,
        basePrice: 500_000,
      },
    });
    const root = await node(null, "Solo modelo", {
      selectionMode: "MULTIPLE",
      restrictToModels: true,
      modelIds: [t.model.id],
    });
    const leaf = await node(root.id, "Hoja", { priceDelta: 7 });
    const ok = await price([leaf.id]);
    expect(Number(ok.optionsDelta)).toBe(7);
    const code = await codeOf(
      calculateQuotePrice({ developmentId: t.development.id, modelId: otherModel.id, optionIds: [leaf.id] }),
    );
    expect(code).toBe("OPTION_NOT_APPLICABLE");
  });

  it("acepta finishOptionIds y extraIds heredados", async () => {
    const root = await node(null, "Legacy", { selectionMode: "MULTIPLE" });
    const a = await node(root.id, "A", { priceDelta: 3 });
    const b = await node(root.id, "B", { priceDelta: 4 });
    const r = await calculateQuotePrice({
      developmentId: t.development.id,
      modelId: t.model.id,
      finishOptionIds: [a.id],
      extraIds: [b.id],
    });
    expect(Number(r.optionsDelta)).toBe(7);
  });
});
