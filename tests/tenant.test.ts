import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

type FakeSession = { user: { id: string; accountId: string; role: string } } | null;

// `auth` de NextAuth está sobrecargado (uso normal vs. middleware), lo que
// choca con TypeScript al mockear su valor de retorno directamente. Se
// declara el mock con su propio tipo simple vía `vi.hoisted`, desacoplado
// del tipo real de `auth`.
const mockedAuth = vi.hoisted(() => vi.fn<() => Promise<FakeSession>>());
vi.mock("@/auth", () => ({ auth: mockedAuth }));

import {
  requireSessionAccount,
  requireDevelopmentForSession,
  TenantAccessError,
} from "@/lib/tenant";
import { createTestTenant, deleteTestTenant } from "./fixtures";

function sessionFor(accountId: string, memberId: string, role = "ADMINISTRADOR"): FakeSession {
  return { user: { id: memberId, accountId, role } };
}

describe("aislamiento multi-tenant — src/lib/tenant.ts", () => {
  let tenantA: Awaited<ReturnType<typeof createTestTenant>>;
  let tenantB: Awaited<ReturnType<typeof createTestTenant>>;

  beforeAll(async () => {
    tenantA = await createTestTenant("tenant-guard-a");
    tenantB = await createTestTenant("tenant-guard-b");
  });

  afterAll(async () => {
    await deleteTestTenant(tenantA.account.id);
    await deleteTestTenant(tenantB.account.id);
  });

  it("requireSessionAccount lanza TenantAccessError sin sesión", async () => {
    mockedAuth.mockResolvedValue(null);
    await expect(requireSessionAccount()).rejects.toBeInstanceOf(TenantAccessError);
  });

  it("requireSessionAccount devuelve la cuenta de la sesión autenticada", async () => {
    mockedAuth.mockResolvedValue(sessionFor(tenantA.account.id, tenantA.member.id));
    const result = await requireSessionAccount();
    expect(result.accountId).toBe(tenantA.account.id);
  });

  it("requireDevelopmentForSession resuelve un desarrollo de la propia cuenta", async () => {
    mockedAuth.mockResolvedValue(sessionFor(tenantA.account.id, tenantA.member.id));
    const dev = await requireDevelopmentForSession(tenantA.development.id);
    expect(dev.id).toBe(tenantA.development.id);
  });

  it("requireDevelopmentForSession RECHAZA un desarrollo de OTRA cuenta", async () => {
    // La sesión pertenece a la cuenta A, pero pide el desarrollo de la B.
    mockedAuth.mockResolvedValue(sessionFor(tenantA.account.id, tenantA.member.id));
    await expect(requireDevelopmentForSession(tenantB.development.id)).rejects.toBeInstanceOf(
      TenantAccessError,
    );
  });

  it("requireDevelopmentForSession RECHAZA un developmentId inexistente", async () => {
    mockedAuth.mockResolvedValue(sessionFor(tenantA.account.id, tenantA.member.id));
    await expect(requireDevelopmentForSession("id-que-no-existe")).rejects.toBeInstanceOf(
      TenantAccessError,
    );
  });
});
