import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { name: "Acme" }, error: null }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "tenant-1",
    userId: "user-1",
    role: "admin",
  }),
}));

vi.mock("@/lib/tenant/tenant.types", () => ({
  isTenantContextPresent: vi.fn().mockReturnValue(true),
}));

describe("GET /api/v1/me", () => {
  it("includes additive tenant_name", async () => {
    const res = await GET(new Request("https://test/api/v1/me"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: {
        tenant_id: "tenant-1",
        user_id: "user-1",
        role: "admin",
        tenant_name: "Acme",
      },
    });
  });
});
