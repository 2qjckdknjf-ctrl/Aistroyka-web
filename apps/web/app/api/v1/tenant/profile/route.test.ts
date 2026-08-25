import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PATCH } from "./route";

const maybeSingleMock = vi.fn();
const eqMock = vi.fn();
const updateEqMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({
    from: (table: string) => {
      if (table !== "tenants") return {};
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: maybeSingleMock,
          }),
        }),
        update: () => ({
          eq: updateEqMock,
        }),
      };
    },
  }),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "tenant-1",
    userId: "user-1",
    role: "member",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  authorize: vi.fn().mockReturnValue(true),
}));

describe("GET /api/v1/tenant/profile", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset();
  });

  it("returns workspace name for a tenant member", async () => {
    maybeSingleMock.mockResolvedValue({ data: { name: "StroyInvest" }, error: null });
    const res = await GET(new Request("https://test/api/v1/tenant/profile"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { name: "StroyInvest" } });
  });
});

describe("PATCH /api/v1/tenant/profile", () => {
  beforeEach(() => {
    updateEqMock.mockReset();
    updateEqMock.mockResolvedValue({ error: null });
  });

  it("updates workspace name", async () => {
    const res = await PATCH(
      new Request("https://test/api/v1/tenant/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Co" }),
      })
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { name: "New Co" } });
  });
});
