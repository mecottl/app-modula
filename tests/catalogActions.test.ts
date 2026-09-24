import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

type FakeSession = { user: { id: string; accountId: string; tokenVersion: number } } | null;

const mockedAuth = vi.hoisted(() => vi.fn<() => Promise<FakeSession>>());
vi.mock("@/auth", () => ({ auth: mockedAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// El redirect real lanza una excepción; aquí se conserva la URL para poder
// distinguir el éxito (…/categories) de un error (…/categories?error=…).
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
}));

import { prisma } from "@/lib/prisma";
import { MAX_CATALOG_DEPTH } from "@/lib/planLimits";
import { createCatalogNode, updateCatalogNode, deleteCatalogNode } from "@/lib/actions/catalog";
import { createTestTenant, deleteTestTenant } from "./fixtures";

type Tenant = Awaited<ReturnType<typeof createTestTenant>>;

function fd(fields: Record<string, string>, modelIds: string[] = []) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  for (const id of modelIds) data.append("modelIds", id);
  return data;
}

/** Ejecuta la acción y devuelve la URL a la que redirigió. */
async function redirectOf(action: Promise<unknown>) {
  try {
    await action;
  } catch (error) {
    const message = (error as Error).message;
    if (message.startsWith("REDIRECT ")) return decodeURIComponent(message.slice("REDIRECT ".length));
    throw error;
  }
  throw new Error("La acción no redirigió");
}

describe("árbol de catálogo: acciones", () => {
  let tenant: Tenant;
  let other: Tenant;

  beforeAll(async () => {
    tenant = await createTestTenant("catalog-actions");
    other = await createTestTenant("catalog-actions-other");
  });

  afterAll(async () => {
    await deleteTestTenant(tenant.account.id);
    await deleteTestTenant(other.account.id);
  });

  function asTenant() {
    mockedAuth.mockResolvedValue({
      user: { id: tenant.member.id, accountId: tenant.account.id, tokenVersion: 0 },
    });
  }

  const devId = () => tenant.development.id;

  it("la raíz nunca cobra por sí misma y las opciones hijas sí", async () => {
    asTenant();
    const rootUrl = await redirectOf(
      createCatalogNode(devId(), null, fd({ name: "Raíz precio", priceDelta: "999", selectionMode: "MULTIPLE" })),
    );
    expect(rootUrl).not.toContain("error=");
    const root = await prisma.catalogNode.findFirstOrThrow({ where: { developmentId: devId(), name: "Raíz precio" } });
    expect(root.priceDelta.toString()).toBe("0");
    expect(root.selectionMode).toBe("MULTIPLE");

    await redirectOf(createCatalogNode(devId(), root.id, fd({ name: "Opción A", priceDelta: "1500" })));
    await redirectOf(createCatalogNode(devId(), root.id, fd({ name: "Opción B", priceDelta: "0" })));
    const children = await prisma.catalogNode.findMany({ where: { parentId: root.id }, orderBy: { order: "asc" } });
    expect(children.map((c) => [c.name, c.order, c.priceDelta.toString()])).toEqual([
      ["Opción A", 0, "1500"],
      ["Opción B", 1, "0"],
    ]);
  });

  it(`admite hasta ${MAX_CATALOG_DEPTH} niveles y rechaza el siguiente`, async () => {
    asTenant();
    let parentId: string | null = null;
    for (let level = 1; level <= MAX_CATALOG_DEPTH; level++) {
      const url = await redirectOf(createCatalogNode(devId(), parentId, fd({ name: `Nivel ${level}` })));
      expect(url).not.toContain("error=");
      parentId = (await prisma.catalogNode.findFirstOrThrow({ where: { developmentId: devId(), name: `Nivel ${level}` } })).id;
    }

    const tooDeep = await redirectOf(createCatalogNode(devId(), parentId, fd({ name: "Nivel demasiado profundo" })));
    expect(tooDeep).toContain("error=");
    expect(await prisma.catalogNode.count({ where: { developmentId: devId(), name: "Nivel demasiado profundo" } })).toBe(0);
  });

  it("no permite colgar un nodo de un padre de otro desarrollo", async () => {
    asTenant();
    const foreignParent = await prisma.catalogNode.create({
      data: { developmentId: other.development.id, name: "Padre ajeno" },
    });
    const url = await redirectOf(createCatalogNode(devId(), foreignParent.id, fd({ name: "Intruso" })));
    expect(url).toContain("error=");
    expect(await prisma.catalogNode.count({ where: { name: "Intruso" } })).toBe(0);
  });

  it("restricción por modelo: exige modelos válidos, ignora los de otra cuenta y se puede quitar", async () => {
    asTenant();
    // Solo un modelo ajeno: se descarta, queda vacío y se rechaza.
    const onlyForeign = await redirectOf(
      createCatalogNode(devId(), null, fd({ name: "Solo ajeno", restrictToModels: "on" }, [other.model.id])),
    );
    expect(onlyForeign).toContain("error=");
    expect(await prisma.catalogNode.count({ where: { name: "Solo ajeno" } })).toBe(0);

    await redirectOf(
      createCatalogNode(
        devId(),
        null,
        fd({ name: "Con modelo", restrictToModels: "on" }, [tenant.model.id, other.model.id]),
      ),
    );
    const node = await prisma.catalogNode.findFirstOrThrow({
      where: { developmentId: devId(), name: "Con modelo" },
      include: { modelLinks: true },
    });
    expect(node.restrictToModels).toBe(true);
    expect(node.modelLinks.map((l) => l.modelId)).toEqual([tenant.model.id]);

    // Quitar la restricción borra los vínculos.
    await redirectOf(updateCatalogNode(devId(), node.id, fd({ name: "Con modelo" })));
    const after = await prisma.catalogNode.findUniqueOrThrow({
      where: { id: node.id },
      include: { modelLinks: true },
    });
    expect(after.restrictToModels).toBe(false);
    expect(after.modelLinks).toHaveLength(0);
  });

  it("borrar un nodo borra todo lo que cuelga de él", async () => {
    asTenant();
    const root = await prisma.catalogNode.create({ data: { developmentId: devId(), name: "Borrar raíz" } });
    const mid = await prisma.catalogNode.create({ data: { developmentId: devId(), parentId: root.id, name: "Borrar medio" } });
    await prisma.catalogNode.create({ data: { developmentId: devId(), parentId: mid.id, name: "Borrar hoja" } });

    await redirectOf(deleteCatalogNode(devId(), root.id));
    expect(await prisma.catalogNode.count({ where: { name: { startsWith: "Borrar " } } })).toBe(0);
  });
});
