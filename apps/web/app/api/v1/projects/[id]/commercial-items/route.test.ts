import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import * as commercialService from "@/lib/domain/commercial/commercial.service";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "owner",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));

vi.mock("@/lib/domain/commercial/commercial.service");

describe("GET /api/v1/projects/:id/commercial-items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(commercialService.listCommercialItems).mockResolvedValue({
      data: [],
      error: null,
    });
  });

  it("returns list", async () => {
    const res = await GET(new Request("https://test/api/v1/projects/p1/commercial-items"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.data).toEqual([]);
  });
});

describe("POST /api/v1/projects/:id/commercial-items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when body incomplete", async () => {
    const res = await POST(
      new Request("https://test/api/v1/projects/p1/commercial-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(400);
  });
});
